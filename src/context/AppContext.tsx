import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ScreenView,
  Ticket,
  SystemNotification,
  UserSession,
  TicketPriority,
  ServiceQueue,
  ServiceStatus,
  DatabaseFolder,
  DatabaseNote,
  CalendarEvent,
  UserAccount,
  ArticleItem,
  CategoryGroup,
  TicketAttachment,
  TISession,
  TISecurityLog,
  VaultCredential,
  WhatsAppConnection,
  WhatsAppConnectionStatus,
  AttendanceConversation,
  AttendanceMessage,
  AttendanceQueue,
  AttendanceContact,
  ChatbotFlow,
  BusinessHoursConfig,
  SenderType
} from '../types';
import {
  INITIAL_TICKETS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SERVICES,
  INITIAL_DATABASE_FOLDERS,
  INITIAL_DATABASE_NOTES,
  INITIAL_CALENDAR_EVENTS,
  INITIAL_KB_DATA
} from '../data/mockData';
import { supabase } from '../lib/supabase';
import { whatsappProvider } from '../lib/whatsappProvider';
import { ChatbotEngine } from '../lib/chatbotEngine';


interface AppContextType {
  currentScreen: ScreenView;
  setCurrentScreen: (screen: ScreenView) => void;
  userSession: UserSession;
  login: (username: string, role?: 'admin' | 'technician' | 'client', customUserData?: Partial<UserAccount>) => void;
  logout: () => void;
  // Managed Users (Cadastro & Permissões de Usuários)
  managedUsers: UserAccount[];
  addManagedUser: (userData: Omit<UserAccount, 'id'>) => UserAccount;
  updateManagedUser: (id: string, updates: Partial<UserAccount>) => void;
  deleteManagedUser: (id: string) => void;
  tickets: Ticket[];
  addTicket: (ticketData: Omit<Ticket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'messages'>) => Ticket;
  updateTicketStatus: (ticketId: string, status: Ticket['status'], technicianNote?: string) => void;
  reassignTicket: (ticketId: string, queue?: ServiceQueue, assignedTo?: string, note?: string) => void;
  deleteTicket: (ticketId: string) => void;
  addTicketMessage: (ticketId: string, text: string, role: 'client' | 'ti', attachments?: TicketAttachment[]) => void;
  notifications: SystemNotification[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  activeToast: SystemNotification | null;
  dismissToast: () => void;
  triggerSystemNotification: (title: string, message: string, company: string, priority: TicketPriority, ticketId?: string) => void;
  selectedCategoryFilter: string | null;
  setSelectedCategoryFilter: (category: string | null) => void;
  services: ServiceStatus[];
  toggleServiceStatus: (serviceId: string) => void;
  kbCategories: CategoryGroup[];
  updateKBCategories: (categories: CategoryGroup[]) => void;
  selectedTicket: Ticket | null;
  setSelectedTicket: (ticket: Ticket | null) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  // Base de Dados (Pastas & Bloco de Notas)
  folders: DatabaseFolder[];
  notes: DatabaseNote[];
  addFolder: (name: string, color?: string) => DatabaseFolder;
  updateFolder: (id: string, name: string, color?: string) => void;
  deleteFolder: (id: string) => void;
  addNote: (folderId: string, title: string, content: string, tags?: string[]) => DatabaseNote;
  updateNote: (id: string, updates: Partial<DatabaseNote>) => void;
  deleteNote: (id: string) => void;
  // Cofre de Senhas & Gerenciamento Seguro de Credenciais
  vaultCredentials: VaultCredential[];
  addVaultCredential: (credData: Omit<VaultCredential, 'id' | 'updatedAt'>) => VaultCredential;
  updateVaultCredential: (id: string, updates: Partial<VaultCredential>) => void;
  deleteVaultCredential: (id: string) => void;
  // Calendário & Lembretes
  calendarEvents: CalendarEvent[];
  addCalendarEvent: (eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'notified'>) => CalendarEvent;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;
  triggerCalendarEventReminder: (eventId: string) => void;
  // Configurações (Categorias e Subcategorias)
  ticketCategories: { id: number; name: string; subcategories: string[]; defaultPriority: TicketPriority }[];
  addTicketCategory: (name: string, initialSubcategories?: string[], defaultPriority?: TicketPriority) => void;
  editTicketCategory: (id: number, name: string, subcategories: string[]) => void;
  addSubCategory: (categoryId: number, subcategoryName: string) => void;
  deleteSubCategory: (categoryId: number, subcategoryName: string) => void;
  deleteTicketCategory: (id: number) => void;
  // Central de Atendimento WhatsApp & Chatbot
  whatsappConnection: WhatsAppConnection;
  whatsappServerUrl: string;
  updateWhatsappServerUrl: (url: string) => void;
  attendanceConversations: AttendanceConversation[];
  attendanceMessages: AttendanceMessage[];
  attendanceQueues: AttendanceQueue[];
  attendanceContacts: AttendanceContact[];
  chatbotFlow: ChatbotFlow;
  businessHours: BusinessHoursConfig;
  connectWhatsApp: () => Promise<void>;
  disconnectWhatsApp: () => Promise<void>;
  sendAttendanceMessage: (conversationId: string, content: string, senderType?: SenderType) => void;
  assignConversation: (conversationId: string, userId: string, userName: string) => void;
  transferConversation: (conversationId: string, targetQueueId?: string, targetQueueName?: string, targetUserName?: string) => void;
  closeConversation: (conversationId: string) => void;
  toggleBotState: (conversationId: string, active: boolean) => void;
  saveChatbotFlow: (flow: ChatbotFlow) => void;
  publishChatbotFlow: (flow: ChatbotFlow) => void;
  updateBusinessHours: (config: Partial<BusinessHoursConfig>) => void;
  saveAttendanceQueue: (queue: AttendanceQueue) => void;
  // Configurações & Notificações de E-mail (Gmail / SMTP)
  getEmailConfig: () => Promise<any>;
  saveEmailConfig: (config: any) => Promise<any>;
  disconnectEmailConfig: () => Promise<any>;
  testEmailConnection: (customConfig?: any, testRecipient?: string) => Promise<any>;
  dispatchTicketEmail: (params: {
    to: string;
    actionType: 'CREATED' | 'STARTED' | 'PAUSED' | 'COMPLETED' | 'MESSAGE_ADDED' | 'STATUS_CHANGED';
    ticket: Ticket;
    technicianName?: string;
    note?: string;
    messageText?: string;
    attachments?: TicketAttachment[];
  }) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // FIRST SCREEN MUST BE 'portal_landing' (Image 9) as explicitly requested by user!
  const [currentScreen, setCurrentScreen] = useState<ScreenView>('portal_landing');

  // User Session
  const [userSession, setUserSession] = useState<UserSession>(() => {
    const saved = localStorage.getItem('godesc_session');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return {
      isAuthenticated: false,
      username: '',
      name: '',
      email: '',
      role: 'client'
    };
  });

  // Initial default managed users
  const DEFAULT_MANAGED_USERS: UserAccount[] = [
    {
      id: 'usr-ceo',
      name: 'CEO (Direção Geral)',
      username: 'admin.ceo',
      password: 'ceo',
      email: 'ceo@godesc.com.br',
      role: 'ceo',
      allowedModules: ['ti_dashboard', 'ti_tickets', 'ti_queue', 'ti_database', 'ti_calendar', 'knowledge_base', 'system_status', 'ti_config', 'ti_new_ticket'],
      permissions: { canAccessConfig: true, canEditTickets: true, canDeleteTickets: true, canManageUsers: true, canManageCategories: true, canViewAllKanbans: true },
      createdAt: '01/01/2026'
    },
    {
      id: 'usr-gestor',
      name: 'Gestor de T.I',
      username: 'admin.gestor',
      password: 'gestor',
      email: 'gestor@godesc.com.br',
      role: 'gestor',
      allowedModules: ['ti_dashboard', 'ti_tickets', 'ti_queue', 'ti_database', 'ti_calendar', 'knowledge_base', 'system_status', 'ti_config', 'ti_new_ticket'],
      permissions: { canAccessConfig: true, canEditTickets: true, canDeleteTickets: true, canManageUsers: true, canManageCategories: true, canViewAllKanbans: true },
      createdAt: '01/01/2026'
    },
    {
      id: 'usr-ti',
      name: 'Técnico T.I',
      username: 't.i',
      password: 't.i',
      email: 't.i@godesc.com.br',
      role: 'admin',
      allowedModules: ['ti_dashboard', 'ti_tickets', 'ti_queue', 'ti_database', 'ti_calendar', 'knowledge_base', 'system_status', 'ti_config', 'ti_new_ticket'],
      permissions: { canAccessConfig: true, canEditTickets: true, canDeleteTickets: true, canManageUsers: true, canManageCategories: true, canViewAllKanbans: true },
      createdAt: '01/01/2026'
    },
    {
      id: 'usr-n3',
      name: 'Analista N3 - Infraestrutura',
      username: 'tec.n3',
      password: 'n3',
      email: 'n3@godesc.com.br',
      role: 'n3',
      allowedModules: ['ti_dashboard', 'ti_tickets', 'ti_queue', 'ti_database', 'ti_calendar', 'knowledge_base', 'system_status', 'ti_new_ticket'],
      permissions: { canAccessConfig: false, canEditTickets: true, canDeleteTickets: false, canManageUsers: false, canManageCategories: false, canViewAllKanbans: false },
      createdAt: '01/01/2026'
    },
    {
      id: 'usr-n2',
      name: 'Analista N2 - Sistemas',
      username: 'tec.n2',
      password: 'n2',
      email: 'n2@godesc.com.br',
      role: 'n2',
      allowedModules: ['ti_dashboard', 'ti_tickets', 'ti_queue', 'ti_database', 'ti_calendar', 'knowledge_base', 'system_status', 'ti_new_ticket'],
      permissions: { canAccessConfig: false, canEditTickets: true, canDeleteTickets: false, canManageUsers: false, canManageCategories: false, canViewAllKanbans: false },
      createdAt: '01/01/2026'
    },
    {
      id: 'usr-n1',
      name: 'Analista N1 - Suporte',
      username: 'tec.n1',
      password: 'n1',
      email: 'n1@godesc.com.br',
      role: 'n1',
      allowedModules: ['ti_dashboard', 'ti_tickets', 'ti_queue', 'knowledge_base', 'ti_new_ticket'],
      permissions: { canAccessConfig: false, canEditTickets: false, canDeleteTickets: false, canManageUsers: false, canManageCategories: false, canViewAllKanbans: false },
      createdAt: '01/01/2026'
    }
  ];

  // Managed Users state
  const [managedUsers, setManagedUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('godesc_managed_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { /* ignore */ }
    }
    return DEFAULT_MANAGED_USERS;
  });

  useEffect(() => {
    localStorage.setItem('godesc_managed_users', JSON.stringify(managedUsers));
  }, [managedUsers]);

  const addManagedUser = (userData: Omit<UserAccount, 'id'>): UserAccount => {
    const newUser: UserAccount = {
      ...userData,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toLocaleDateString('pt-BR')
    };

    setManagedUsers(prev => [...prev, newUser]);

    // Automatically create isolated Kanban board in localStorage for this user if missing
    const userKanbanKey = `godesc_kanban_tasks_${newUser.username}`;
    if (!localStorage.getItem(userKanbanKey)) {
      const defaultKanbanTasks = [
        {
          id: `task-${Date.now()}-1`,
          title: `Boas-vindas ao Kanban de ${newUser.name}`,
          description: `Quadro individual de atividades criado automaticamente para o usuário @${newUser.username}.`,
          priority: 'Média',
          status: 'Novo',
          createdAt: new Date().toLocaleDateString('pt-BR'),
          updatedAt: new Date().toLocaleDateString('pt-BR')
        }
      ];
      localStorage.setItem(userKanbanKey, JSON.stringify(defaultKanbanTasks));
    }

    return newUser;
  };

  const updateManagedUser = (id: string, updates: Partial<UserAccount>) => {
    setManagedUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  };

  const deleteManagedUser = (id: string) => {
    setManagedUsers(prev => prev.filter(u => u.id !== id));
  };

