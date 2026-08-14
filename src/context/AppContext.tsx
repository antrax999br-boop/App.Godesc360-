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
  UserAccount
} from '../types';
import {
  INITIAL_TICKETS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SERVICES,
  INITIAL_DATABASE_FOLDERS,
  INITIAL_DATABASE_NOTES,
  INITIAL_CALENDAR_EVENTS
} from '../data/mockData';
import { supabase } from '../lib/supabase';


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
  addTicket: (ticketData: Omit<Ticket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'messages'>) => Promise<Ticket>;
  updateTicketStatus: (ticketId: string, status: Ticket['status'], technicianNote?: string) => void;
  reassignTicket: (ticketId: string, queue?: ServiceQueue, assignedTo?: string, note?: string) => void;
  deleteTicket: (ticketId: string) => void;
  addTicketMessage: (ticketId: string, text: string, role: 'client' | 'ti') => void;
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
  // TI Session & Security Controls
  tiSession: TISession;
  auditLogs: TISecurityLog[];
  tiLogin: (username: string, password?: string) => { success: boolean; message: string; locked?: boolean };
  tiLogout: () => void;
  unlockUserAccount: (targetUserId: string) => { success: boolean; message: string };
  checkTISessionValid: () => boolean;
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

  // Services state
  const [services, setServices] = useState<ServiceStatus[]>(INITIAL_SERVICES);

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

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('godesc_tickets', JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem('godesc_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Initial Fetch & Realtime Sync from Supabase
  useEffect(() => {
    // 1. Initial fetch tickets from Supabase
    const fetchSupabaseTickets = async () => {
      try {
        const { data, error } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          const mapped: Ticket[] = data.map((item: any) => ({
            id: item.id,
            ticketNumber: item.ticket_number,
            requesterName: item.client_name,
            company: item.company,
            category: item.category,
            subcategory: item.subcategory,
            priority: item.priority as TicketPriority,
            status: item.status as Ticket['status'],
            subject: item.subject,
            description: item.description,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            queue: item.queue as ServiceQueue,
            assignedTo: item.assigned_to,
            pausedReason: item.paused_reason,
            pausedAt: item.paused_at,
            messages: item.messages || []
          }));
          setTickets(mapped);
        }
      } catch (err) {
        console.warn('Supabase fetch error:', err);
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
            const newTicket: Ticket = {
              id: newItem.id,
              ticketNumber: newItem.ticket_number,
              requesterName: newItem.client_name,
              company: newItem.company,
              category: newItem.category,
              subcategory: newItem.subcategory,
              priority: newItem.priority as TicketPriority,
              status: newItem.status as Ticket['status'],
              subject: newItem.subject,
              description: newItem.description,
              createdAt: newItem.created_at,
              updatedAt: newItem.updated_at,
              queue: newItem.queue as ServiceQueue,
              assignedTo: newItem.assigned_to,
              pausedReason: newItem.paused_reason,
              pausedAt: newItem.paused_at,
              messages: newItem.messages || []
            };
            setTickets(prev => {
              if (prev.some(t => t.id === newTicket.id)) return prev;
              return [newTicket, ...prev];
            });
            playNotificationSound();
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new;
            const updatedTicket: Ticket = {
              id: updated.id,
              ticketNumber: updated.ticket_number,
              requesterName: updated.client_name,
              company: updated.company,
              category: updated.category,
              subcategory: updated.subcategory,
              priority: updated.priority as TicketPriority,
              status: updated.status as Ticket['status'],
              subject: updated.subject,
              description: updated.description,
              createdAt: updated.created_at,
              updatedAt: updated.updated_at,
              queue: updated.queue as ServiceQueue,
              assignedTo: updated.assigned_to,
              pausedReason: updated.paused_reason,
              pausedAt: updated.paused_at,
              messages: updated.messages || []
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

  const addTicket = async (
    ticketData: Omit<Ticket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'messages'>
  ): Promise<Ticket> => {
    const ticketSeq = tickets.length + 1;
    const formattedNum = `#${String(ticketSeq).padStart(6, '0')}`;
    const newId = `tk-${Date.now()}`;
    const nowFormatted = 'Hoje às ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newTicket: Ticket = {
      ...ticketData,
      id: newId,
      ticketNumber: formattedNum,
      createdAt: nowFormatted,
      updatedAt: nowFormatted,
      status: 'Novo',
      queue: ticketData.queue || 'N1',
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: ticketData.requesterName,
          role: 'client',
          text: `Chamado aberto via Portal do Cliente: ${ticketData.description}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
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
    try {
      await supabase.from('tickets').insert([{
        id: newId,
        ticket_number: formattedNum,
        client_name: ticketData.requesterName,
        company: ticketData.company || '',
        category: ticketData.category,
        subcategory: ticketData.subcategory || '',
        priority: ticketData.priority,
        status: 'Novo',
        subject: ticketData.subject,
        description: ticketData.description,
        created_at: nowFormatted,
        updated_at: nowFormatted,
        queue: ticketData.queue || 'N1',
        assigned_to: ticketData.assignedTo || null,
        messages: newTicket.messages
      }]);
    } catch (err) {
      console.error('Supabase ticket insert error:', err);
    }

    return newTicket;
  };


  const updateTicketStatus = (ticketId: string, status: Ticket['status'], technicianNote?: string) => {
    const nowFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let updatedTicketObj: Ticket | null = null;
    
    setTickets(prev =>
      prev.map(tk => {
        if (tk.id === ticketId) {
          const updatedMessages = [...tk.messages];
          if (technicianNote) {
            updatedMessages.push({
              id: `msg-${Date.now()}`,
              sender: userSession.name || 'Técnico TI',
              role: 'ti',
              text: technicianNote,
              timestamp: nowFormatted
            });
          }
          updatedTicketObj = {
            ...tk,
            status,
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
        if (technicianNote) {
          updatedMessages.push({
            id: `msg-${Date.now()}`,
            sender: userSession.name || 'Técnico TI',
            role: 'ti',
            text: technicianNote,
            timestamp: nowFormatted
          });
        }
        return {
          ...prev,
          status,
          updatedAt: `Hoje às ${nowFormatted}`,
          messages: updatedMessages
        };
      }
      return prev;
    });

    if (updatedTicketObj) {
      const obj = updatedTicketObj as Ticket;
      supabase.from('tickets').update({
        status: obj.status,
        updated_at: obj.updatedAt,
        messages: obj.messages
      }).eq('id', ticketId).then(({ error }) => {
        if (error) console.warn('Supabase status update error:', error);
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
    }
  };

  const deleteTicket = (ticketId: string) => {
    setTickets(prev => prev.filter(t => t.id !== ticketId));
    setSelectedTicket(prev => (prev?.id === ticketId ? null : prev));
    supabase.from('tickets').delete().eq('id', ticketId).then(({ error }) => {
      if (error) console.warn('Supabase delete ticket error:', error);
    });
  };

  const addTicketMessage = (ticketId: string, text: string, role: 'client' | 'ti') => {
    const nowFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: role === 'client' ? (userSession.isAuthenticated ? userSession.name || 'Solicitante' : 'Solicitante') : (userSession.name || 'Técnico TI'),
      role,
      text,
      timestamp: nowFormatted
    };

    let updatedMessagesList: any[] = [];
    let updatedTimestampStr = `Hoje às ${nowFormatted}`;

    setTickets(prev =>
      prev.map(tk => {
        if (tk.id === ticketId) {
          const senderName = role === 'client' ? tk.requesterName : (userSession.name || 'Técnico TI');
          updatedMessagesList = [
            ...tk.messages,
            {
              ...newMsg,
              sender: senderName
            }
          ];
          return {
            ...tk,
            updatedAt: updatedTimestampStr,
            messages: updatedMessagesList
          };
        }
        return tk;
      })
    );

    setSelectedTicket(prev => {
      if (prev && prev.id === ticketId) {
        const senderName = role === 'client' ? prev.requesterName : (userSession.name || 'Técnico TI');
        return {
          ...prev,
          updatedAt: updatedTimestampStr,
          messages: [
            ...prev.messages,
            {
              ...newMsg,
              sender: senderName
            }
          ]
        };
      }
      return prev;
    });

    supabase.from('tickets').update({
      updated_at: updatedTimestampStr,
      messages: updatedMessagesList
    }).eq('id', ticketId).then(({ error }) => {
      if (error) console.warn('Supabase add message error:', error);
    });
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
    setServices(prev =>
      prev.map(srv => {
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
      })
    );
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
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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
        checkTISessionValid
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
