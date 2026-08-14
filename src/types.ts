export type ScreenView =
  | 'portal_landing'    // Screen 9: Landing selection (FIRST SCREEN)
  | 'client_home'       // Screen 1: Portal do Cliente
  | 'new_ticket'        // Screen 4: Abrir Ticket Form
  | 'login'             // Screen 3: Acesso ao Sistema
  | 'ti_login'          // Tela de Login Específica do T.I.
  | 'ti_dashboard'      // Screen 2: Dashboard TI
  | 'client_my_tickets' // Meus Chamados (Client view)
  | 'knowledge_base'    // Base de Conhecimento
  | 'system_status'     // Status dos Sistemas
  | 'ti_tickets'        // TI Chamados
  | 'ti_queue'          // TI Fila / Kanban
  | 'ti_database'       // Base de Dados (Pastas & Bloco de Notas)
  | 'ti_config'         // Configurações
  | 'ti_calendar'       // Calendário & Lembretes
  | 'ti_audit_logs'     // Logs de Auditoria de Segurança do TI
  | 'ti_new_ticket';    // Abertura Interna de Chamado pelo Suporte T.I.

export type TicketPriority = 'Baixa' | 'Média' | 'Alta' | 'Crítica';

export type TicketStatus = 'Novo' | 'Em Atendimento' | 'Pendente' | 'Resolvido' | 'Fechado';

export type TISecurityEventType =
  | 'TI_LOGIN_SUCCESS'
  | 'TI_LOGIN_FAILED'
  | 'TI_ACCOUNT_LOCKED'
  | 'TI_ACCOUNT_UNLOCKED'
  | 'TI_LOGOUT'
  | 'TI_SESSION_EXPIRED'
  | 'TI_UNAUTHORIZED_ACCESS'
  | 'TI_UNLOCK_PERMISSION_DENIED';

export interface TISecurityLog {
  id: string;
  timestamp: string;
  username: string;
  ip: string;
  userAgent: string;
  eventType: TISecurityEventType;
  attemptNumber?: number;
  unlockedBy?: string;
  reason?: string;
  details?: string;
  result: 'SUCCESS' | 'FAILED' | 'ACCOUNT_LOCKED' | 'ACCOUNT_UNLOCKED' | 'DENIED' | 'EXPIRED';
}

export interface DatabaseFolder {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseNote {
  id: string;
  folderId: string;
  title: string;
  content: string; // Bloco de notas texto livre
  tags: string[];
  isPinned?: boolean;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string; // Nome do evento
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string; // Endereço / Local
  createdBy: string; // Nome de quem criou o evento
  description?: string; // Observações / detalhes
  notes?: string; // Anotações adicionais
  category: 'Manutenção' | 'Reunião' | 'Visita Técnica' | 'Backup' | 'Outro';
  priority: TicketPriority;
  notified?: boolean;
  createdAt: string;
}

export interface ArticleItem {
  id: string;
  title: string;
  category: string;
  status: 'Publicado' | 'Rascunho';
  createdAuthor: string;
  createdDate: string;
  updatedAuthor: string;
  updatedDate: string;
  content: string;
}

export interface CategoryGroup {
  name: string;
  articles: ArticleItem[];
}

export interface TicketAttachment {
  name: string;
  size: string;
  type: string;
  url?: string;
}

export interface TicketMessage {
  id: string;
  sender: string;
  role: 'client' | 'ti' | 'system';
  text: string;
  timestamp: string;
}

export type ServiceQueue = 'N1' | 'N2' | 'N3' | 'ADM';

export interface Ticket {
  id: string;
  ticketNumber: string; // e.g. "#000042"
  requesterName: string;
  requesterEmail: string;
  company: string;
  machineName: string;
  onlyMeOnComputer: boolean;
  category: string;
  subcategory: string;
  priority: TicketPriority;
  status: TicketStatus;
  queue?: ServiceQueue;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  pausedReason?: string;
  pausedAt?: string;
  attachments: TicketAttachment[];
  messages: TicketMessage[];
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  company: string;
  time: string;
  timestamp: number;
  priority: TicketPriority;
  read: boolean;
  ticketId?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  password?: string;
  email: string;
  role: 'admin' | 'technician' | 'client' | 'n1' | 'n2' | 'n3' | 'gestor' | 'ceo';
  avatar?: string;
  allowedModules?: ScreenView[];
  permissions?: {
    canAccessConfig?: boolean;
    canEditTickets?: boolean;
    canDeleteTickets?: boolean;
    canManageUsers?: boolean;
    canManageCategories?: boolean;
    canViewAllKanbans?: boolean;
    canUnlockTIAccount?: boolean;
  };
  // TI Security Lockout Control
  failed_login_attempts?: number;
  locked?: boolean;
  locked_at?: string;
  locked_by?: string;
  last_failed_login_at?: string;
  unlocked_at?: string;
  unlocked_by?: string;
  createdAt?: string;
}

export interface TISession {
  isAuthenticated: boolean;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'technician' | 'client' | 'n1' | 'n2' | 'n3' | 'gestor' | 'ceo';
  loginAt: string;
  expiresAt: number;
  ip: string;
  userAgent: string;
  allowedModules?: ScreenView[];
  permissions?: {
    canAccessConfig?: boolean;
    canEditTickets?: boolean;
    canDeleteTickets?: boolean;
    canManageUsers?: boolean;
    canManageCategories?: boolean;
    canViewAllKanbans?: boolean;
    canUnlockTIAccount?: boolean;
  };
}

export interface UserSession {
  isAuthenticated: boolean;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'technician' | 'client' | 'n1' | 'n2' | 'n3' | 'gestor' | 'ceo';
  avatar?: string;
  allowedModules?: ScreenView[];
  permissions?: {
    canAccessConfig?: boolean;
    canEditTickets?: boolean;
    canDeleteTickets?: boolean;
    canManageUsers?: boolean;
    canManageCategories?: boolean;
    canViewAllKanbans?: boolean;
    canUnlockTIAccount?: boolean;
  };
}

export interface KBArticle {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string[];
  readTime: string;
  helpfulCount: number;
  views: number;
  tags: string[];
}

export interface ServiceStatus {
  id: string;
  name: string;
  endpoint?: string;
  status: 'Operacional' | 'Instabilidade' | 'Erro';
  uptime: string;
  latency: string;
  lastIncident?: string;
  description: string;
}

export interface ClientCompany {
  id: string;
  name: string;
  contactName: string;
  email: string;
  plan: string;
  activeTickets: number;
  mailboxes: number;
  storageUsed: string;
  status: 'Ativo' | 'Suspenso' | 'Em Implantação';
}

export interface DomainItem {
  id: string;
  domain: string;
  clientName: string;
  dnsProvider: string;
  mailboxesCount: number;
  storage: string;
  status: 'OK' | 'Propagando' | 'Alerta';
  sslValid: boolean;
}