  const [ticketCategories, setTicketCategories] = useState<{ id: number; name: string; subcategories: string[]; defaultPriority: TicketPriority }[]>(() => {
    const saved = localStorage.getItem('godesc_ticket_categories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { /* ignore */ }
    }
    return [
      { id: 1, name: 'Software & Apps', subcategories: ['Office 365 / Outlook', 'ERP Corporativo / Protheus / SAP', 'Softwares Específicos', 'Lentidão no Sistema', 'Navegador / Certificado', 'Outro Software'], defaultPriority: 'Média' },
      { id: 2, name: 'Hardware & Equipamentos', subcategories: ['Impressora Offline / Fila Travada', 'Monitor / Segundo Vídeo', 'Teclado / Mouse / Periféricos', 'Notebook não liga / Superaquecendo', 'Telefonia IP / Headset', 'Outro Hardware'], defaultPriority: 'Média' },
      { id: 3, name: 'Rede & Conectividade', subcategories: ['VPN Corporativa / Falha de Conexão', 'Sem Acesso à Internet', 'Wi-Fi Corporativo Instável', 'Acesso Bloqueado a Sites/Sistemas', 'Pasta Compartilhada de Rede', 'Outro Problema de Rede'], defaultPriority: 'Alta' },
      { id: 4, name: 'Acessos & Contas', subcategories: ['Reset de Senha / AD', 'Desbloqueio de Usuário', 'Permissão em Pastas de Rede', 'Criação de Novo Usuário', 'Acesso a Email', 'Outro Acesso'], defaultPriority: 'Alta' },
      { id: 5, name: 'Infraestrutura & Servidores', subcategories: ['Servidor cPanel / Hospedagem', 'DNS / Apontamento de Domínio', 'Backup / Restauração de Dados', 'Banco de Dados Cloud', 'Outro Serviço de Infra'], defaultPriority: 'Crítica' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('godesc_ticket_categories', JSON.stringify(ticketCategories));
  }, [ticketCategories]);

  const addTicketCategory = (name: string, initialSubcategories: string[] = ['Geral'], defaultPriority: TicketPriority = 'Média') => {
    const cleanSubs = initialSubcategories.map(s => s.trim()).filter(Boolean);
    const subcategories = cleanSubs.length > 0 ? cleanSubs : ['Geral'];
    setTicketCategories(prev => [...prev, { id: Date.now(), name: name.trim(), subcategories, defaultPriority }]);
  };

  const editTicketCategory = (id: number, name: string, subcategories: string[]) => {
    setTicketCategories(prev => prev.map(cat => cat.id === id ? { ...cat, name: name.trim(), subcategories } : cat));
  };

  const addSubCategory = (categoryId: number, subcategoryName: string) => {
    const cleanName = subcategoryName.trim();
    if (!cleanName) return;
    setTicketCategories(prev =>
      prev.map(cat => {
        if (cat.id === categoryId) {
          if (cat.subcategories.includes(cleanName)) return cat;
          return { ...cat, subcategories: [...cat.subcategories, cleanName] };
        }
        return cat;
      })
    );
  };

  const deleteSubCategory = (categoryId: number, subcategoryName: string) => {
    setTicketCategories(prev =>
      prev.map(cat => {
        if (cat.id === categoryId) {
          const filtered = cat.subcategories.filter(s => s !== subcategoryName);
          return { ...cat, subcategories: filtered.length > 0 ? filtered : ['Geral'] };
        }
        return cat;
      })
    );
  };

  const deleteTicketCategory = (id: number) => {
    setTicketCategories(prev => prev.filter(c => c.id !== id));
  };

  // Companies State
  const [companies, setCompanies] = useState<{ id: number; name: string; cnpj: string; address: string }[]>(() => {
    const saved = localStorage.getItem('godesc_companies');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [
      { id: 1, name: 'Empresa Alpha Ltda', cnpj: '11.111.111/0001-11', address: 'Av. Paulista, 1000 - SP' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('godesc_companies', JSON.stringify(companies));
  }, [companies]);

  const addCompany = (company: { name: string; cnpj: string; address: string }) => {
    setCompanies(prev => [...prev, { id: Date.now(), ...company }]);
  };

  const deleteCompany = (id: number) => {
    setCompanies(prev => prev.filter(c => c.id !== id));
  };

  // Tickets state with Supabase & localStorage fallback
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    const saved = localStorage.getItem('godesc_tickets');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [];
  });


  // Notifications state
  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    const saved = localStorage.getItem('godesc_notifications');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_NOTIFICATIONS;
  });

