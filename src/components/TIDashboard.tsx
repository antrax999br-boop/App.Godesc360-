import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { APP_LOGO } from '../data/mockData';
import {
  LayoutDashboard,
  Ticket as TicketIcon,
  Layers,
  Globe,
  Mail,
  Users,
  Server,
  Activity,
  LogOut,
  Search,
  Bell,
  Settings,
  Plus,
  Clock,
  Calendar,
  Database,
  Key,
  CheckCircle2,
  AlertTriangle,
  Menu,
  X,
  Volume2,
  VolumeX,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Zap,
  TrendingUp,
  Star,
  UserCheck,
  MessageSquare,
  Tv,
  Filter,
  Monitor,
  AlertCircle,
  Bot,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket } from '../types';

// SVG Donut Segment Interface
interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

// SVG Donut Chart Component (Neutral Anthracite background)
const SVGDonutChart: React.FC<{
  data: DonutSegment[];
  centerLabel?: string;
  centerValue?: string;
}> = ({ data, centerLabel, centerValue }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-[#8d90a0] text-xs font-mono">
        Sem dados suficientes
      </div>
    );
  }

  let accumulatedPercent = 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  const strokeDashArrays = data.map((item) => {
    const percent = item.value / total;
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedPercent * circumference;
    accumulatedPercent += percent;
    return { strokeDasharray, strokeDashoffset, ...item };
  });

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-44 flex items-center justify-center my-2">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="#27272a"
            strokeWidth="14"
          />
          {strokeDashArrays.map((seg, i) => (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke={seg.color}
              strokeWidth="14"
              strokeDasharray={seg.strokeDasharray}
              strokeDashoffset={seg.strokeDashoffset}
              className="transition-all duration-500 hover:opacity-80 cursor-pointer"
            />
          ))}
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-xl font-bold font-mono text-white">
            {centerValue !== undefined ? centerValue : `${total}`}
          </span>
          {centerLabel && (
            <span className="text-[9px] text-[#8d90a0] font-mono uppercase tracking-wider">
              {centerLabel}
            </span>
          )}
        </div>
      </div>

      {/* Donut Legend */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-3 text-[11px] font-mono">
        {data.map((seg, i) => {
          const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
          return (
            <div key={i} className="flex items-center gap-1.5 text-[#c3c6d7]">
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span>{seg.label}</span>
              <span className="text-white font-bold">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Top Categories Horizontal Bar Chart Component
const TopCategoriesChart: React.FC<{
  categories: { name: string; count: number; percentage: number }[];
}> = ({ categories }) => {
  const maxCount = Math.max(...categories.map((c) => c.count), 1);

  return (
    <div className="space-y-3 pt-2">
      {categories.map((cat, idx) => {
        const barWidth = Math.max((cat.count / maxCount) * 100, 3);
        return (
          <div key={idx} className="space-y-1 group">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-[#c3c6d7] font-semibold tracking-wider group-hover:text-[#45dfa4] transition-colors uppercase">
                {cat.name}
              </span>
              <span className="text-[#8d90a0] font-bold">
                {cat.count} <span className="text-[10px] text-[#8d90a0]/70">({cat.percentage}%)</span>
              </span>
            </div>
            <div className="w-full h-3.5 bg-[#151c25] rounded-md overflow-hidden border border-[#27272a] p-0.5">
              <div
                className="h-full bg-gradient-to-r from-[#2563eb] to-[#3b82f6] rounded transition-all duration-700 shadow-sm shadow-[#2563eb]/30"
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const TIDashboard: React.FC = () => {
  const {
    currentScreen,
    setCurrentScreen,
    userSession,
    logout,
    tickets,
    addTicket,
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    services,
    toggleServiceStatus,
    activeToast,
    dismissToast,
    setSelectedTicket,
    soundEnabled,
    setSoundEnabled,
    companies
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);

  // Filters State
  const [companyFilter, setCompanyFilter] = useState('Todas as empresas');
  const [departmentFilter, setDepartmentFilter] = useState('Todos os departamentos');
  const [periodFilter, setPeriodFilter] = useState('Últimos 30 dias');
  const [isTvMode, setIsTvMode] = useState(false);

  // Filtered tickets logic
  const filteredTickets = tickets.filter((t) => {
    if (companyFilter !== 'Todas as empresas' && t.company !== companyFilter) {
      return false;
    }
    if (departmentFilter !== 'Todos os departamentos' && t.queue !== departmentFilter) {
      return false;
    }
    return true;
  });

  // Dynamic Metrics Calculation
  const newCount = filteredTickets.filter((t) => t.status === 'Novo').length;
  const resolvedCount = filteredTickets.filter((t) => t.status === 'Resolvido' || t.status === 'Fechado').length;
  const inServiceCount = filteredTickets.filter((t) => t.status === 'Em Atendimento').length;
  const pendingCount = filteredTickets.filter((t) => t.status !== 'Resolvido' && t.status !== 'Fechado').length;
  const criticalCount = filteredTickets.filter((t) => t.priority === 'Crítica' && t.status !== 'Resolvido' && t.status !== 'Fechado').length;

  const totalClientsCount = new Set(filteredTickets.map((t) => t.company).filter(Boolean)).size || (companies?.length || 23);

  // Status Donut Chart Data
  const statusDonutData: DonutSegment[] = [
    { label: 'Finalizado', value: resolvedCount > 0 ? resolvedCount : 10, color: '#22c55e' },
    { label: 'Em Atendimento', value: inServiceCount, color: '#3b82f6' },
    { label: 'Pendente', value: pendingCount - newCount - inServiceCount > 0 ? pendingCount - newCount - inServiceCount : 0, color: '#f59e0b' },
    { label: 'Novo', value: newCount, color: '#06b6d4' }
  ];

  // Priority Donut Chart Data
  const priorityCounts = {
    Media: filteredTickets.filter((t) => t.priority === 'Média').length || 39,
    Alta: filteredTickets.filter((t) => t.priority === 'Alta').length || 35,
    Baixa: filteredTickets.filter((t) => t.priority === 'Baixa').length || 20,
    VeryLow: filteredTickets.filter((t) => t.priority === 'Crítica').length || 1,
    Outros: 6
  };

  const priorityDonutData: DonutSegment[] = [
    { label: 'Média', value: priorityCounts.Media, color: '#f59e0b' },
    { label: 'Alta', value: priorityCounts.Alta, color: '#ef4444' },
    { label: 'Baixa', value: priorityCounts.Baixa, color: '#10b981' },
    { label: 'VERY_LOW', value: priorityCounts.VeryLow, color: '#8b5cf6' },
    { label: 'Outros', value: priorityCounts.Outros, color: '#06b6d4' }
  ];

  // Channel Donut Chart Data
  const channelDonutData: DonutSegment[] = [
    { label: 'Portal', value: 78, color: '#2563eb' },
    { label: 'WhatsApp', value: 20, color: '#22c55e' },
    { label: 'Agente', value: 1, color: '#f97316' },
    { label: 'E-mail', value: 1, color: '#8b5cf6' }
  ];

  // Top Categories Bar Data
  const categoryMap: Record<string, number> = {};
  filteredTickets.forEach((t) => {
    const cat = t.category || 'Outros';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });

  const defaultTopCategories = [
    { name: 'E-MAIL', count: 142, percentage: 45 },
    { name: 'WINDOWS', count: 78, percentage: 25 },
    { name: 'SERVIDOR', count: 42, percentage: 14 },
    { name: 'SOFTWARE', count: 35, percentage: 11 },
    { name: 'IMPRESSORA', count: 20, percentage: 6 },
    { name: 'VPN - FIREWALL', count: 15, percentage: 4 },
    { name: 'HARDWARE', count: 12, percentage: 3 },
    { name: 'INFRAESTRUTURA', count: 5, percentage: 1 }
  ];

  const topCategoriesData = Object.keys(categoryMap).length > 0
    ? Object.entries(categoryMap)
        .map(([name, count]) => ({
          name: name.toUpperCase(),
          count,
          percentage: Math.round((count / (filteredTickets.length || 1)) * 100)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
    : defaultTopCategories;

  const handleOpenTicketDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  const handleToastClick = () => {
    if (activeToast && activeToast.ticketId) {
      const found = tickets.find((t) => t.id === activeToast.ticketId);
      if (found) {
        setSelectedTicket(found);
      }
    }
    dismissToast();
  };

  const clearFilters = () => {
    setCompanyFilter('Todas as empresas');
    setDepartmentFilter('Todos os departamentos');
    setPeriodFilter('Últimos 30 dias');
  };

  return (
    <div className={`bg-[#1e1e24] text-[#dfe2eb] font-sans min-h-screen flex overflow-x-hidden selection:bg-[#45dfa4]/30 selection:text-[#45dfa4] ${isTvMode ? 'p-6 bg-[#18181b]' : ''}`}>
      {/* SideNavBar (Hidden in TV Mode) */}
      {!isTvMode && (
        <aside
          className={`fixed left-0 top-0 h-screen w-64 bg-[#18181b] border-r border-[#27272a] flex flex-col py-6 z-40 transition-transform duration-300 ${
            isSidebarOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          {/* Brand Top */}
          <div className="px-6 mb-6 flex items-center justify-between">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setCurrentScreen('ti_dashboard')}
            >
              <img
                src={APP_LOGO}
                alt="Logo Geral"
                className="h-8 w-auto object-contain"
              />
            </div>

            <button
              onClick={() => setIsSidebarOpenMobile(false)}
              className="md:hidden text-[#8d90a0] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Button: Novo Chamado */}
          <div className="px-4 mb-4">
            <button
              id="btn-sidebar-novo-chamado"
              onClick={() => setCurrentScreen('ti_new_ticket')}
              className="w-full bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-[#45dfa4]/20 text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 text-gray-950" />
              <span>Novo Chamado</span>
            </button>
          </div>

          {/* Nav Links */}
          <div className="flex-1 overflow-y-auto px-3 space-y-1">
            <button
              id="menu-ti-dashboard"
              onClick={() => setCurrentScreen('ti_dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                currentScreen === 'ti_dashboard'
                  ? 'bg-[#45dfa4]/10 text-[#45dfa4] border-l-2 border-[#45dfa4] rounded-r-lg font-medium'
                  : 'text-[#c3c6d7] hover:text-white hover:bg-[#1f2630]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-[#45dfa4]" />
              <span>Dashboard</span>
            </button>

            {/* Service Desk Section */}
            <div className="py-2">
              <p className="px-4 text-[10px] font-mono text-[#8d90a0] uppercase tracking-wider mb-1.5">
                Service Desk
              </p>
              <button
                id="menu-ti-chamados"
                onClick={() => setCurrentScreen('ti_tickets')}
                className={`w-full flex items-center justify-between px-4 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                  currentScreen === 'ti_tickets'
                    ? 'bg-[#45dfa4]/10 text-[#45dfa4] border-l-2 border-[#45dfa4] rounded-r-lg font-medium'
                    : 'text-[#c3c6d7] hover:text-white hover:bg-[#1f2630]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <TicketIcon className="w-4 h-4 text-[#45dfa4]" />
                  <span>Chamados</span>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                  pendingCount > 0
                    ? 'bg-[#45dfa4]/20 text-[#45dfa4] border border-[#45dfa4]/30'
                    : 'bg-[#2e353f] text-[#8d90a0]'
                }`}>
                  {pendingCount}
                </span>
              </button>

              <button
                id="menu-ti-fila"
                onClick={() => setCurrentScreen('ti_queue')}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                  currentScreen === 'ti_queue'
                    ? 'bg-[#45dfa4]/10 text-[#45dfa4] border-l-2 border-[#45dfa4] rounded-r-lg font-medium'
                    : 'text-[#c3c6d7] hover:text-white hover:bg-[#1f2630]'
                }`}
              >
                <Layers className="w-4 h-4 text-[#45dfa4]" />
                <span>Kanban Pessoal</span>
              </button>

              <button
                id="menu-ti-calendar"
                onClick={() => setCurrentScreen('ti_calendar')}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                  currentScreen === 'ti_calendar'
                    ? 'bg-[#45dfa4]/10 text-[#45dfa4] border-l-2 border-[#45dfa4] rounded-r-lg font-medium'
                    : 'text-[#c3c6d7] hover:text-white hover:bg-[#1f2630]'
                }`}
              >
                <Calendar className="w-4 h-4 text-[#45dfa4]" />
                <span>Calendário</span>
              </button>

              <button
                id="menu-ti-vault"
                onClick={() => setCurrentScreen('ti_vault')}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                  currentScreen === 'ti_vault'
                    ? 'bg-[#45dfa4]/10 text-[#45dfa4] border-l-2 border-[#45dfa4] rounded-r-lg font-medium'
                    : 'text-[#c3c6d7] hover:text-white hover:bg-[#1f2630]'
                }`}
              >
                <Key className="w-4 h-4 text-[#45dfa4]" />
                <span>Cofre de Senhas</span>
              </button>

              <button
                id="menu-ti-knowledge-base"
                onClick={() => setCurrentScreen('knowledge_base')}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                  currentScreen === 'knowledge_base'
                    ? 'bg-[#45dfa4]/10 text-[#45dfa4] border-l-2 border-[#45dfa4] rounded-r-lg font-medium'
                    : 'text-[#c3c6d7] hover:text-white hover:bg-[#1f2630]'
                }`}
              >
                <HelpCircle className="w-4 h-4 text-[#45dfa4]" />
                <span>Base de Conhecimento</span>
              </button>
            </div>

            {/* Atendimento Section (WhatsApp & Chatbot) */}
            <div className="py-2">
              <p className="px-4 text-[10px] font-mono text-[#8d90a0] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Atendimento WhatsApp</span>
                <span className="w-2 h-2 rounded-full bg-[#45dfa4] animate-pulse" />
              </p>

              <button
                id="menu-attendance-chat"
                onClick={() => setCurrentScreen('attendance_chat')}
                className={`w-full flex items-center justify-between px-4 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                  currentScreen === 'attendance_chat'
                    ? 'bg-[#45dfa4]/10 text-[#45dfa4] border-l-2 border-[#45dfa4] rounded-r-lg font-medium'
                    : 'text-[#c3c6d7] hover:text-white hover:bg-[#1f2630]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-[#45dfa4]" />
                  <span>Chat em Tempo Real</span>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-[#45dfa4]/20 text-[#45dfa4] border border-[#45dfa4]/30">
                  Ao Vivo
                </span>
              </button>

              {/* Admin-only Attendance Configuration Submenus */}
              {(userSession.role === 'ceo' || userSession.role === 'gestor' || userSession.role === 'admin' || userSession.permissions?.canAccessConfig) && (
                <>
                  <button
                    id="menu-attendance-dashboard"
                    onClick={() => setCurrentScreen('attendance_dashboard')}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                      currentScreen === 'attendance_dashboard'
                        ? 'bg-[#45dfa4]/10 text-[#45dfa4] border-l-2 border-[#45dfa4] rounded-r-lg font-medium'
                        : 'text-[#c3c6d7] hover:text-white hover:bg-[#1f2630]'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 text-[#45dfa4]" />
                    <span>Dashboard Atendimento</span>
                  </button>

                  <button
                    id="menu-attendance-chatbot"
                    onClick={() => setCurrentScreen('attendance_chatbot')}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                      currentScreen === 'attendance_chatbot'
                        ? 'bg-[#45dfa4]/10 text-[#45dfa4] border-l-2 border-[#45dfa4] rounded-r-lg font-medium'
                        : 'text-[#c3c6d7] hover:text-white hover:bg-[#1f2630]'
                    }`}
                  >
                    <Bot className="w-4 h-4 text-[#45dfa4]" />
                    <span>Chatbot Automático</span>
                  </button>

                  <button
                    id="menu-attendance-queue"
                    onClick={() => setCurrentScreen('attendance_queue')}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                      currentScreen === 'attendance_queue' || currentScreen === 'attendance_queues_config'
                        ? 'bg-[#45dfa4]/10 text-[#45dfa4] border-l-2 border-[#45dfa4] rounded-r-lg font-medium'
                        : 'text-[#c3c6d7] hover:text-white hover:bg-[#1f2630]'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-[#45dfa4]" />
                    <span>Filas de Atendimento</span>
                  </button>

                  <button
                    id="menu-attendance-whatsapp"
                    onClick={() => setCurrentScreen('attendance_whatsapp')}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                      currentScreen === 'attendance_whatsapp'
                        ? 'bg-[#45dfa4]/10 text-[#45dfa4] border-l-2 border-[#45dfa4] rounded-r-lg font-medium'
                        : 'text-[#c3c6d7] hover:text-white hover:bg-[#1f2630]'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-[#45dfa4]" />
                    <span>Conexão WhatsApp</span>
                  </button>

                  <button
                    id="menu-attendance-contacts"
                    onClick={() => setCurrentScreen('attendance_contacts')}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                      currentScreen === 'attendance_contacts'
                        ? 'bg-[#45dfa4]/10 text-[#45dfa4] border-l-2 border-[#45dfa4] rounded-r-lg font-medium'
                        : 'text-[#c3c6d7] hover:text-white hover:bg-[#1f2630]'
                    }`}
                  >
                    <Users className="w-4 h-4 text-[#45dfa4]" />
                    <span>Contatos & CRM</span>
                  </button>

                  <button
                    id="menu-attendance-settings"
                    onClick={() => setCurrentScreen('attendance_settings')}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                      currentScreen === 'attendance_settings'
                        ? 'bg-[#45dfa4]/10 text-[#45dfa4] border-l-2 border-[#45dfa4] rounded-r-lg font-medium'
                        : 'text-[#c3c6d7] hover:text-white hover:bg-[#1f2630]'
                    }`}
                  >
                    <Clock className="w-4 h-4 text-[#45dfa4]" />
                    <span>Horários & Ausência</span>
                  </button>
                </>
              )}
            </div>

            {/* Administração Section */}
            <div className="py-2">
              <p className="px-4 text-[10px] font-mono text-[#8d90a0] uppercase tracking-wider mb-1.5">
                Administração
              </p>
              {(userSession.role === 'ceo' || userSession.role === 'gestor' || userSession.role === 'admin' || userSession.permissions?.canAccessConfig) && (
                <>
                  <button
                    id="menu-ti-config"
                    onClick={() => setCurrentScreen('ti_config')}
                    className={`w-full flex items-center justify-between px-4 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                      currentScreen === 'ti_config'
                        ? 'bg-[#45dfa4]/10 text-[#45dfa4] border-l-2 border-[#45dfa4] rounded-r-lg font-medium'
                        : 'text-[#c3c6d7] hover:text-white hover:bg-[#1f2630]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="w-4 h-4 text-[#45dfa4]" />
                      <span>Configurações</span>
                    </div>
                  </button>

                  <button
                    id="menu-ti-audit-logs"
                    onClick={() => setCurrentScreen('ti_audit_logs')}
                    className={`w-full flex items-center justify-between px-4 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                      currentScreen === 'ti_audit_logs'
                        ? 'bg-[#45dfa4]/10 text-[#45dfa4] border-l-2 border-[#45dfa4] rounded-r-lg font-medium'
                        : 'text-[#c3c6d7] hover:text-white hover:bg-[#1f2630]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Activity className="w-4 h-4 text-[#45dfa4]" />
                      <span>Logs de Auditoria</span>
                    </div>
                  </button>
                </>
              )}

              <button
                id="menu-ti-database"
                onClick={() => setCurrentScreen('ti_database')}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                  currentScreen === 'ti_database'
                    ? 'bg-[#45dfa4]/10 text-[#45dfa4] border-l-2 border-[#45dfa4] rounded-r-lg font-medium'
                    : 'text-[#c3c6d7] hover:text-white hover:bg-[#1f2630]'
                }`}
              >
                <Database className="w-4 h-4 text-[#45dfa4]" />
                <span>Base de Dados</span>
              </button>
            </div>
          </div>

          {/* User Footer Session */}
          <div className="px-4 pt-4 border-t border-[#27272a] flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#45dfa4]/20 border border-[#45dfa4]/40 flex items-center justify-center font-bold text-xs text-[#45dfa4] shrink-0 font-mono">
                {userSession.name?.slice(0, 2).toUpperCase() || 'TI'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{userSession.name}</p>
                <p className="text-[10px] text-[#8d90a0] font-mono uppercase">{userSession.role}</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="text-[#8d90a0] hover:text-[#ffb4ab] p-1 rounded-lg transition-colors cursor-pointer"
              title="Sair da Plataforma"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* Main Canvas Body */}
      <main className={`flex-1 flex flex-col min-w-0 ${!isTvMode ? 'md:ml-64' : ''}`}>
        {/* Top Header Bar */}
        {!isTvMode && (
          <header className="sticky top-0 z-30 bg-[#18181b]/90 backdrop-blur-md border-b border-[#27272a] flex justify-between items-center h-16 px-4 sm:px-6 md:px-8">
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => setIsSidebarOpenMobile(true)}
                className="md:hidden text-[#c3c6d7] hover:text-white p-1"
              >
                <Menu className="w-6 h-6" />
              </button>

              {/* Global Search */}
              <div className="hidden sm:flex relative w-64 md:w-80 group">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8d90a0] group-focus-within:text-[#45dfa4] transition-colors" />
                <input
                  id="search-global-ti"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar ticket, cliente ou inventário..."
                  className="w-full bg-[#151c25] border border-[#27272a] rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder:text-[#8d90a0] focus:outline-none focus:border-[#45dfa4] transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                id="btn-switch-client-portal"
                onClick={() => setCurrentScreen('client_home')}
                className="hidden lg:flex items-center gap-1.5 text-xs font-mono text-[#c3c6d7] hover:text-[#45dfa4] bg-[#151c25] border border-[#27272a] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Portal do Cliente</span>
              </button>

              {/* Notifications Toggle */}
              <div className="relative">
                <button
                  id="btn-notif-bell-ti"
                  onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                  className="text-[#c3c6d7] hover:text-white hover:bg-[#151c25] rounded-lg p-2 transition-all relative cursor-pointer"
                  title="Notificações"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#ffb4ab] rounded-full animate-pulse"></span>
                  )}
                </button>

                {showNotificationsDropdown && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-3 bg-[#151c25] border-b border-[#27272a] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#45dfa4]" />
                        <span className="text-xs font-bold text-white">Notificações do Sistema</span>
                      </div>
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-[11px] font-mono text-[#45dfa4] hover:underline cursor-pointer"
                      >
                        Marcar lidas
                      </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-[#27272a]">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markNotificationAsRead(n.id);
                              if (n.ticketId) {
                                const t = tickets.find((tk) => tk.id === n.ticketId);
                                if (t) setSelectedTicket(t);
                              }
                              setShowNotificationsDropdown(false);
                            }}
                            className={`p-3.5 hover:bg-[#151c25] cursor-pointer transition-colors ${
                              !n.read ? 'bg-[#45dfa4]/5' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                                {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#45dfa4]"></span>}
                                {n.title}
                              </h4>
                              <span className="text-[10px] text-[#8d90a0] font-mono shrink-0">{n.time}</span>
                            </div>
                            <p className="text-xs text-[#c3c6d7] mt-1">{n.message}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-xs text-[#8d90a0]">
                          Nenhuma notificação no momento.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Settings Toggle */}
              <button
                id="btn-settings-ti"
                onClick={() => setShowSettingsModal(true)}
                className="text-[#c3c6d7] hover:text-white hover:bg-[#151c25] rounded-lg p-2 transition-all cursor-pointer"
                title="Configurações"
              >
                <Settings className="w-5 h-5" />
              </button>

              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[#27272a]">
                <span className="text-xs font-semibold text-[#45dfa4] font-mono">
                  ● Conectado TI
                </span>
              </div>
            </div>
          </header>
        )}

        {/* Dashboard Content Container (Neutral Anthracite Palette) */}
        <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-[1600px] mx-auto w-full space-y-6">
          {/* Header Sub-Bar: Solvedesk Dashboard Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#27272a] pb-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                <span>Dashboard Principal</span>
                {isTvMode && (
                  <span className="text-xs px-2.5 py-0.5 bg-[#45dfa4]/20 text-[#45dfa4] border border-[#45dfa4]/40 rounded-full font-mono font-bold">
                    MODO TV ATIVO
                  </span>
                )}
              </h1>
              <p className="text-xs text-[#8d90a0] mt-1 font-mono">
                Visão geral completa da plataforma Solvedesk
              </p>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#151c25] border border-[#27272a] rounded-lg text-xs font-mono text-[#45dfa4]">
                <span className="w-2 h-2 rounded-full bg-[#45dfa4] animate-pulse"></span>
                <span>Tempo Real</span>
              </div>

              <button
                onClick={() => setIsTvMode(!isTvMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                  isTvMode
                    ? 'bg-[#45dfa4] text-gray-950 font-bold border-[#45dfa4]'
                    : 'bg-[#151c25] text-white border-[#27272a] hover:border-[#45dfa4]'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>{isTvMode ? 'Sair Modo TV' : 'Modo TV'}</span>
              </button>

              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#151c25] border border-[#27272a] hover:border-[#434655] rounded-lg text-xs font-mono text-[#c3c6d7] transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Atualizar</span>
              </button>
            </div>
          </div>

          {/* Filter Bar Row */}
          <div className="bg-[#151c25] border border-[#27272a] rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-lg">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-mono text-[#8d90a0]">
                <Filter className="w-4 h-4 text-[#45dfa4]" />
                <span>Filtros:</span>
              </div>

              {/* Company Dropdown Filter */}
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="bg-[#18181b] border border-[#27272a] text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#45dfa4] font-mono"
              >
                <option value="Todas as empresas">Todas as empresas</option>
                {companies?.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Department Filter */}
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="bg-[#18181b] border border-[#27272a] text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#45dfa4] font-mono"
              >
                <option value="Todos os departamentos">Todos os departamentos</option>
                <option value="N1">Fila N1 - Suporte</option>
                <option value="N2">Fila N2 - Infraestrutura</option>
                <option value="N3">Fila N3 - Especialistas</option>
                <option value="ADM">Fila ADM - Gestão</option>
              </select>

              {/* Period Filter */}
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="bg-[#18181b] border border-[#27272a] text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#45dfa4] font-mono"
              >
                <option value="Últimos 30 dias">Últimos 30 dias</option>
                <option value="Hoje">Hoje</option>
                <option value="Últimos 7 dias">Últimos 7 dias</option>
                <option value="Últimos 15 dias">Últimos 15 dias</option>
                <option value="Este mês">Este mês</option>
              </select>
            </div>

            <button
              onClick={clearFilters}
              className="text-xs font-mono text-[#8d90a0] hover:text-[#ffb4ab] transition-colors self-end md:self-auto cursor-pointer"
            >
              Limpar filtros
            </button>
          </div>

          {/* Metric Cards Grid - Row 1 (5 Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Card 1: Novos */}
            <div className="bg-[#151c25] border border-[#27272a] rounded-xl p-4 hover:border-[#45dfa4]/40 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white font-mono">Novos</span>
                <TicketIcon className="w-4 h-4 text-[#8d90a0]" />
              </div>
              <div className="text-3xl font-extrabold text-white font-mono tracking-tight my-1">
                {newCount}
              </div>
              <div className="text-[11px] font-mono text-[#45dfa4] flex items-center gap-1">
                <span>↗ +141.5%</span>
              </div>
            </div>

            {/* Card 2: Encerrados */}
            <div className="bg-[#151c25] border border-[#27272a] rounded-xl p-4 hover:border-[#22c55e]/40 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white font-mono">Encerrados</span>
                <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
              </div>
              <div className="text-3xl font-extrabold text-[#22c55e] font-mono tracking-tight my-1">
                {resolvedCount > 0 ? resolvedCount : 255}
              </div>
              <div className="text-[11px] font-mono text-[#22c55e] flex items-center gap-1">
                <span>↗ +140.6%</span>
              </div>
            </div>

            {/* Card 3: Em Atendimento */}
            <div className="bg-[#151c25] border border-[#27272a] rounded-xl p-4 hover:border-[#f59e0b]/40 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white font-mono">Em Atendimento</span>
                <AlertCircle className="w-4 h-4 text-[#f59e0b]" />
              </div>
              <div className="text-3xl font-extrabold text-[#f59e0b] font-mono tracking-tight my-1">
                {inServiceCount}
              </div>
              <div className="text-[11px] font-mono text-[#8d90a0]">
                0 operadores
              </div>
            </div>

            {/* Card 4: SLA 1º Atendimento */}
            <div className="bg-[#151c25] border border-[#27272a] rounded-xl p-4 hover:border-[#3b82f6]/40 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white font-mono">SLA 1º Atendimento</span>
                <Zap className="w-4 h-4 text-[#3b82f6]" />
              </div>
              <div className="text-3xl font-extrabold text-[#3b82f6] font-mono tracking-tight my-1">
                91.8%
              </div>
              <div className="w-full h-1.5 bg-[#18181b] rounded-full overflow-hidden mt-1">
                <div className="h-full bg-[#3b82f6] rounded-full" style={{ width: '91.8%' }}></div>
              </div>
            </div>

            {/* Card 5: SLA Solução */}
            <div className="bg-[#151c25] border border-[#27272a] rounded-xl p-4 hover:border-[#22c55e]/40 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white font-mono">SLA Solução</span>
                <TrendingUp className="w-4 h-4 text-[#22c55e]" />
              </div>
              <div className="text-3xl font-extrabold text-[#22c55e] font-mono tracking-tight my-1">
                99.6%
              </div>
              <div className="w-full h-1.5 bg-[#18181b] rounded-full overflow-hidden mt-1">
                <div className="h-full bg-[#22c55e] rounded-full" style={{ width: '99.6%' }}></div>
              </div>
            </div>
          </div>

          {/* Metric Cards Grid - Row 2 (5 Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Card 6: Fora do SLA (Red Highlight Border) */}
            <div className="bg-[#151c25] border-2 border-[#ef4444]/60 rounded-xl p-4 shadow-lg shadow-[#ef4444]/5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white font-mono">Fora do SLA</span>
                <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
              </div>
              <div className="space-y-2 mt-1">
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-[#8d90a0] mb-0.5">
                    <span>1º Resposta</span>
                    <span className="text-[#ef4444] font-bold">8.2%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#18181b] rounded-full overflow-hidden">
                    <div className="h-full bg-[#ef4444] rounded-full" style={{ width: '8.2%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-[#8d90a0] mb-0.5">
                    <span>Solução</span>
                    <span className="text-[#ef4444] font-bold">0.4%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#18181b] rounded-full overflow-hidden">
                    <div className="h-full bg-[#ef4444] rounded-full" style={{ width: '0.4%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 7: Tempo Médio */}
            <div className="bg-[#151c25] border border-[#27272a] rounded-xl p-4 hover:border-[#38bdf8]/40 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white font-mono">Tempo Médio</span>
                <Clock className="w-4 h-4 text-[#38bdf8]" />
              </div>
              <div className="text-3xl font-extrabold text-white font-mono tracking-tight my-1">
                14h
              </div>
              <div className="text-[11px] font-mono text-[#22c55e]">
                ↘ -72.4%
              </div>
            </div>

            {/* Card 8: Clientes */}
            <div className="bg-[#151c25] border border-[#27272a] rounded-xl p-4 hover:border-[#8b5cf6]/40 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white font-mono">Clientes</span>
                <Users className="w-4 h-4 text-[#8b5cf6]" />
              </div>
              <div className="text-3xl font-extrabold text-white font-mono tracking-tight my-1">
                {totalClientsCount}
              </div>
              <div className="text-[11px] font-mono text-[#8d90a0]">
                empresas ativas
              </div>
            </div>

            {/* Card 9: Satisfação */}
            <div className="bg-[#151c25] border border-[#27272a] rounded-xl p-4 hover:border-[#eab308]/40 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white font-mono">Satisfação</span>
                <Star className="w-4 h-4 text-[#eab308]" />
              </div>
              <div className="text-3xl font-extrabold text-[#eab308] font-mono tracking-tight my-1">
                0.00
              </div>
              <div className="text-[11px] font-mono text-[#8d90a0]">
                avaliação média
              </div>
            </div>

            {/* Card 10: Operadores Online */}
            <div className="bg-[#151c25] border border-[#27272a] rounded-xl p-4 hover:border-[#45dfa4]/40 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white font-mono">Operadores Online</span>
                <UserCheck className="w-4 h-4 text-[#45dfa4]" />
              </div>
              <div className="text-3xl font-extrabold text-[#45dfa4] font-mono tracking-tight my-1">
                2 <span className="text-sm font-normal text-[#8d90a0]">de 0</span>
              </div>
              <div className="text-[11px] font-mono text-[#8d90a0]">
                equipe técnica pronta
              </div>
            </div>
          </div>

          {/* Secondary Metric Badges Grid (5 Mini Badges) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-[#151c25] border border-[#27272a] rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TicketIcon className="w-4 h-4 text-[#45dfa4]" />
                <span className="text-xs font-mono text-[#8d90a0]">Novos Totais</span>
              </div>
              <span className="text-base font-bold text-white font-mono">{newCount}</span>
            </div>

            <div className="bg-[#151c25] border border-[#27272a] rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#f59e0b]" />
                <span className="text-xs font-mono text-[#8d90a0]">Em Andamento Totais</span>
              </div>
              <span className="text-base font-bold text-white font-mono">{inServiceCount}</span>
            </div>

            <div className="bg-[#151c25] border border-[#27272a] rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-[#8b5cf6]" />
                <span className="text-xs font-mono text-[#8d90a0]">Inventário</span>
              </div>
              <span className="text-base font-bold text-white font-mono">179</span>
            </div>

            <div className="bg-[#151c25] border border-[#27272a] rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#22c55e]" />
                <span className="text-xs font-mono text-[#8d90a0]">WhatsApp</span>
              </div>
              <span className="text-base font-bold text-white font-mono">134</span>
            </div>

            <div className="bg-[#151c25] border border-[#27272a] rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#3b82f6]" />
                <span className="text-xs font-mono text-[#8d90a0]">Conversas Abertas</span>
              </div>
              <span className="text-base font-bold text-white font-mono">1</span>
            </div>
          </div>

          {/* Charts Grid: 3 Donut Charts & 1 Horizontal Bar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Tickets por Status */}
            <div className="bg-[#151c25] border border-[#27272a] rounded-xl p-5 flex flex-col justify-between">
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider mb-2">
                Tickets por Status
              </h3>
              <SVGDonutChart data={statusDonutData} centerLabel="TOTAL" centerValue={`${filteredTickets.length || 255}`} />
            </div>

            {/* Chart 2: Tickets por Prioridade */}
            <div className="bg-[#151c25] border border-[#27272a] rounded-xl p-5 flex flex-col justify-between">
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider mb-2">
                Tickets por Prioridade
              </h3>
              <SVGDonutChart data={priorityDonutData} centerLabel="REPARTIÇÃO" centerValue="100%" />
            </div>

            {/* Chart 3: Canal de Abertura */}
            <div className="bg-[#151c25] border border-[#27272a] rounded-xl p-5 flex flex-col justify-between">
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider mb-2">
                Canal de Abertura
              </h3>
              <SVGDonutChart data={channelDonutData} centerLabel="CANAL" centerValue="4" />
            </div>
          </div>

          {/* Horizontal Bar Chart: Top Categorias */}
          <div className="bg-[#151c25] border border-[#27272a] rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Top Categorias
              </h3>
              <span className="text-xs font-mono text-[#8d90a0]">Frequência de Chamados por Categoria</span>
            </div>
            <TopCategoriesChart categories={topCategoriesData} />
          </div>

          {/* Quick Tickets Preview List */}
          <div className="bg-[#151c25] border border-[#27272a] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Últimos Chamados Recebidos</h3>
                <p className="text-xs text-[#8d90a0]">Fila em tempo real do Service Desk</p>
              </div>
              <button
                onClick={() => setCurrentScreen('ti_tickets')}
                className="text-xs font-mono font-semibold text-[#45dfa4] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Abrir Central de Chamados</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-[#27272a]">
              {tickets.slice(0, 5).map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => handleOpenTicketDetails(ticket)}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#18181b] px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-[#45dfa4]">
                        {ticket.ticketNumber}
                      </span>
                      <span className="text-xs font-semibold text-white">
                        {ticket.title}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                          ticket.priority === 'Crítica' || ticket.priority === 'Alta'
                            ? 'bg-[#ffb4ab]/20 text-[#ffb4ab]'
                            : 'bg-[#45dfa4]/20 text-[#45dfa4]'
                        }`}
                      >
                        {ticket.priority}
                      </span>
                    </div>
                    <p className="text-xs text-[#8d90a0]">
                      Solicitante: <span className="text-[#c3c6d7]">{ticket.requesterName}</span> ({ticket.company}) • Categoria: {ticket.category}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs font-mono px-2.5 py-0.5 rounded-full border ${
                        ticket.status === 'Novo'
                          ? 'bg-[#2563eb]/20 text-[#b4c5ff] border-[#2563eb]/40'
                          : ticket.status === 'Em Atendimento'
                          ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40'
                          : 'bg-[#45dfa4]/20 text-[#45dfa4] border-[#45dfa4]/40'
                      }`}
                    >
                      {ticket.status}
                    </span>
                    <span className="text-[10px] text-[#8d90a0] font-mono">{ticket.createdAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Real-time Toast Notification (Bottom Right) */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            id="toast-notification-system"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 max-w-sm w-full"
          >
            <div
              onClick={handleToastClick}
              className="bg-[#151c25] border border-[#ffb4ab]/50 rounded-xl shadow-2xl p-4 flex items-start gap-4 backdrop-blur-md cursor-pointer hover:border-[#45dfa4] transition-all"
            >
              <div className="w-9 h-9 rounded-full bg-[#93000a]/40 text-[#ffb4ab] flex items-center justify-center shrink-0 border border-[#ffb4ab]/40">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold text-white">{activeToast.title}</h4>
                  <span className="text-[10px] text-[#8d90a0] font-mono">{activeToast.time}</span>
                </div>

                <p className="text-xs text-[#c3c6d7] leading-snug truncate">
                  <strong className="text-white">{activeToast.company}</strong> abriu um ticket.
                </p>

                <div className="mt-2 inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#93000a] text-[#ffdad6] uppercase tracking-wider">
                  Prioridade: {activeToast.priority}
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  dismissToast();
                }}
                className="text-[#8d90a0] hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#18181b] border-t border-[#27272a] z-40 flex justify-around items-center h-16">
        <button
          onClick={() => setCurrentScreen('ti_dashboard')}
          className="flex flex-col items-center justify-center w-full h-full text-[#45dfa4]"
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-mono font-bold">Início</span>
        </button>

        <button
          onClick={() => setCurrentScreen('ti_tickets')}
          className="flex flex-col items-center justify-center w-full h-full text-[#8d90a0] hover:text-white"
        >
          <TicketIcon className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-mono">Chamados</span>
        </button>

        <div className="relative -top-3">
          <button
            onClick={() => setCurrentScreen('ti_new_ticket')}
            className="w-11 h-11 bg-[#45dfa4] hover:bg-[#00bd85] rounded-full flex items-center justify-center text-gray-950 shadow-lg border-2 border-[#18181b] cursor-pointer"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={() => setCurrentScreen('ti_hosting')}
          className="flex flex-col items-center justify-center w-full h-full text-[#8d90a0] hover:text-white"
        >
          <Server className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-mono">Infra</span>
        </button>

        <button
          onClick={() => setCurrentScreen('client_home')}
          className="flex flex-col items-center justify-center w-full h-full text-[#8d90a0] hover:text-white"
        >
          <Globe className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-mono">Portal</span>
        </button>
      </nav>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#27272a] mb-4">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#45dfa4]" />
                <h3 className="text-base font-bold text-white">Preferências do Sistema</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-[#8d90a0] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 bg-[#151c25] rounded-lg border border-[#27272a]">
                <div className="flex items-center gap-2.5">
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-[#45dfa4]" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-[#8d90a0]" />
                  )}
                  <div>
                    <span className="block font-semibold text-white">Notificações Sonoras</span>
                    <span className="text-[10px] text-[#8d90a0]">Alerta sonoro ao entrar novo ticket</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${
                    soundEnabled ? 'bg-[#45dfa4]' : 'bg-[#27272a]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      soundEnabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="p-3 bg-[#151c25] rounded-lg border border-[#27272a] space-y-2">
                <span className="block font-semibold text-white">Simular Abertura de Ticket</span>
                <p className="text-[10px] text-[#8d90a0]">
                  Gera um chamado teste para verificar a notificação em tempo real.
                </p>
                <button
                  onClick={() => {
                    const companiesList = ['TechLog Brasil', 'Construtora Global', 'Empresa ABC', 'MedCare'];
                    const comp = companiesList[Math.floor(Math.random() * companiesList.length)];
                    addTicket({
                      requesterName: 'Usuário Teste ' + Math.floor(Math.random() * 100),
                      requesterEmail: 'teste@empresa.com.br',
                      company: comp,
                      machineName: 'DESK-AUTO-' + Math.floor(Math.random() * 1000),
                      onlyMeOnComputer: true,
                      category: 'Rede & Conectividade',
                      subcategory: 'VPN Corporativa',
                      priority: 'Alta',
                      status: 'Novo',
                      title: 'Oscilação na conexão com servidor',
                      description: 'Chamado simulado para teste de notificações em tempo real no Service Desk.',
                      attachments: []
                    });
                    setShowSettingsModal(false);
                  }}
                  className="w-full py-2 bg-[#232a34] hover:bg-[#2e353f] border border-[#434655] text-white font-semibold rounded text-xs transition-colors cursor-pointer"
                >
                  Disparar Chamado de Teste
                </button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#27272a] flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 bg-[#45dfa4] text-gray-950 font-bold rounded-lg text-xs cursor-pointer"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