  // Services state with localStorage fallback
  const [services, setServices] = useState<ServiceStatus[]>(() => {
    const saved = localStorage.getItem('godesc_services');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { /* ignore */ }
    }
    return INITIAL_SERVICES;
  });

  // KB Categories state with localStorage fallback & Realtime sync
  const [kbCategories, setKbCategories] = useState<CategoryGroup[]>(() => {
    const saved = localStorage.getItem('godesc_kb_categories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { /* ignore */ }
    }
    return INITIAL_KB_DATA;
  });

  // Base de Dados state
  const [folders, setFolders] = useState<DatabaseFolder[]>(() => {
    const saved = localStorage.getItem('godesc_db_folders');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_DATABASE_FOLDERS;
  });

  const [notes, setNotes] = useState<DatabaseNote[]>(() => {
    const saved = localStorage.getItem('godesc_db_notes');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_DATABASE_NOTES;
  });

  // Calendário state
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('godesc_calendar_events');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_CALENDAR_EVENTS;
  });

  // Active Toast (Bottom-right popup) - Default to null so no popup shows on app load
  const [activeToast, setActiveToast] = useState<SystemNotification | null>(null);

  // Auto-dismiss toast notification after 6 seconds
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  // Selected category filter
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  // Selected ticket for modal viewing
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Sound notifications
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Save state to localStorage safely
  useEffect(() => {
    try {
      localStorage.setItem('godesc_tickets', JSON.stringify(tickets));
    } catch (err) {
      console.warn('localStorage setItem godesc_tickets failed (quota or browser limit):', err);
    }
  }, [tickets]);

  useEffect(() => {
    try {
      localStorage.setItem('godesc_notifications', JSON.stringify(notifications));
    } catch (err) {
      console.warn('localStorage setItem godesc_notifications failed:', err);
    }
  }, [notifications]);

  // Initial Fetch & Realtime Sync from Supabase
  useEffect(() => {
    // Helper to extract requester email defensively
    const extractEmail = (item: any, msgs: any[]) => {
      const emailMsg = msgs.find((m: any) => m.requesterEmail);
      const raw = item.requester_email || item.client_email || item.requesterEmail || item.email || emailMsg?.requesterEmail || msgs[0]?.requesterEmail || '';
      return (raw || '').trim().toLowerCase();
    };

    // 1. Initial fetch tickets from Supabase
    const fetchSupabaseTickets = async () => {
      try {
        const { data, error } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          const filteredData = data.filter((item: any) => item.subject !== '__SYSTEM_VAULT_CREDENTIALS__' && item.subject !== '__SYSTEM_EMAIL_CONFIG__');
          const mapped: Ticket[] = filteredData.map((item: any) => {
            const msgs = item.messages || [];
            const reqEmail = extractEmail(item, msgs);
            const atts = (item.attachments && item.attachments.length > 0) ? item.attachments : (msgs[0]?.attachments || []);

            // Ensure first message has requesterEmail attached if client role
            const formattedMsgs = msgs.map((m: any, idx: number) => {
              if (idx === 0 && (!m.requesterEmail || !m.requesterEmail.trim())) {
                return { ...m, requesterEmail: reqEmail };
              }
              return m;
            });

            return {
              id: item.id,
              ticketNumber: item.ticket_number,
              requesterName: item.client_name || item.requester_name || 'Solicitante',
              requesterEmail: reqEmail,
              company: item.company || 'Empresa Corporativa',
              machineName: item.machine_name || '',
              onlyMeOnComputer: item.only_me_on_computer ?? true,
              category: item.category || 'Geral',
              subcategory: item.subcategory || 'Geral',
              priority: (item.priority || 'Média') as TicketPriority,
              status: (item.status || 'Novo') as Ticket['status'],
              title: item.subject || item.title || 'Sem título',
              description: item.description || '',
              createdAt: item.created_at || 'Hoje',
              updatedAt: item.updated_at || 'Hoje',
              queue: (item.queue || 'N1') as ServiceQueue,
              assignedTo: item.assigned_to,
              pausedReason: item.paused_reason,
              pausedAt: item.paused_at,
              attachments: atts,
              messages: formattedMsgs
            };
          });
          setTickets(mapped);
        } else if (error) {
          console.error('Supabase fetch error:', error);
        }
      } catch (err) {
        console.warn('Supabase fetch exception:', err);
      }
    };

    fetchSupabaseTickets();

    // 2. Realtime channel subscription
    const ticketChannel = supabase
      .channel('public:tickets')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newItem = payload.new;
            if (newItem.subject === '__SYSTEM_VAULT_CREDENTIALS__' || newItem.subject === '__SYSTEM_EMAIL_CONFIG__') return;
            const msgs = newItem.messages || [];
            const reqEmail = extractEmail(newItem, msgs);
            const atts = (newItem.attachments && newItem.attachments.length > 0) ? newItem.attachments : (msgs[0]?.attachments || []);

            const newTicket: Ticket = {
              id: newItem.id,
              ticketNumber: newItem.ticket_number,
              requesterName: newItem.client_name || newItem.requester_name || 'Solicitante',
              requesterEmail: reqEmail,
              company: newItem.company || 'Empresa Corporativa',
              machineName: newItem.machine_name || '',
              onlyMeOnComputer: newItem.only_me_on_computer ?? true,
              category: newItem.category || 'Geral',
              subcategory: newItem.subcategory || 'Geral',
              priority: (newItem.priority || 'Média') as TicketPriority,
              status: (newItem.status || 'Novo') as Ticket['status'],
              title: newItem.subject || newItem.title || 'Sem título',
              description: newItem.description || '',
              createdAt: newItem.created_at || 'Hoje',
              updatedAt: newItem.updated_at || 'Hoje',
              queue: (newItem.queue || 'N1') as ServiceQueue,
              assignedTo: newItem.assigned_to,
              pausedReason: newItem.paused_reason,
              pausedAt: newItem.paused_at,
              attachments: atts,
              messages: msgs
            };
            setTickets(prev => {
              if (prev.some(t => t.id === newTicket.id)) return prev;
              
              triggerSystemNotification(
                'Novo Chamado Recebido',
                `${newTicket.company || newTicket.requesterName} abriu o chamado ${newTicket.ticketNumber}.`,
                newTicket.company || newTicket.requesterName,
                newTicket.priority,
                newTicket.id
              );

              return [newTicket, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new;
            if (updated.subject === '__SYSTEM_VAULT_CREDENTIALS__' || updated.subject === '__SYSTEM_EMAIL_CONFIG__') return;
            const msgs = updated.messages || [];
            const reqEmail = extractEmail(updated, msgs);
            const atts = (updated.attachments && updated.attachments.length > 0) ? updated.attachments : (msgs[0]?.attachments || []);

            const updatedTicket: Ticket = {
              id: updated.id,
              ticketNumber: updated.ticket_number,
              requesterName: updated.client_name || updated.requester_name || 'Solicitante',
              requesterEmail: reqEmail,
              company: updated.company || 'Empresa Corporativa',
              machineName: updated.machine_name || '',
              onlyMeOnComputer: updated.only_me_on_computer ?? true,
              category: updated.category || 'Geral',
              subcategory: updated.subcategory || 'Geral',
              priority: (updated.priority || 'Média') as TicketPriority,
              status: (updated.status || 'Novo') as Ticket['status'],
              title: updated.subject || updated.title || 'Sem título',
              description: updated.description || '',
              createdAt: updated.created_at || 'Hoje',
              updatedAt: updated.updated_at || 'Hoje',
              queue: (updated.queue || 'N1') as ServiceQueue,
              assignedTo: updated.assigned_to,
              pausedReason: updated.paused_reason,
              pausedAt: updated.paused_at,
              attachments: atts,
              messages: msgs
            };
            setTickets(prev => prev.map(t => (t.id === updatedTicket.id ? updatedTicket : t)));
            setSelectedTicket(prev => (prev?.id === updatedTicket.id ? updatedTicket : prev));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setTickets(prev => prev.filter(t => t.id !== deletedId));
            setSelectedTicket(prev => (prev?.id === deletedId ? null : prev));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ticketChannel);
    };
  }, []);

  // Synchronize system services across clients in Realtime via Broadcast
  useEffect(() => {
    const statusChannel = supabase.channel('system_status_channel');

    statusChannel
      .on('broadcast', { event: 'service_status_changed' }, (payload) => {
        if (payload?.payload?.services && Array.isArray(payload.payload.services)) {
          setServices(payload.payload.services);
          localStorage.setItem('godesc_services', JSON.stringify(payload.payload.services));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(statusChannel);
    };
  }, []);

  // Synchronize Knowledge Base across clients in Realtime via Broadcast
  useEffect(() => {
    const kbChannel = supabase.channel('kb_sync_channel');

    kbChannel
      .on('broadcast', { event: 'kb_categories_changed' }, (payload) => {
        if (payload?.payload?.categories && Array.isArray(payload.payload.categories)) {
          setKbCategories(payload.payload.categories);
          localStorage.setItem('godesc_kb_categories', JSON.stringify(payload.payload.categories));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(kbChannel);
    };
  }, []);

  // Synchronize Tickets and Trigger T.I. Notifications in Realtime via Supabase Broadcast
  useEffect(() => {
    const ticketSyncChannel = supabase.channel('ticket_sync_channel');

    ticketSyncChannel
      .on('broadcast', { event: 'new_ticket_created' }, (payload) => {
        if (payload?.payload?.ticket) {
          const incomingTicket: Ticket = payload.payload.ticket;
          setTickets(prev => {
            if (prev.some(t => t.id === incomingTicket.id)) return prev;

            triggerSystemNotification(
              'Novo Chamado Recebido',
              `${incomingTicket.company || incomingTicket.requesterName} abriu o chamado ${incomingTicket.ticketNumber}.`,
              incomingTicket.company || incomingTicket.requesterName,
              incomingTicket.priority,
              incomingTicket.id
            );

            return [incomingTicket, ...prev];
          });
        }
      })
      .on('broadcast', { event: 'ticket_updated' }, (payload) => {
        if (payload?.payload?.ticket) {
          const updatedTicket: Ticket = payload.payload.ticket;
          setTickets(prev => prev.map(t => (t.id === updatedTicket.id ? updatedTicket : t)));
          setSelectedTicket(prev => (prev?.id === updatedTicket.id ? updatedTicket : prev));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ticketSyncChannel);
    };
  }, []);

  // Fetch & Subscribe to Vault Credentials in Supabase (with Dual-Strategy & Realtime fallback)
  useEffect(() => {
    const fetchSupabaseVault = async () => {
      try {
        // Strategy 1: Fetch from dedicated vault_credentials table if available
        const { data: vData, error: vErr } = await supabase
          .from('vault_credentials')
          .select('*')
          .order('created_at', { ascending: false });

        if (!vErr && vData && Array.isArray(vData) && vData.length > 0) {
          const mapped: VaultCredential[] = vData.map((item: any) => ({
            id: String(item.id),
            title: item.title || 'Sem título',
            company: item.company || 'Empresa ABC',
            category: item.category || 'E-mail',
            username: item.username || '',
            password: item.password || '',
            notes: item.notes || '',
            accessLevel: item.access_level || item.accessLevel || 'Todos',
            strength: item.strength || 'Média',
            updatedAt: item.updated_at || item.updatedAt || new Date().toLocaleString('pt-BR'),
            updatedBy: item.updated_by || item.updatedBy || 'T.I.'
          }));
          setVaultCredentials(mapped);
          localStorage.setItem('godesc_vault_credentials', JSON.stringify(mapped));
          return;
        }

        // Strategy 2: Fallback to system master record in tickets table (guarantees cross-machine cloud persistence)
        const { data: tData, error: tErr } = await supabase
          .from('tickets')
          .select('*')
          .eq('subject', '__SYSTEM_VAULT_CREDENTIALS__')
          .limit(1);

        if (!tErr && tData && tData.length > 0 && tData[0].description) {
          try {
            const parsed = JSON.parse(tData[0].description);
            if (Array.isArray(parsed)) {
              setVaultCredentials(parsed);
              localStorage.setItem('godesc_vault_credentials', JSON.stringify(parsed));
            }
          } catch (e) {}
        }
      } catch (err) {
        console.warn('Supabase vault fetch exception:', err);
      }
    };

    fetchSupabaseVault();

    // Postgres changes subscription for vault_credentials
    const vaultPostgresChannel = supabase
      .channel('public:vault_credentials')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vault_credentials' },
        () => {
          fetchSupabaseVault();
        }
      )
      .subscribe();

    // Postgres changes subscription for system ticket master record
    const ticketsPostgresChannel = supabase
      .channel('public:tickets:vault')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        (payload: any) => {
          if (payload?.new?.subject === '__SYSTEM_VAULT_CREDENTIALS__') {
            fetchSupabaseVault();
          }
        }
      )
      .subscribe();

    // Broadcast channel subscription across browser tabs/machines
    const vaultBroadcastChannel = supabase.channel('vault_sync_channel');
    vaultBroadcastChannel
      .on('broadcast', { event: 'vault_credentials_changed' }, (payload) => {
        if (payload?.payload?.credentials && Array.isArray(payload.payload.credentials)) {
          setVaultCredentials(payload.payload.credentials);
          localStorage.setItem('godesc_vault_credentials', JSON.stringify(payload.payload.credentials));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(vaultPostgresChannel);
      supabase.removeChannel(ticketsPostgresChannel);
      supabase.removeChannel(vaultBroadcastChannel);
    };
  }, []);


  useEffect(() => {
    localStorage.setItem('godesc_session', JSON.stringify(userSession));
  }, [userSession]);

  useEffect(() => {
    localStorage.setItem('godesc_db_folders', JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem('godesc_db_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('godesc_calendar_events', JSON.stringify(calendarEvents));
  }, [calendarEvents]);

  // Dedicated TI Session State & Persistence
  const [tiSession, setTiSession] = useState<TISession>(() => {
    const saved = localStorage.getItem('godesc_ti_session');
    if (saved) {
      try {
        const parsed: TISession = JSON.parse(saved);
        if (parsed.isAuthenticated && parsed.expiresAt > Date.now()) {
          return parsed;
        }
      } catch (e) { /* ignore */ }
    }
    return {
      isAuthenticated: false,
      username: '',
      name: '',
      email: '',
      role: 'client',
      loginAt: '',
      expiresAt: 0,
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0'
    };
  });

  // T.I Security Audit Logs State & Persistence
  const [auditLogs, setAuditLogs] = useState<TISecurityLog[]>(() => {
    const saved = localStorage.getItem('godesc_ti_audit_logs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) { /* ignore */ }
    }
    return [
      {
        id: 'log-init-1',
        timestamp: new Date().toLocaleString('pt-BR'),
        username: 'system',
        ip: '127.0.0.1',
        userAgent: 'GoDesc Security System v2.0',
        eventType: 'TI_LOGIN_SUCCESS',
        details: 'Sistema de Segurança Módulo T.I. inicializado com sucesso.',
        result: 'SUCCESS'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('godesc_ti_session', JSON.stringify(tiSession));
  }, [tiSession]);

  useEffect(() => {
    localStorage.setItem('godesc_ti_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  const addAuditLog = (logData: Omit<TISecurityLog, 'id' | 'timestamp' | 'ip' | 'userAgent'>) => {
    const newLog: TISecurityLog = {
      ...logData,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleString('pt-BR'),
      ip: '192.168.1.105',
      userAgent: window.navigator?.userAgent || 'Browser Client'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const checkTISessionValid = (): boolean => {
    if (!tiSession.isAuthenticated) return false;
    if (tiSession.expiresAt < Date.now()) {
      tiLogout();
      addAuditLog({
        username: tiSession.username || 'unknown',
        eventType: 'TI_SESSION_EXPIRED',
        details: 'Sessão do Módulo T.I. expirou por tempo de inatividade/validade.',
        result: 'EXPIRED'
      });
      return false;
    }
    return true;
  };

  const tiLogin = (usernameInput: string, passwordInput?: string) => {
    const cleanUser = usernameInput.trim().toLowerCase();
    const cleanPass = (passwordInput || '').trim();

    // 1. Locate user in managedUsers
    const userAccount = managedUsers.find(
      u => u.username.toLowerCase() === cleanUser || u.email.toLowerCase() === cleanUser
    );

    if (!userAccount) {
      addAuditLog({
        username: cleanUser || 'desconhecido',
        eventType: 'TI_LOGIN_FAILED',
        details: `Tentativa de login com usuário inexistente: '${cleanUser}'`,
        result: 'FAILED'
      });
      // Generic message to prevent username enumeration
      return { success: false, message: 'Credenciais inválidas. Verifique seu usuário e senha.' };
    }

    // 2. Check if account is locked persistently
    if (userAccount.locked) {
      addAuditLog({
        username: userAccount.username,
        eventType: 'TI_LOGIN_FAILED',
        details: `Tentativa de acesso em conta bloqueada. Bloqueada em: ${userAccount.locked_at || 'anteriormente'}`,
        result: 'ACCOUNT_LOCKED'
      });
      return {
        success: false,
        locked: true,
        message: `Conta bloqueada após 3 tentativas incorretas. Entre em contato com um administrador (CEO, Gestor ou T.I.) para realizar o desbloqueio.`
      };
    }

    // 3. Verify password
    const isPasswordValid = userAccount.password === cleanPass;

    if (!isPasswordValid) {
      const currentAttempts = (userAccount.failed_login_attempts || 0) + 1;
      const willLock = currentAttempts >= 3;
      const nowIso = new Date().toLocaleString('pt-BR');

      // Update user account lockout counter persistently
      setManagedUsers(prev =>
        prev.map(u => {
          if (u.id === userAccount.id) {
            return {
              ...u,
              failed_login_attempts: currentAttempts,
              last_failed_login_at: nowIso,
              locked: willLock ? true : u.locked,
              locked_at: willLock ? nowIso : u.locked_at
            };
          }
          return u;
        })
      );

      if (willLock) {
        addAuditLog({
          username: userAccount.username,
          eventType: 'TI_ACCOUNT_LOCKED',
          attemptNumber: currentAttempts,
          details: `Bloqueio automático ativado: 3 tentativas incorretas atingidas.`,
          result: 'ACCOUNT_LOCKED'
        });
        return {
          success: false,
          locked: true,
          message: `Conta bloqueada por segurança após 3 tentativas incorretas. Solicite o desbloqueio ao suporte/gestão.`
        };
      }

      addAuditLog({
        username: userAccount.username,
        eventType: 'TI_LOGIN_FAILED',
        attemptNumber: currentAttempts,
        details: `Senha incorreta (${currentAttempts}/3 tentativas).`,
        result: 'FAILED'
      });

      return {
        success: false,
        message: `Credenciais inválidas. Tentativa ${currentAttempts} de 3.`
      };
    }

    // 4. Successful Login - Reset attempts counter
    setManagedUsers(prev =>
      prev.map(u => {
        if (u.id === userAccount.id) {
          return {
            ...u,
            failed_login_attempts: 0,
            locked: false
          };
        }
        return u;
      })
    );

    const nowTimestamp = Date.now();
    // Session valid for 8 hours
    const expiresAt = nowTimestamp + 8 * 60 * 60 * 1000;

    const userRole = userAccount.role || 'admin';
    const userAllowedModules = userAccount.allowedModules || [
      'ti_dashboard', 'ti_tickets', 'ti_queue', 'ti_database', 'ti_calendar', 'knowledge_base', 'system_status', 'ti_config', 'ti_audit_logs', 'ti_new_ticket'
    ];
    const canUnlock = userRole === 'ceo' || userRole === 'gestor' || userRole === 'admin' || userAccount.permissions?.canUnlockTIAccount === true;

    const userPermissions = {
      canAccessConfig: userAccount.permissions?.canAccessConfig ?? (userRole === 'ceo' || userRole === 'gestor' || userRole === 'admin'),
      canEditTickets: userAccount.permissions?.canEditTickets ?? true,
      canDeleteTickets: userAccount.permissions?.canDeleteTickets ?? (userRole === 'ceo' || userRole === 'gestor' || userRole === 'admin'),
      canManageUsers: userAccount.permissions?.canManageUsers ?? (userRole === 'ceo' || userRole === 'gestor' || userRole === 'admin'),
      canManageCategories: userAccount.permissions?.canManageCategories ?? (userRole === 'ceo' || userRole === 'gestor' || userRole === 'admin'),
      canViewAllKanbans: userAccount.permissions?.canViewAllKanbans ?? (userRole === 'ceo' || userRole === 'gestor' || userRole === 'admin'),
      canUnlockTIAccount: canUnlock
    };

    const newSession: TISession = {
      isAuthenticated: true,
      username: userAccount.username,
      name: userAccount.name,
      email: userAccount.email,
      role: userRole,
      loginAt: new Date().toLocaleString('pt-BR'),
      expiresAt: expiresAt,
      ip: '192.168.1.105',
      userAgent: window.navigator?.userAgent || 'Browser Client',
      allowedModules: userAllowedModules,
      permissions: userPermissions
    };

    setTiSession(newSession);

    // Also update global UserSession for compatibility
    setUserSession({
      isAuthenticated: true,
      username: userAccount.username,
      name: userAccount.name,
      email: userAccount.email,
      role: userRole,
      avatar: userAccount.username.charAt(0).toUpperCase(),
      allowedModules: userAllowedModules,
      permissions: userPermissions
    });

    addAuditLog({
      username: userAccount.username,
      eventType: 'TI_LOGIN_SUCCESS',
      details: `Login efetuado com sucesso no Módulo T.I. Perfil: ${userRole.toUpperCase()}`,
      result: 'SUCCESS'
    });

    setCurrentScreen('ti_dashboard');
    return { success: true, message: 'Autenticado com sucesso!' };
  };

  const tiLogout = () => {
    if (tiSession.username) {
      addAuditLog({
        username: tiSession.username,
        eventType: 'TI_LOGOUT',
        details: 'Encerramento de sessão efetuado pelo usuário (Logout).',
        result: 'SUCCESS'
      });
    }

    setTiSession({
      isAuthenticated: false,
      username: '',
      name: '',
      email: '',
      role: 'client',
      loginAt: '',
      expiresAt: 0,
      ip: '',
      userAgent: ''
    });

    setUserSession({
      isAuthenticated: false,
      username: '',
      name: '',
      email: '',
      role: 'client'
    });

    // Clear sensitive storage cache as requested
    sessionStorage.clear();

    setCurrentScreen('ti_login');
  };

  const unlockUserAccount = (targetUserId: string) => {
    // 1. Verify authorization of executor
    const executorRole = tiSession.role;
    const isAuthorized =
      tiSession.isAuthenticated &&
      (executorRole === 'ceo' ||
        executorRole === 'gestor' ||
        executorRole === 'admin' ||
        tiSession.permissions?.canUnlockTIAccount);

    const targetUser = managedUsers.find(u => u.id === targetUserId);

    if (!isAuthorized) {
      addAuditLog({
        username: tiSession.username || 'desconhecido',
        eventType: 'TI_UNLOCK_PERMISSION_DENIED',
        details: `Tentativa não autorizada de desbloquear conta ${targetUser?.username || targetUserId}`,
        result: 'DENIED'
      });
      return {
        success: false,
        message: 'Acesso negado. Apenas CEO, Gestor de T.I. ou Conta T.I. principal podem desbloquear usuários.'
      };
    }

    if (!targetUser) {
      return { success: false, message: 'Usuário não encontrado.' };
    }

    const nowIso = new Date().toLocaleString('pt-BR');

    // Unlock target user
    setManagedUsers(prev =>
      prev.map(u => {
        if (u.id === targetUserId) {
          return {
            ...u,
            locked: false,
            failed_login_attempts: 0,
            unlocked_at: nowIso,
            unlocked_by: tiSession.username
          };
        }
        return u;
      })
    );

    addAuditLog({
      username: targetUser.username,
      eventType: 'TI_ACCOUNT_UNLOCKED',
      unlockedBy: tiSession.username,
      details: `Conta desbloqueada manualmente por @${tiSession.username}`,
      result: 'ACCOUNT_UNLOCKED'
    });

    triggerSystemNotification(
      'Conta Desbloqueada',
      `A conta do usuário @${targetUser.username} foi desbloqueada por @${tiSession.username}.`,
      'Segurança TI',
      'Baixa'
    );

    return {
      success: true,
      message: `Conta de @${targetUser.username} desbloqueada com sucesso!`
    };
  };

  const login = (
    username: string,
    role: 'admin' | 'technician' | 'client' | 'n1' | 'n2' | 'n3' | 'gestor' | 'ceo' = 'admin',
    customUserData?: Partial<UserAccount>
  ) => {
    return tiLogin(username, customUserData?.password);
  };

  const logout = () => {
    tiLogout();
  };

  const playNotificationSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      // Audio context might be restricted
    }
  };

  const triggerSystemNotification = (
    title: string,
    message: string,
    company: string,
    priority: TicketPriority,
    ticketId?: string
  ) => {
    const newNotif: SystemNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      company,
      time: 'Agora',
      timestamp: Date.now(),
      priority,
      read: false,
      ticketId
    };

    setNotifications(prev => [newNotif, ...prev]);
    setActiveToast(newNotif);
    playNotificationSound();
  };

  const addTicket = (
    ticketData: Omit<Ticket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'messages'>
  ): Ticket => {
    const ticketSeq = tickets.length + 1;
    const formattedNum = `#${String(ticketSeq).padStart(6, '0')}`;
    const newId = `tk-${Date.now()}`;
    const nowFormatted = 'Hoje às ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const cleanRequesterEmail = (ticketData.requesterEmail || '').trim().toLowerCase();

    const initialMsg = {
      id: `msg-${Date.now()}`,
      sender: ticketData.requesterName,
      role: 'client' as const,
      text: `Chamado aberto via Portal do Cliente: ${ticketData.description}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      requesterEmail: cleanRequesterEmail,
      attachments: ticketData.attachments || []
    };

    const newTicket: Ticket = {
      ...ticketData,
      requesterEmail: cleanRequesterEmail,
      id: newId,
      ticketNumber: formattedNum,
      createdAt: nowFormatted,
      updatedAt: nowFormatted,
      status: 'Novo',
      queue: ticketData.queue || 'N1',
      messages: [initialMsg]
    };

    setTickets(prev => [newTicket, ...prev]);

    triggerSystemNotification(
      'Novo Chamado',
      `${ticketData.company || ticketData.requesterName} abriu um ticket.`,
      ticketData.company || ticketData.requesterName,
      ticketData.priority,
      newId
    );

    // Save to Supabase for Realtime broadcast across clients
    supabase.from('tickets').insert([{
      id: newId,
      ticket_number: formattedNum,
      client_name: ticketData.requesterName || 'Solicitante',
      company: ticketData.company || '',
      category: ticketData.category || 'Geral',
      subcategory: ticketData.subcategory || '',
      priority: ticketData.priority || 'Média',
      status: 'Novo',
      subject: ticketData.title || (ticketData as any).subject || 'Sem título',
      description: ticketData.description || '',
      created_at: nowFormatted,
      updated_at: nowFormatted,
      queue: ticketData.queue || 'N1',
      assigned_to: ticketData.assignedTo || null,
      messages: newTicket.messages
    }]).then(({ error }) => {
      if (error) {
        console.error('Supabase ticket insert error:', error);
      } else {
        console.log('Supabase ticket inserted successfully:', newId);
      }
    });

    // Broadcast Realtime Event to all connected clients & T.I. dashboards
    try {
      const syncChannel = supabase.channel('ticket_sync_channel');
      syncChannel.send({
        type: 'broadcast',
        event: 'new_ticket_created',
        payload: { ticket: newTicket }
      });
    } catch (err) {
      console.warn('Realtime ticket broadcast failed:', err);
    }

    // Dispara Notificação Automática por E-mail (Gmail)
    if (cleanRequesterEmail && cleanRequesterEmail.includes('@')) {
      dispatchTicketEmail({
        to: cleanRequesterEmail,
        actionType: 'CREATED',
        ticket: newTicket
      });
    }

    return newTicket;
  };


  const updateTicketStatus = (ticketId: string, status: Ticket['status'], technicianNote?: string) => {
    const nowFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Localiza o ticket de forma síncrona no estado atual
    const currentTicket = tickets.find(tk => tk.id === ticketId) || (selectedTicket?.id === ticketId ? selectedTicket : null);
    
    const currentMessages = currentTicket?.messages || [];
    const updatedMessages = [...currentMessages];
    if (technicianNote) {
      updatedMessages.push({
        id: `msg-${Date.now()}`,
        sender: userSession.name || 'Técnico TI',
        role: 'ti',
        text: technicianNote,
        timestamp: nowFormatted
      });
    }

    const updatedTicket: Ticket = currentTicket ? {
      ...currentTicket,
      status,
      updatedAt: `Hoje às ${nowFormatted}`,
      messages: updatedMessages
    } : {
      id: ticketId,
      ticketNumber: `#${ticketId}`,
      requesterName: 'Solicitante',
      requesterEmail: '',
      company: '',
      machineName: '',
      onlyMeOnComputer: true,
      category: 'Geral',
      subcategory: 'Geral',
      priority: 'Média',
      status,
      title: 'Chamado',
      description: '',
      createdAt: `Hoje às ${nowFormatted}`,
      updatedAt: `Hoje às ${nowFormatted}`,
      attachments: [],
      messages: updatedMessages
    };

    // Atualiza estados do React
    setTickets(prev => prev.map(tk => (tk.id === ticketId ? updatedTicket : tk)));
    setSelectedTicket(prev => (prev && prev.id === ticketId ? updatedTicket : prev));

    // Salva no Supabase
    supabase.from('tickets').update({
      status: updatedTicket.status,
      updated_at: updatedTicket.updatedAt,
      messages: updatedTicket.messages
    }).eq('id', ticketId).then(({ error }) => {
      if (error) console.warn('Supabase status update error:', error);
    });

    try {
      const syncChannel = supabase.channel('ticket_sync_channel');
      syncChannel.send({
        type: 'broadcast',
        event: 'ticket_updated',
        payload: { ticket: updatedTicket }
      });
    } catch (err) {
      console.warn('Realtime broadcast ticket_updated failed:', err);
    }

    // Identifica e-mail do solicitante de forma defensiva
    const targetEmail = (
      updatedTicket.requesterEmail || 
      (updatedTicket.messages?.find((m: any) => (m as any).requesterEmail) as any)?.requesterEmail || 
      (updatedTicket as any).client_email || 
      ''
    ).trim();

    // Dispara E-mail automático para o solicitante com base no novo status
    if (targetEmail && targetEmail.includes('@')) {
      let actionType: 'STARTED' | 'PAUSED' | 'COMPLETED' | 'STATUS_CHANGED' = 'STATUS_CHANGED';
      if (status === 'Em Atendimento') actionType = 'STARTED';
      else if (status === 'Pendente') actionType = 'PAUSED';
      else if (status === 'Resolvido' || status === 'Fechado') actionType = 'COMPLETED';

      dispatchTicketEmail({
        to: targetEmail,
        actionType,
        ticket: updatedTicket,
        technicianName: userSession.name || 'Analista T.I.',
        note: technicianNote
      });
    }
  };

  const reassignTicket = (ticketId: string, queue?: ServiceQueue, assignedTo?: string, note?: string) => {
    const nowFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let updatedTicketObj: Ticket | null = null;

    setTickets(prev =>
      prev.map(tk => {
        if (tk.id === ticketId) {
          const updatedMessages = [...tk.messages];
          if (note) {
            updatedMessages.push({
              id: `msg-${Date.now()}`,
              sender: userSession.name || 'Sistema TI',
              role: 'system',
              text: note,
              timestamp: nowFormatted
            });
          }
          updatedTicketObj = {
            ...tk,
            queue: queue !== undefined ? queue : (tk.queue || 'N1'),
            assignedTo: assignedTo !== undefined ? assignedTo : tk.assignedTo,
            updatedAt: `Hoje às ${nowFormatted}`,
            messages: updatedMessages
          };
          return updatedTicketObj;
        }
        return tk;
      })
    );

    setSelectedTicket(prev => {
      if (prev && prev.id === ticketId) {
        const updatedMessages = [...prev.messages];
        if (note) {
          updatedMessages.push({
            id: `msg-${Date.now()}`,
            sender: userSession.name || 'Sistema TI',
            role: 'system',
            text: note,
            timestamp: nowFormatted
          });
        }
        return {
          ...prev,
          queue: queue !== undefined ? queue : (prev.queue || 'N1'),
          assignedTo: assignedTo !== undefined ? assignedTo : prev.assignedTo,
          updatedAt: `Hoje às ${nowFormatted}`,
          messages: updatedMessages
        };
      }
      return prev;
    });

    if (updatedTicketObj) {
      const obj = updatedTicketObj as Ticket;
      supabase.from('tickets').update({
        queue: obj.queue,
        assigned_to: obj.assignedTo,
        updated_at: obj.updatedAt,
        messages: obj.messages
      }).eq('id', ticketId).then(({ error }) => {
        if (error) console.warn('Supabase reassign update error:', error);
      });

      try {
        const syncChannel = supabase.channel('ticket_sync_channel');
        syncChannel.send({
          type: 'broadcast',
          event: 'ticket_updated',
          payload: { ticket: obj }
        });
      } catch (err) {
        console.warn('Realtime broadcast ticket_updated failed:', err);
      }
    }
  };

  const deleteTicket = (ticketId: string) => {
    setTickets(prev => prev.filter(t => t.id !== ticketId));
    setSelectedTicket(prev => (prev?.id === ticketId ? null : prev));
    supabase.from('tickets').delete().eq('id', ticketId).then(({ error }) => {
      if (error) console.warn('Supabase delete ticket error:', error);
    });
  };

  const addTicketMessage = (ticketId: string, text: string, role: 'client' | 'ti', attachments?: TicketAttachment[]) => {
    const nowFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentTicket = tickets.find(tk => tk.id === ticketId) || (selectedTicket?.id === ticketId ? selectedTicket : null);

    const senderName = role === 'client' 
      ? (currentTicket?.requesterName || (userSession.isAuthenticated ? userSession.name || 'Solicitante' : 'Solicitante')) 
      : (userSession.name || 'Técnico TI');

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: senderName,
      role,
      text,
      timestamp: nowFormatted,
      attachments: attachments && attachments.length > 0 ? attachments : undefined
    };

    const currentMessages = currentTicket?.messages || [];
    const updatedMessagesList = [...currentMessages, newMsg];
    const currentAttachments = currentTicket?.attachments || [];
    const updatedAttachmentsList = attachments && attachments.length > 0 
      ? [...currentAttachments, ...attachments] 
      : currentAttachments;
    const updatedTimestampStr = `Hoje às ${nowFormatted}`;

    const updatedTicket: Ticket = currentTicket ? {
      ...currentTicket,
      updatedAt: updatedTimestampStr,
      attachments: updatedAttachmentsList,
      messages: updatedMessagesList
    } : {
      id: ticketId,
      ticketNumber: `#${ticketId}`,
      requesterName: senderName,
      requesterEmail: '',
      company: '',
      machineName: '',
      onlyMeOnComputer: true,
      category: 'Geral',
      subcategory: 'Geral',
      priority: 'Média',
      status: 'Novo',
      title: 'Chamado',
      description: '',
      createdAt: updatedTimestampStr,
      updatedAt: updatedTimestampStr,
      attachments: updatedAttachmentsList,
      messages: updatedMessagesList
    };

    setTickets(prev => prev.map(tk => (tk.id === ticketId ? updatedTicket : tk)));
    setSelectedTicket(prev => (prev && prev.id === ticketId ? updatedTicket : prev));

    supabase.from('tickets').update({
      updated_at: updatedTimestampStr,
      messages: updatedMessagesList
    }).eq('id', ticketId).then(({ error }) => {
      if (error) console.warn('Supabase add message error:', error);
    });

    try {
      const syncChannel = supabase.channel('ticket_sync_channel');
      syncChannel.send({
        type: 'broadcast',
        event: 'ticket_updated',
        payload: { ticket: updatedTicket }
      });
    } catch (err) {
      console.warn('Realtime broadcast ticket_updated failed:', err);
    }

    const targetEmail = (
      updatedTicket.requesterEmail || 
      (updatedTicket.messages?.find((m: any) => (m as any).requesterEmail) as any)?.requesterEmail || 
      (updatedTicket as any).client_email || 
      ''
    ).trim();

    // Se a resposta ou anexo foi enviado pelo técnico de TI, notifica o cliente por e-mail
    if (role === 'ti' && targetEmail && targetEmail.includes('@')) {
      dispatchTicketEmail({
        to: targetEmail,
        actionType: 'MESSAGE_ADDED',
        ticket: updatedTicket,
        technicianName: userSession.name || 'Analista T.I.',
        messageText: text,
        attachments
      });
    }
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const dismissToast = () => {
    setActiveToast(null);
  };

  const toggleServiceStatus = (serviceId: string) => {
    // Apenas a equipe de T.I. pode alterar o status de produtos/serviços
    if (!userSession.isAuthenticated || userSession.role === 'client') {
      return;
    }

    setServices(prev => {
      const nextServices = prev.map(srv => {
        if (srv.id === serviceId) {
          const nextStatus: ServiceStatus['status'] =
            srv.status === 'Operacional'
              ? 'Instabilidade'
              : srv.status === 'Instabilidade'
              ? 'Erro'
              : 'Operacional';
          return { ...srv, status: nextStatus };
        }
        return srv;
      });

      localStorage.setItem('godesc_services', JSON.stringify(nextServices));

      // Sincroniza em Tempo Real para todos os navegadores conectados
      const statusChannel = supabase.channel('system_status_channel');
      statusChannel.send({
        type: 'broadcast',
        event: 'service_status_changed',
        payload: { services: nextServices }
      }).catch(err => console.warn('Supabase status broadcast error:', err));

      return nextServices;
    });
  };

  const updateKBCategories = (newCategories: CategoryGroup[]) => {
    setKbCategories(newCategories);
    localStorage.setItem('godesc_kb_categories', JSON.stringify(newCategories));

    // Sincroniza em Tempo Real para todos os navegadores de analistas conectados
    const kbChannel = supabase.channel('kb_sync_channel');
    kbChannel.send({
      type: 'broadcast',
      event: 'kb_categories_changed',
      payload: { categories: newCategories }
    }).catch(err => console.warn('Supabase KB broadcast error:', err));
  };

  // Base de Dados Management
  const addFolder = (name: string, color: string = '#45dfa4'): DatabaseFolder => {
    const today = new Date().toLocaleDateString('pt-BR');
    const newFolder: DatabaseFolder = {
      id: `fld-${Date.now()}`,
      name: name.trim() || 'Nova Pasta',
      color,
      createdAt: today,
      updatedAt: today
    };
    setFolders(prev => [...prev, newFolder]);
    return newFolder;
  };

  const updateFolder = (id: string, name: string, color?: string) => {
    const today = new Date().toLocaleDateString('pt-BR');
    setFolders(prev =>
      prev.map(f => (f.id === id ? { ...f, name: name.trim() || f.name, color: color || f.color, updatedAt: today } : f))
    );
  };

  const deleteFolder = (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
    // Also delete notes inside this folder
    setNotes(prev => prev.filter(n => n.folderId !== id));
  };

  const addNote = (folderId: string, title: string, content: string, tags: string[] = []): DatabaseNote => {
    const now = 'Hoje às ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newNote: DatabaseNote = {
      id: `note-${Date.now()}`,
      folderId,
      title: title.trim() || 'Sem Título',
      content,
      tags,
      isPinned: false,
      author: userSession.name || 'Analista TI',
      createdAt: now,
      updatedAt: now
    };
    setNotes(prev => [newNote, ...prev]);
    return newNote;
  };

  const updateNote = (id: string, updates: Partial<DatabaseNote>) => {
    const now = 'Hoje às ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setNotes(prev =>
      prev.map(n => (n.id === id ? { ...n, ...updates, updatedAt: now } : n))
    );
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  // Calendário Management & Notifications
  const addCalendarEvent = (eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'notified'>): CalendarEvent => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: `evt-${Date.now()}`,
      createdAt: new Date().toLocaleDateString('pt-BR'),
      notified: false
    };

    setCalendarEvents(prev => [newEvent, ...prev]);

    // Check if event is scheduled for today - if so, immediately notify the TI team in the dashboard
    const todayStr = new Date().toISOString().split('T')[0];
    if (eventData.date === todayStr) {
      triggerSystemNotification(
        `📅 Lembrete de Evento: ${eventData.title}`,
        `Hoje às ${eventData.time} | Local: ${eventData.location} (Criado por: ${eventData.createdBy})`,
        'Calendário TI',
        eventData.priority || 'Alta'
      );
    }

    return newEvent;
  };

  const updateCalendarEvent = (id: string, updates: Partial<CalendarEvent>) => {
    setCalendarEvents(prev =>
      prev.map(evt => (evt.id === id ? { ...evt, ...updates } : evt))
    );
  };

  const deleteCalendarEvent = (id: string) => {
    setCalendarEvents(prev => prev.filter(evt => evt.id !== id));
  };

  const triggerCalendarEventReminder = (eventId: string) => {
    const evt = calendarEvents.find(e => e.id === eventId);
    if (!evt) return;

    triggerSystemNotification(
      `📅 Notificação de Evento: ${evt.title}`,
      `Data: ${evt.date} às ${evt.time} | Local: ${evt.location} (Criado por: ${evt.createdBy})`,
      'Calendário TI',
      evt.priority || 'Alta'
    );
  };

  // Cofre de Senhas State
  const [vaultCredentials, setVaultCredentials] = useState<VaultCredential[]>(() => {
    const saved = localStorage.getItem('godesc_vault_credentials');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) { /* ignore */ }
    }
    return [
      {
        id: 'cred-1',
        title: 'Henrique Leal',
        company: 'Empresa ABC',
        category: 'E-mail',
        username: '-',
        password: 'Lev@2024!',
        notes: 'Windows/REDE: User: henrique.leal Password: Lev@2024! Skype: comercial.plcom@outlook.com senha: PLcom@2024 Data fake de aniver no outlook: 01/01/2000',
        accessLevel: 'Todos',
        strength: 'Fraca',
        updatedAt: '22/09/2025, 10:59:23',
        updatedBy: 'Técnico T.I'
      },
      {
        id: 'cred-2',
        title: 'Raphael Castro',
        company: 'Bex Company',
        category: 'E-mail',
        username: 'raphael.castro@bexcompany.com.br',
        password: 'Password@2026!',
        notes: 'Acesso E-mail Corporativo O365 & VPN Matriz',
        accessLevel: 'Todos',
        strength: 'Forte',
        updatedAt: '23/07/2026, 11:48:53',
        updatedBy: 'Técnico T.I'
      },
      {
        id: 'cred-3',
        title: 'Robson Braga',
        company: 'TechLog Brasil',
        category: 'VPN',
        username: 'robson.braga@empresa.com.br',
        password: 'VpnSecure@2026#',
        notes: 'VPN Fortigate IP Sec & Acesso Servidor AD Principal',
        accessLevel: 'Todos',
        strength: 'Forte',
        updatedAt: '18/08/2026, 14:20:10',
        updatedBy: 'Técnico T.I'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('godesc_vault_credentials', JSON.stringify(vaultCredentials));
  }, [vaultCredentials]);

  const syncVaultToSupabase = async (credentials: VaultCredential[]) => {
    // 1. Dual-strategy: Sync master record to tickets table (guarantees cross-machine cloud storage without RLS blocking)
    try {
      await supabase.from('tickets').upsert([{
        id: 'vault-system-master',
        ticket_number: '#VAULT',
        client_name: 'Sistema T.I.',
        company: 'Godesc360',
        category: 'Cofre',
        subcategory: 'Cofre',
        priority: 'Alta',
        status: 'Novo',
        subject: '__SYSTEM_VAULT_CREDENTIALS__',
        description: JSON.stringify(credentials),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        queue: 'ADM'
      }]);
    } catch (e) {
      console.warn('Supabase vault master sync exception:', e);
    }

    // 2. Dual-strategy: Upsert individual items in vault_credentials table if table exists
    try {
      const payload = credentials.map(c => ({
        id: c.id,
        title: c.title,
        company: c.company,
        category: c.category,
        username: c.username,
        password: c.password,
        notes: c.notes,
        access_level: c.accessLevel,
        strength: c.strength,
        updated_at: c.updatedAt,
        updated_by: c.updatedBy
      }));
      await supabase.from('vault_credentials').upsert(payload);
    } catch (e) {}
  };

  const addVaultCredential = (credData: Omit<VaultCredential, 'id' | 'updatedAt'>): VaultCredential => {
    const newCred: VaultCredential = {
      ...credData,
      id: `cred-${Date.now()}`,
      updatedAt: new Date().toLocaleString('pt-BR')
    };

    setVaultCredentials(prev => {
      const updated = [newCred, ...prev];
      localStorage.setItem('godesc_vault_credentials', JSON.stringify(updated));

      // Synchronize directly with Supabase DB
      syncVaultToSupabase(updated);

      // Broadcast to other open sessions via Supabase Realtime
      const syncChannel = supabase.channel('vault_sync_channel');
      syncChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          syncChannel.send({
            type: 'broadcast',
            event: 'vault_credentials_changed',
            payload: { credentials: updated }
          });
        }
      });

      return updated;
    });

    return newCred;
  };

  const updateVaultCredential = (id: string, updates: Partial<VaultCredential>) => {
    setVaultCredentials(prev => {
      const updatedList = prev.map(c => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toLocaleString('pt-BR') } : c));
      localStorage.setItem('godesc_vault_credentials', JSON.stringify(updatedList));

      // Synchronize directly with Supabase DB
      syncVaultToSupabase(updatedList);

      // Broadcast to other open sessions via Supabase Realtime
      const syncChannel = supabase.channel('vault_sync_channel');
      syncChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          syncChannel.send({
            type: 'broadcast',
            event: 'vault_credentials_changed',
            payload: { credentials: updatedList }
          });
        }
      });

      return updatedList;
    });
  };

  const deleteVaultCredential = (id: string) => {
    setVaultCredentials(prev => {
      const updated = prev.filter(c => c.id !== id);
      localStorage.setItem('godesc_vault_credentials', JSON.stringify(updated));

      // Synchronize directly with Supabase DB
      syncVaultToSupabase(updated);

      // Broadcast to other open sessions via Supabase Realtime
      const syncChannel = supabase.channel('vault_sync_channel');
      syncChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          syncChannel.send({
            type: 'broadcast',
            event: 'vault_credentials_changed',
            payload: { credentials: updated }
          });
        }
      });

      return updated;
    });
  };

  // Sincronização em tempo real (multi-abas/janelas)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'godesc_tickets' && e.newValue) {
        try { 
          const newTickets: Ticket[] = JSON.parse(e.newValue);
          setTickets(prev => {
            if (newTickets.length > prev.length) {
              const latestTicket = newTickets[0];
              const existsLocally = prev.some(t => t.id === latestTicket.id);
              if (!existsLocally) {
                const newNotif: SystemNotification = {
                  id: `notif-${Date.now()}`,
                  title: `Novo Chamado ${latestTicket.ticketNumber}`,
                  message: `${latestTicket.company || latestTicket.requesterName} abriu um chamado: ${latestTicket.title}`,
                  company: latestTicket.company || latestTicket.requesterName,
                  time: 'Agora',
                  timestamp: Date.now(),
                  priority: latestTicket.priority,
                  read: false,
                  ticketId: latestTicket.id
                };
                setNotifications(nPrev => [newNotif, ...nPrev]);
                setActiveToast(newNotif);
                playNotificationSound();
              }
            }
            return newTickets;
          }); 
          setSelectedTicket(prev => {
            if (prev) {
              const updated = newTickets.find((t: Ticket) => t.id === prev.id);
              return updated || prev;
            }
            return prev;
          });
        } catch (err) {}
      }
      if (e.key === 'godesc_notifications' && e.newValue) {
        try { setNotifications(JSON.parse(e.newValue)); } catch (err) {}
      }
      if (e.key === 'godesc_ticket_categories' && e.newValue) {
        try { setTicketCategories(JSON.parse(e.newValue)); } catch (err) {}
      }
      if (e.key === 'godesc_companies' && e.newValue) {
        try { setCompanies(JSON.parse(e.newValue)); } catch (err) {}
      }
      if (e.key === 'godesc_vault_credentials' && e.newValue) {
        try { setVaultCredentials(JSON.parse(e.newValue)); } catch (err) {}
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Central de Atendimento WhatsApp & Chatbot Multi-Tenant
  const [whatsappConnection, setWhatsappConnection] = useState<WhatsAppConnection>({
    id: 'conn-default',
    companyId: 'default-company',
    status: 'CONNECTED',
    phoneNumber: '+55 11 99887-6655',
    name: 'Empresa GoDesc360',
    connectedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const [attendanceQueues, setAttendanceQueues] = useState<AttendanceQueue[]>([
    { id: 'q-1', companyId: 'default-company', name: 'Comercial', description: 'Vendas e Orçamentos', color: '#3b82f6', assignedUsers: ['admin.ceo', 'admin.gestor'], priority: 'Média', distributionStrategy: 'ROUND_ROBIN' },
    { id: 'q-2', companyId: 'default-company', name: 'Suporte Técnico', description: 'Atendimento Técnico N1/N2/N3', color: '#45dfa4', assignedUsers: ['admin.ceo', 'admin.gestor'], priority: 'Alta', distributionStrategy: 'ROUND_ROBIN' },
    { id: 'q-3', companyId: 'default-company', name: 'Financeiro', description: 'Faturamento e Cobrança', color: '#a855f7', assignedUsers: ['admin.gestor'], priority: 'Média', distributionStrategy: 'ROUND_ROBIN' }
  ]);

  const [businessHours, setBusinessHours] = useState<BusinessHoursConfig>(() => {
    try {
      const saved = localStorage.getItem('godesc_business_hours');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.schedules) && parsed.schedules.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    return {
      id: 'bh-1',
      companyId: 'default-company',
      enabled: true,
      outOfHoursMessage: 'Olá! Nosso horário de atendimento é de segunda a sexta-feira, das 08:00 às 18:00.',
      schedules: [
        { day: 'Segunda-feira', enabled: true, openTime: '08:00', closeTime: '18:00', hasLunchBreak: false },
        { day: 'Terça-feira', enabled: true, openTime: '08:00', closeTime: '18:00', hasLunchBreak: false },
        { day: 'Quarta-feira', enabled: true, openTime: '08:00', closeTime: '18:00', hasLunchBreak: false },
        { day: 'Quinta-feira', enabled: true, openTime: '08:00', closeTime: '18:00', hasLunchBreak: false },
        { day: 'Sexta-feira', enabled: true, openTime: '08:00', closeTime: '18:00', hasLunchBreak: false },
        { day: 'Sábado', enabled: false, openTime: '08:00', closeTime: '12:00' },
        { day: 'Domingo', enabled: false, openTime: '08:00', closeTime: '12:00' }
      ]
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('godesc_business_hours', JSON.stringify(businessHours));
    } catch (e) {}
  }, [businessHours]);

  const [chatbotFlow, setChatbotFlow] = useState<ChatbotFlow>(() => {
    const saved = localStorage.getItem('godesc_chatbot_flow');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      id: 'flow-1',
      companyId: 'default-company',
      name: 'Fluxo Principal WhatsApp',
      status: 'PUBLISHED',
      version: 1,
      nodes: [
        {
          id: 'node-start',
          title: 'Menu Inicial',
          type: 'MENU',
          message: 'Olá! Tudo bem? 👋\n\nBem-vindo à Central de Atendimento GoDesc 360.\n\nDigite uma opção:\n\n1 - Comercial\n2 - Suporte Técnico\n3 - Financeiro\n4 - Abrir Ticket\n5 - Falar com Atendente',
          options: [
            { id: 'opt-1', triggerValue: '1', label: 'Comercial', targetNodeId: 'node-comercial' },
            { id: 'opt-2', triggerValue: '2', label: 'Suporte Técnico', targetNodeId: 'node-suporte' },
            { id: 'opt-3', triggerValue: '3', label: 'Financeiro', targetNodeId: 'node-financeiro' },
            { id: 'opt-4', triggerValue: '4', label: 'Abrir Ticket', targetNodeId: 'node-ticket' },
            { id: 'opt-5', triggerValue: '5', label: 'Falar com Atendente', targetNodeId: 'node-humano' }
          ],
          position: { x: 100, y: 100 }
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

  useEffect(() => {
    localStorage.setItem('godesc_chatbot_flow', JSON.stringify(chatbotFlow));
  }, [chatbotFlow]);

  const [attendanceContacts, setAttendanceContacts] = useState<AttendanceContact[]>([
    {
      id: 'cnt-1',
      companyId: 'default-company',
      name: 'João Silva',
      phone: '+55 11 99988-7766',
      email: 'joao.silva@empresa.com.br',
      companyName: 'Tech Solutions LTDA',
      tags: ['Prospect', 'Comercial'],
      firstContactAt: '10/08/2026',
      lastContactAt: '20/08/2026',
      totalAttendances: 3
    },
    {
      id: 'cnt-2',
      companyId: 'default-company',
      name: 'Maria Oliveira',
      phone: '+55 11 98877-6655',
      email: 'maria@oliveira.com.br',
      companyName: 'Oliveira & Associados',
      tags: ['Cliente', 'Urgente'],
      firstContactAt: '01/08/2026',
      lastContactAt: '20/08/2026',
      totalAttendances: 7
    }
  ]);

  const [attendanceConversations, setAttendanceConversations] = useState<AttendanceConversation[]>(() => {
    const saved = localStorage.getItem('godesc_attendance_conversations');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'conv-5511999887766',
        companyId: 'default-company',
        contactId: 'cnt-1',
        contactName: 'João Silva',
        contactPhone: '+55 11 99988-7766',
        queueId: 'q-1',
        queueName: 'Comercial',
        status: 'WAITING',
        botActive: true,
        priority: 'Média',
        startedAt: '10:15',
        lastMessageText: 'Gostaria de solicitar um orçamento para o meu sistema.',
        lastMessageAt: '10:15',
        unreadCount: 1,
        tags: ['Prospect', 'Comercial']
      },
      {
        id: 'conv-5511988776655',
        companyId: 'default-company',
        contactId: 'cnt-2',
        contactName: 'Maria Oliveira',
        contactPhone: '+55 11 98877-6655',
        queueId: 'q-2',
        queueName: 'Suporte Técnico',
        assignedUserId: 'usr-ceo',
        assignedUserName: 'CEO (Direção Geral)',
        status: 'IN_PROGRESS',
        botActive: false,
        priority: 'Alta',
        startedAt: '09:30',
        lastMessageText: 'Analista: Estarei verificando a falha no servidor agora.',
        lastMessageAt: '09:42',
        unreadCount: 0,
        tags: ['Cliente', 'Urgente']
      }
    ];
  });

  const [attendanceMessages, setAttendanceMessages] = useState<AttendanceMessage[]>(() => {
    const saved = localStorage.getItem('godesc_attendance_messages');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'msg-1',
        conversationId: 'conv-5511999887766',
        senderType: 'CUSTOMER',
        senderName: 'João Silva',
        messageType: 'TEXT',
        content: 'Olá! Gostaria de falar com o setor comercial.',
        status: 'READ',
        createdAt: new Date(Date.now() - 600000).toISOString()
      },
      {
        id: 'msg-2',
        conversationId: 'conv-5511999887766',
        senderType: 'BOT',
        senderName: 'Assistente Virtual',
        messageType: 'TEXT',
        content: 'Olá! Tudo bem? 👋 Encaminhei você para a fila do setor Comercial. Em instantes um consultor irá te atender!',
        status: 'READ',
        createdAt: new Date(Date.now() - 590000).toISOString()
      },
      {
        id: 'msg-3',
        conversationId: 'conv-5511999887766',
        senderType: 'CUSTOMER',
        senderName: 'João Silva',
        messageType: 'TEXT',
        content: 'Gostaria de solicitar um orçamento para o meu sistema.',
        status: 'DELIVERED',
        createdAt: new Date(Date.now() - 300000).toISOString()
      }
    ];
  });

  // Automatically persist WhatsApp conversations and messages on change
  useEffect(() => {
    localStorage.setItem('godesc_attendance_conversations', JSON.stringify(attendanceConversations));
  }, [attendanceConversations]);

  useEffect(() => {
    localStorage.setItem('godesc_attendance_messages', JSON.stringify(attendanceMessages));
  }, [attendanceMessages]);



  const CLOUD_API_URL = 'https://godesc360-whatsapp-api.onrender.com';
  const LOCAL_API_URL = 'http://localhost:10000';

  const getCandidateUrls = (currentUrl: string): string[] => {
    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const urls: string[] = [];
    // Prioriza servidor local na porta 10000 para envios instantâneos e sem bloqueio de SMTP
    if (isLocalhost || (currentUrl && currentUrl.includes('localhost'))) {
      urls.push(LOCAL_API_URL);
      if (currentUrl && currentUrl !== LOCAL_API_URL && !urls.includes(currentUrl)) {
        urls.push(currentUrl.trim().replace(/\/+$/, ''));
      }
      if (!urls.includes(CLOUD_API_URL)) urls.push(CLOUD_API_URL);
    } else {
      if (currentUrl) urls.push(currentUrl.trim().replace(/\/+$/, ''));
      if (!urls.includes(CLOUD_API_URL)) urls.push(CLOUD_API_URL);
      if (!urls.includes(LOCAL_API_URL)) urls.push(LOCAL_API_URL);
    }
    return urls;
  };

  // URL configurável do microservidor Baileys / Backend
  const [whatsappServerUrl, setWhatsappServerUrlState] = useState<string>(() => {
    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const saved = localStorage.getItem('godesc_whatsapp_server_url');
    // Se o usuário estiver no localhost e tiver uma URL antiga do Render salva no navegador, redireciona para o backend local
    if (isLocalhost && saved && saved.includes('onrender.com')) {
      localStorage.removeItem('godesc_whatsapp_server_url');
      return LOCAL_API_URL;
    }
    // Se estiver em produção (Vercel) e nenhuma URL estiver salva, usar a Nuvem
    if (!isLocalhost && (!saved || saved.includes('localhost') || saved.includes('127.0.0.1'))) {
      return CLOUD_API_URL;
    }
    if (saved) return saved;
    return import.meta.env.VITE_WHATSAPP_API_URL || (isLocalhost ? LOCAL_API_URL : CLOUD_API_URL);
  });

  const updateWhatsappServerUrl = (url: string) => {
    const cleanUrl = url.trim().replace(/\/+$/, '');
    setWhatsappServerUrlState(cleanUrl);
    localStorage.setItem('godesc_whatsapp_server_url', cleanUrl);
  };

  // Funções de Gerenciamento e Disparo de E-mails (Gmail SMTP / Corporativo GoDesc)
  const dispatchTicketEmail = async (params: {
    to: string;
    actionType: 'CREATED' | 'STARTED' | 'PAUSED' | 'COMPLETED' | 'MESSAGE_ADDED' | 'STATUS_CHANGED';
    ticket: Ticket;
    technicianName?: string;
    note?: string;
    messageText?: string;
    attachments?: TicketAttachment[];
  }) => {
    if (!params.to || !params.to.includes('@')) return;

    // 1. SUPABASE REALTIME CLOUD RELAY: Transmite o evento pela nuvem Supabase.
    // Isso garante que QUALQUER analista (em qualquer máquina, notebook ou localidade)
    // dispare o envio de e-mails corporativos instantaneamente pelo servidor central da empresa,
    // sem precisar rodar nada no computador deles!
    try {
      const emailChannel = supabase.channel('godesc_email_dispatch');
      emailChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          emailChannel.send({
            type: 'broadcast',
            event: 'dispatch_ticket_email',
            payload: params
          });
        }
      });
    } catch (err) {
      console.warn('Falha ao transmitir disparo via Supabase Cloud Relay:', err);
    }

    // 2. Se a máquina atual tiver acesso direto ao servidor local na porta 10000, tenta envio síncrono
    const tryUrls = getCandidateUrls(whatsappServerUrl);
    for (const url of tryUrls) {
      if (url.includes('onrender.com')) continue; // Render bloqueia portas de saída SMTP (587/465) no plano gratuito
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(`${url}/api/email/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (data && data.success) {
            console.log(`📧 E-mail [${params.actionType}] enviado com sucesso para ${params.to} via ${url}`);
            return;
          }
        }
      } catch (err) {
        // falha silenciosa para fallback do relay
      }
    }
  };

  const getEmailConfig = async () => {
    let loadedConfig: any = null;

    // 1. Tentar ler do Supabase primeiro (__SYSTEM_EMAIL_CONFIG__ como fonte permanente)
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('subject', '__SYSTEM_EMAIL_CONFIG__')
        .limit(1);

      if (!error && data && data.length > 0 && data[0].description) {
        const parsed = JSON.parse(data[0].description);
        if (parsed && (parsed.user || parsed.pass)) {
          loadedConfig = {
            ...parsed,
            hasPassword: !!(parsed.pass || parsed.hasPassword)
          };
          localStorage.setItem('godesc_cached_email_config', JSON.stringify(loadedConfig));
        }
      }
    } catch (e) {}

    // 2. Fallback para localStorage
    if (!loadedConfig) {
      try {
        const cached = localStorage.getItem('godesc_cached_email_config');
        if (cached) loadedConfig = JSON.parse(cached);
      } catch (e) {}
    }

    // 3. Sincroniza com o servidor backend ativo
    const tryUrls = getCandidateUrls(whatsappServerUrl);
    for (const url of tryUrls) {
      try {
        // Se temos credenciais carregadas, envia para o servidor manter em memória
        if (loadedConfig && loadedConfig.pass) {
          fetch(`${url}/api/email/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loadedConfig)
          }).catch(() => null);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`${url}/api/email/config`, { signal: controller.signal });
        clearTimeout(timeoutId);
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const srvConfig = await res.json();
          const merged = {
            ...(loadedConfig || {}),
            ...srvConfig,
            hasPassword: !!(loadedConfig?.pass || loadedConfig?.hasPassword || srvConfig?.hasPassword || srvConfig?.pass)
          };
          try {
            localStorage.setItem('godesc_cached_email_config', JSON.stringify(merged));
          } catch (e) {}
          return merged;
        }
      } catch (err) {}
    }

    return loadedConfig;
  };

  const saveEmailConfig = async (configData: any) => {
    // 1. Preservar senha existente se o usuário não digitou uma nova
    let fullConfig = { ...configData };
    if (!fullConfig.pass || fullConfig.pass.trim() === '') {
      try {
        const cached = localStorage.getItem('godesc_cached_email_config');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.pass) fullConfig.pass = parsed.pass;
        }
      } catch (e) {}

      if (!fullConfig.pass) {
        try {
          const { data } = await supabase
            .from('tickets')
            .select('description')
            .eq('subject', '__SYSTEM_EMAIL_CONFIG__')
            .limit(1);
          if (data && data.length > 0 && data[0].description) {
            const parsed = JSON.parse(data[0].description);
            if (parsed.pass) fullConfig.pass = parsed.pass;
          }
        } catch (e) {}
      }
    }

    // 2. Persistir permanentemente no Supabase (garantia cross-session & restart)
    try {
      await supabase.from('tickets').upsert([{
        id: '__system_email_config__',
        ticket_number: '#SYS-EMAIL',
        client_name: 'System Email Record',
        company: 'GoDesc 360',
        category: 'System',
        subcategory: 'EmailConfig',
        priority: 'Baixa',
        status: 'Concluído',
        subject: '__SYSTEM_EMAIL_CONFIG__',
        description: JSON.stringify(fullConfig),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);
    } catch (err) {
      console.warn('Erro ao salvar email no Supabase:', err);
    }

    // 3. Salvar no localStorage
    try {
      localStorage.setItem('godesc_cached_email_config', JSON.stringify({
        ...fullConfig,
        hasPassword: !!(fullConfig.pass || fullConfig.hasPassword)
      }));
    } catch (e) {}

    // 4. Enviar para os servidores backend
    const tryUrls = getCandidateUrls(whatsappServerUrl);
    let lastError = '';

    for (const url of tryUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(`${url}/api/email/config`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullConfig),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          if (url !== whatsappServerUrl) updateWhatsappServerUrl(url);
          return await res.json();
        }
        lastError = `Servidor (${url}) retornou status ${res.status}.`;
      } catch (err: any) {
        lastError = err.name === 'AbortError' ? 'Tempo limite esgotado (10s)' : err.message;
      }
    }

    return { 
      success: true, 
      config: {
        ...fullConfig,
        hasPassword: !!fullConfig.pass,
        passMasked: fullConfig.pass ? '••••••••••••••••' : ''
      } 
    };
  };

  const disconnectEmailConfig = async () => {
    // 1. Apagar do Supabase
    try {
      await supabase.from('tickets').delete().eq('subject', '__SYSTEM_EMAIL_CONFIG__');
    } catch (e) {}

    // 2. Limpar cache local
    localStorage.removeItem('godesc_cached_email_config');

    // 3. Desconectar nos servidores backend
    const tryUrls = getCandidateUrls(whatsappServerUrl);
    for (const url of tryUrls) {
      try {
        await fetch(`${url}/api/email/disconnect`, { method: 'POST' }).catch(() => null);
      } catch (e) {}
    }

    return { success: true };
  };

  const testEmailConnection = async (customConfig?: any, testRecipient?: string) => {
    const tryUrls = getCandidateUrls(whatsappServerUrl);

    let lastError = '';
    for (const url of tryUrls) {
      // Servidores em nuvem (Render) bloqueiam tráfego de saída SMTP (portas 587/465) no plano gratuito
      if (url.includes('onrender.com')) {
        continue;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);
        const res = await fetch(`${url}/api/email/test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...(customConfig || {}), testRecipient }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (res.ok && data.success) {
            if (url !== whatsappServerUrl) updateWhatsappServerUrl(url);
            return data;
          }
          if (data.error) lastError = data.error;
        } else {
          lastError = `Servidor (${url}) retornou status ${res.status}.`;
        }
      } catch (err: any) {
        lastError = err.name === 'AbortError' ? 'Tempo limite esgotado (12s)' : err.message;
      }
    }
    return { 
      success: false, 
      error: (!lastError || lastError.includes('Failed to fetch') || lastError.includes('NetworkError'))
        ? 'O servidor local (porta 10000) está desconectado. Abra a pasta do sistema e execute o arquivo "INICIAR_SERVIDOR_LOCAL.bat" para habilitar o envio de e-mails corporativos (servidores de nuvem pública como o Render bloqueiam portas SMTP 587/465).'
        : `Falha ao conectar no servidor de e-mail: ${lastError}` 
    };
  };

  // Poll contínuo do status do servidor Baileys para manter o frontend 100% em sincronia
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const res = await fetch(`${whatsappServerUrl}/api/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.status) {
            setWhatsappConnection(prev => ({
              ...prev,
              status: data.status as WhatsAppConnectionStatus,
              phoneNumber: data.phoneNumber || prev.phoneNumber || 'Conectado',
              updatedAt: new Date().toISOString()
            }));
          }
        }
      } catch (err) {
        // Servidor offline ou hibernando
      }
    };

    checkServerStatus();
    const interval = setInterval(checkServerStatus, 4000);
    return () => clearInterval(interval);
  }, [whatsappServerUrl]);

  const connectWhatsApp = async () => {
    const res = await whatsappProvider.connect('default-company');
    setWhatsappConnection(prev => ({
      ...prev,
      ...res,
      status: 'CONNECTED',
      updatedAt: new Date().toISOString()
    }));
  };

  const disconnectWhatsApp = async () => {
    try {
      await fetch(`${whatsappServerUrl}/api/logout`, { method: 'POST' });
    } catch (e) {}
    await whatsappProvider.disconnect('default-company');
    setWhatsappConnection(prev => ({ ...prev, status: 'DISCONNECTED', phoneNumber: undefined }));
  };

  // Sync incoming real WhatsApp messages from Baileys Server
  const processedMsgIds = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${whatsappServerUrl}/api/sync-messages`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            data.messages.forEach((incMsg: { id: string; phone: string; jid?: string; name: string; content: string; timestamp: string }) => {
              const msgKey = incMsg.id || `${incMsg.phone}-${incMsg.timestamp}-${incMsg.content}`;
              if (processedMsgIds.current.has(msgKey)) return;
              processedMsgIds.current.add(msgKey);
              if (processedMsgIds.current.size > 500) {
                const firstKey = processedMsgIds.current.values().next().value;
                processedMsgIds.current.delete(firstKey);
              }

              // Extrai apenas dígitos do telefone, ignorando sufixo JID como @s.whatsapp.net
              const rawPhone = (incMsg.jid || incMsg.phone).split('@')[0].replace(/\D/g, '');
              // Sanitiza o nome: se o nome vier com @, JID ou for igual ao phone bruto, usa apenas o número formatado
              const rawName = (incMsg.name && incMsg.name.trim()) ? incMsg.name.trim() : '';
              const contactName = (rawName && !rawName.includes('@') && rawName !== rawPhone && rawName !== incMsg.phone) ? rawName : `+${rawPhone}`;
              const contactJid = incMsg.jid || `${rawPhone}@s.whatsapp.net`;

              // Busca conversa existente pelo convId padrão
              const baseConvId = `conv-${rawPhone}`;
              
              // Determina o convId a usar — se a conversa existente estiver CLOSED, cria uma nova com timestamp
              let convId = baseConvId;

              setAttendanceConversations(cPrev => {
                const existing = cPrev.find(c => 
                  c.id === baseConvId || 
                  c.contactPhone.replace(/\D/g, '') === rawPhone ||
                  (rawPhone.length >= 8 && c.contactPhone.replace(/\D/g, '').endsWith(rawPhone.slice(-8)))
                );
                const timeStr = new Date(incMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                if (existing) {
                  const lowerContent = incMsg.content.trim().toLowerCase();
                  const isMenuCmd = ['menu', 'início', 'inicio', '#', 'voltar', 'opções', 'opcoes', 'ajuda', 'começar', 'comecar'].includes(lowerContent);

                  // Se conversa estava CLOSED: abre uma NOVA conversa com ID único para não misturar histórico
                  if (existing.status === 'CLOSED') {
                    convId = `conv-${rawPhone}-${Date.now()}`;
                    const newConv: AttendanceConversation = {
                      id: convId,
                      companyId: 'default-company',
                      contactId: `cnt-${rawPhone}`,
                      contactName: (existing.contactName && existing.contactName !== existing.contactPhone) ? existing.contactName : contactName,
                      contactPhone: `+${rawPhone}`,
                      contactJid,
                      status: 'BOT',
                      queueName: 'Triagem Automática',
                      lastMessageText: incMsg.content,
                      lastMessageAt: timeStr,
                      unreadCount: 1,
                      botActive: true,
                      priority: 'Média',
                      startedAt: incMsg.timestamp
                    };
                    return [newConv, ...cPrev];
                  }
                  
                  const shouldStartBot = existing.status === 'BOT' || 
                    existing.status !== 'IN_PROGRESS' || 
                    !existing.assignedUserName || 
                    isMenuCmd;

                  // Mantém o mesmo convId da conversa existente
                  convId = existing.id;

                  return cPrev.map(c => {
                    if (c.id === existing.id) {
                      return {
                        ...c,
                        contactJid: incMsg.jid || c.contactJid || contactJid,
                        contactName: (c.contactName && c.contactName !== c.contactPhone) ? c.contactName : contactName,
                        lastMessageText: incMsg.content,
                        lastMessageAt: timeStr,
                        unreadCount: c.unreadCount + 1,
                        status: shouldStartBot ? 'BOT' : c.status,
                        botActive: shouldStartBot ? true : c.botActive,
                        queueName: shouldStartBot ? 'Triagem Automática' : c.queueName,
                        queueId: shouldStartBot ? undefined : c.queueId,
                        assignedUserId: shouldStartBot ? undefined : c.assignedUserId,
                        assignedUserName: shouldStartBot ? undefined : c.assignedUserName
                      };
                    }
                    return c;
                  });
                } else {
                  const newConv: AttendanceConversation = {
                    id: convId,
                    companyId: 'default-company',
                    contactId: `cnt-${rawPhone}`,
                    contactName,
                    contactPhone: `+${rawPhone}`,
                    contactJid,
                    status: 'BOT',
                    queueName: 'Triagem Automática',
                    lastMessageText: incMsg.content,
                    lastMessageAt: timeStr,
                    unreadCount: 1,
                    botActive: true,
                    priority: 'Média',
                    startedAt: incMsg.timestamp
                  };
                  return [newConv, ...cPrev];
                }
              });

              const newMsgObj: AttendanceMessage = {
                id: msgKey,
                conversationId: convId, // convId pode ter sido atualizado acima (nova conversa de CLOSED)
                senderType: 'CUSTOMER',
                senderName: contactName,
                messageType: 'TEXT',
                content: incMsg.content,
                status: 'DELIVERED',
                createdAt: incMsg.timestamp
              };

              setAttendanceMessages(mPrev => {
                if (mPrev.some(m => m.id === newMsgObj.id)) return mPrev;
                return [...mPrev, newMsgObj];
              });

              playNotificationSound();

              // Processa resposta do Chatbot
              setTimeout(() => {
                setAttendanceConversations(currentConvs => {
                  const targetConv = currentConvs.find(c => c.id === convId || c.contactPhone.replace(/\D/g, '') === rawPhone);
                  if (targetConv && (targetConv.botActive || targetConv.status === 'BOT')) {
                    const botResult = ChatbotEngine.processIncomingMessage(
                      incMsg.content,
                      targetConv,
                      chatbotFlow,
                      businessHours,
                      attendanceQueues
                    );

                    if (botResult.replyMessage) {
                      const botMsgObj: AttendanceMessage = {
                        id: `msg-bot-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                        conversationId: targetConv.id,
                        senderType: 'BOT',
                        senderName: 'Assistente Virtual',
                        messageType: 'TEXT',
                        content: botResult.replyMessage,
                        status: 'READ',
                        createdAt: new Date().toISOString()
                      };
                      setAttendanceMessages(mp => [...mp, botMsgObj]);

                      // Envia resposta do bot para o celular do cliente
                      fetch(`${whatsappServerUrl}/api/send-message`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ toPhone: targetConv.contactJid || targetConv.contactPhone, text: botResult.replyMessage })
                      }).catch(err => console.warn('Send bot reply failed:', err));
                    }

                    // Abertura automática de chamado no sistema se a opção selecionada for Ticket
                    if (botResult.createTicketData) {
                      addTicket({
                        title: botResult.createTicketData.title,
                        description: botResult.createTicketData.description,
                        requesterName: targetConv.contactName,
                        requesterEmail: `${rawPhone}@whatsapp.user`,
                        company: 'Atendimento WhatsApp',
                        machineName: 'WhatsApp',
                        onlyMeOnComputer: false,
                        category: botResult.createTicketData.category || 'Suporte Geral',
                        subcategory: 'Atendimento Automatizado',
                        priority: 'Média',
                        status: 'Novo',
                        attachments: []
                      });
                    }

                    // Atualiza o estado da conversa (Fila, Status WAITING/BOT, e desativação do bot)
                    return currentConvs.map(c => {
                      if (c.id === targetConv.id) {
                        const nextStatus = botResult.updateConversationStatus || c.status;
                        const isWaitingOrBot = nextStatus === 'WAITING' || nextStatus === 'BOT';

                        return {
                          ...c,
                          status: nextStatus,
                          queueId: botResult.targetQueueId || (nextStatus === 'BOT' ? undefined : c.queueId),
                          queueName: botResult.targetQueueName || (nextStatus === 'BOT' ? 'Triagem Automática' : c.queueName),
                          botActive: botResult.botActive !== undefined ? botResult.botActive : c.botActive,
                          // Se estiver no BOT ou aguardando analista (WAITING), limpa atendente para os analistas aceitarem
                          assignedUserId: isWaitingOrBot ? undefined : c.assignedUserId,
                          assignedUserName: isWaitingOrBot ? undefined : c.assignedUserName
                        };
                      }
                      return c;
                    });
                  }
                  return currentConvs;
                });
              }, 600);
            });
          }
        }
      } catch (err) {
        // Falha silenciosa quando servidor está hibernando
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [whatsappServerUrl, chatbotFlow, businessHours, attendanceQueues]);

  const sendAttendanceMessage = (conversationId: string, content: string, senderType: SenderType = 'AGENT') => {
    const conv = attendanceConversations.find(c => c.id === conversationId);
    if (!conv) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newMsg: AttendanceMessage = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderType,
      senderName: senderType === 'AGENT' ? (userSession.name || 'Atendente T.I.') : (senderType === 'BOT' ? 'Assistente Virtual' : conv.contactName),
      messageType: 'TEXT',
      content,
      status: 'SENT',
      createdAt: now.toISOString()
    };

    setAttendanceMessages(prev => [...prev, newMsg]);

    setAttendanceConversations(prev =>
      prev.map(c => {
        if (c.id === conversationId) {
          return {
            ...c,
            lastMessageText: `${senderType === 'AGENT' ? 'Você: ' : (senderType === 'BOT' ? 'Robô: ' : '')}${content}`,
            lastMessageAt: timeStr,
            unreadCount: senderType === 'CUSTOMER' ? c.unreadCount + 1 : 0,
            // Desativa robô e assume conversa quando atendente humano digita
            botActive: senderType === 'AGENT' ? false : (senderType === 'BOT' ? true : c.botActive),
            status: (senderType === 'AGENT' && (c.status === 'WAITING' || c.status === 'BOT')) ? 'IN_PROGRESS' : (senderType === 'BOT' ? 'BOT' : c.status)
          };
        }
        return c;
      })
    );

    // Envia mensagem real para o celular do cliente via API do Baileys
    if (senderType === 'AGENT' || senderType === 'BOT') {
      // Prefixo do analista em negrito para o cliente identificar quem está falando
      const textToSend = senderType === 'AGENT'
        ? `*${userSession.name || 'Atendente'}:* ${content}`
        : content;
      fetch(`${whatsappServerUrl}/api/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toPhone: conv.contactJid || conv.contactPhone, text: textToSend })
      })
        .then(async res => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok || data.error) {
            const errorMsg = data.error || 'WhatsApp não respondeu no servidor';
            console.error('Falha no envio de mensagem WhatsApp:', errorMsg);
            triggerSystemNotification(
              '⚠️ Erro no Envio do WhatsApp',
              `A mensagem para ${conv.contactName} não foi entregue: ${errorMsg}`,
              conv.companyId || 'Sistema',
              'Alta'
            );
          }
        })
        .catch(err => {
          console.warn('Real WhatsApp outbound delivery failed:', err);
          triggerSystemNotification(
            '⚠️ Servidor WhatsApp Indisponível',
            `Não foi possível conectar ao servidor Baileys (${whatsappServerUrl})`,
            conv.companyId || 'Sistema',
            'Alta'
          );
        });
    }
  };

  const assignConversation = (conversationId: string, userId: string, userName: string) => {
    setAttendanceConversations(prev =>
      prev.map(c => {
        if (c.id === conversationId) {
          return {
            ...c,
            assignedUserId: userId,
            assignedUserName: userName,
            status: 'IN_PROGRESS',
            botActive: false,
            assignedAt: new Date().toISOString()
          };
        }
        return c;
      })
    );
  };

  const transferConversation = (conversationId: string, targetQueueId?: string, targetQueueName?: string, targetUserName?: string) => {
    setAttendanceConversations(prev =>
      prev.map(c => {
        if (c.id === conversationId) {
          return {
            ...c,
            queueId: targetQueueId || c.queueId,
            queueName: targetQueueName || c.queueName,
            assignedUserName: targetUserName || undefined,
            status: 'TRANSFERRED'
          };
        }
        return c;
      })
    );
  };

  const closeConversation = (conversationId: string) => {
    // Marca a conversa como encerrada
    setAttendanceConversations(prev =>
      prev.map(c => {
        if (c.id === conversationId) {
          return {
            ...c,
            status: 'CLOSED',
            botActive: true,
            assignedUserId: undefined,
            assignedUserName: undefined,
            closedAt: new Date().toISOString()
          };
        }
        return c;
      })
    );
    // Limpa o histórico de mensagens da conversa encerrada para não aparecer no próximo atendimento
    setAttendanceMessages(prev => prev.filter(m => m.conversationId !== conversationId));
  };

  const toggleBotState = (conversationId: string, active: boolean) => {
    setAttendanceConversations(prev =>
      prev.map(c => {
        if (c.id === conversationId) {
          return {
            ...c,
            botActive: active,
            status: active ? 'BOT' : (c.assignedUserName ? 'IN_PROGRESS' : 'WAITING'),
            assignedUserId: active ? undefined : c.assignedUserId,
            assignedUserName: active ? undefined : c.assignedUserName,
            queueName: active ? 'Triagem Automática' : c.queueName,
            queueId: active ? undefined : c.queueId
          };
        }
        return c;
      })
    );
  };

  const saveChatbotFlow = (flow: ChatbotFlow) => {
    setChatbotFlow(flow);
    localStorage.setItem('godesc_chatbot_flow', JSON.stringify(flow));
  };

  const publishChatbotFlow = (flow: ChatbotFlow) => {
    const updated = { ...flow, status: 'PUBLISHED' as const };
    setChatbotFlow(updated);
    localStorage.setItem('godesc_chatbot_flow', JSON.stringify(updated));
  };

  const updateBusinessHours = (config: Partial<BusinessHoursConfig>) => {
    setBusinessHours(prev => {
      const updated = { ...prev, ...config };
      try {
        localStorage.setItem('godesc_business_hours', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const saveAttendanceQueue = (queue: AttendanceQueue) => {
    setAttendanceQueues(prev => {
      const idx = prev.findIndex(q => q.id === queue.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = queue;
        return copy;
      }
      return [...prev, queue];
    });
  };

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        userSession,
        login,
        logout,
        managedUsers,
        addManagedUser,
        updateManagedUser,
        deleteManagedUser,
        tickets,
        addTicket,
        updateTicketStatus,
        reassignTicket,
        deleteTicket,
        addTicketMessage,
        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        activeToast,
        dismissToast,
        triggerSystemNotification,
        selectedCategoryFilter,
        setSelectedCategoryFilter,
        services,
        toggleServiceStatus,
        kbCategories,
        updateKBCategories,
        selectedTicket,
        setSelectedTicket,
        soundEnabled,
        setSoundEnabled,
        folders,
        notes,
        addFolder,
        updateFolder,
        deleteFolder,
        addNote,
        updateNote,
        deleteNote,
        calendarEvents,
        addCalendarEvent,
        updateCalendarEvent,
        deleteCalendarEvent,
        triggerCalendarEventReminder,
        vaultCredentials,
        addVaultCredential,
        updateVaultCredential,
        deleteVaultCredential,
        ticketCategories,
        addTicketCategory,
        editTicketCategory,
        addSubCategory,
        deleteSubCategory,
        deleteTicketCategory,
        companies,
        addCompany,
        deleteCompany,
        tiSession,
        auditLogs,
        tiLogin,
        tiLogout,
        unlockUserAccount,
        checkTISessionValid,
        // Central de Atendimento WhatsApp & Chatbot
        whatsappConnection,
        whatsappServerUrl,
        updateWhatsappServerUrl,
        attendanceConversations,
        attendanceMessages,
        attendanceQueues,
        attendanceContacts,
        chatbotFlow,
        businessHours,
        connectWhatsApp,
        disconnectWhatsApp,
        sendAttendanceMessage,
        assignConversation,
        transferConversation,
        closeConversation,
        toggleBotState,
        saveChatbotFlow,
        publishChatbotFlow,
        updateBusinessHours,
        saveAttendanceQueue,
        // Configurações & Notificações de E-mail
        getEmailConfig,
        saveEmailConfig,
        disconnectEmailConfig,
        testEmailConnection,
        dispatchTicketEmail
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
