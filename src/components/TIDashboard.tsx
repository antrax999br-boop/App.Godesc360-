import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

import { APP_LOGO } from '../data/mockData';
import {
  LayoutDashboard,
  Ticket as TicketIcon,
  Layers,
  Globe,
  Mail,
  AtSign,
  Users,
  Server,
  ArrowUpRight,
  Activity,
  LogOut,
  Search,
  Bell,
  Settings,
  Plus,
  Clock,
  Calendar,
  Database,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Menu,
  X,
  Volume2,
  VolumeX,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket } from '../types';

export const TIDashboard: React.FC = () => {
  const {
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
    setSoundEnabled
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);

  // Dynamic ticket metrics based on current ticket list
  const criticalCount = tickets.filter(t => t.priority === 'Crítica' && t.status !== 'Resolvido' && t.status !== 'Fechado').length;
  const pendingCount = tickets.filter(t => t.status === 'Novo' || t.status === 'Em Atendimento' || t.status === 'Pendente').length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolvido' || t.status === 'Fechado').length;

  const handleOpenTicketDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  const handleToastClick = () => {
    if (activeToast && activeToast.ticketId) {
      const found = tickets.find(t => t.id === activeToast.ticketId);
      if (found) {
        setSelectedTicket(found);
      }
    }
    dismissToast();
  };

  return (
    <div className="bg-[#1e1e24] text-[#dfe2eb] font-sans min-h-screen flex overflow-x-hidden selection:bg-[#45dfa4]/30 selection:text-[#45dfa4]">
      {/* SideNavBar (Desktop & Mobile Drawer) */}
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
          {/* Active Tab: Dashboard */}
          <button
            id="menu-ti-dashboard"
            onClick={() => setCurrentScreen('ti_dashboard')}
            className="w-full flex items-center gap-3 px-4 py-2.5 bg-[#45dfa4]/10 text-[#45dfa4] border-l-2 border-[#45dfa4] rounded-r-lg font-medium text-sm text-left transition-colors"
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
              className="w-full flex items-center justify-between px-4 py-2 text-[#c3c6d7] hover:text-white hover:bg-[#1f2630] rounded-lg text-sm text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <TicketIcon className="w-4 h-4 text-[#8d90a0]" />
                <span>Chamados</span>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#2e353f] text-[#c3c6d7] rounded-full">
                {tickets.length}
              </span>
            </button>

            <button
              id="menu-ti-fila"
              onClick={() => setCurrentScreen('ti_queue')}
              className="w-full flex items-center gap-3 px-4 py-2 text-[#c3c6d7] hover:text-white hover:bg-[#1f2630] rounded-lg text-sm text-left transition-colors"
            >
              <Layers className="w-4 h-4 text-[#8d90a0]" />
              <span>Kanban Pessoal</span>
            </button>

            <button
              id="menu-ti-knowledge-base"
              onClick={() => setCurrentScreen('knowledge_base')}
              className="w-full flex items-center gap-3 px-4 py-2 text-[#c3c6d7] hover:text-white hover:bg-[#1f2630] rounded-lg text-sm text-left transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-[#8d90a0]" />
              <span>Base de Conhecimento</span>
            </button>
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
                  className="w-full flex items-center justify-between px-4 py-2 text-[#c3c6d7] hover:text-white hover:bg-[#1f2630] rounded-lg text-sm text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-[#8d90a0]" />
                    <span>Configurações</span>
                  </div>
                </button>

                <button
                  id="menu-ti-audit-logs"
                  onClick={() => setCurrentScreen('ti_audit_logs')}
                  className="w-full flex items-center justify-between px-4 py-2 text-[#c3c6d7] hover:text-white hover:bg-[#1f2630] rounded-lg text-sm text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-[#45dfa4]" />
                    <span>Logs de Segurança TI</span>
                  </div>
                </button>
              </>
            )}

            <button
              id="menu-ti-calendar"
              onClick={() => setCurrentScreen('ti_calendar')}
              className="w-full flex items-center gap-3 px-4 py-2 text-[#c3c6d7] hover:text-white hover:bg-[#1f2630] rounded-lg text-sm text-left transition-colors"
            >
              <Calendar className="w-4 h-4 text-[#8d90a0]" />
              <span>Calendário</span>
            </button>
          </div>
        </div>

        {/* Bottom User Area */}
        <div className="mt-auto px-4 pt-3 border-t border-[#2A2F3A]">
          <div className="flex items-center gap-3 px-3 py-2.5 text-[#c3c6d7] bg-[#181c22] rounded-lg border border-[#2A2F3A]">
            <div className="w-7 h-7 rounded-full bg-[#45dfa4]/20 text-[#45dfa4] flex items-center justify-center font-bold text-xs">
              {userSession.username.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 truncate">
              <span className="block text-xs font-semibold text-white truncate">
                {userSession.username || 'admin'}
              </span>
              <span className="block text-[10px] text-[#8d90a0] font-mono">
                {userSession.role === 'ceo' ? 'CEO' : userSession.role === 'gestor' ? 'Gestor' : userSession.role === 'n3' ? 'Nível 3' : userSession.role === 'n2' ? 'Nível 2' : userSession.role === 'n1' ? 'Nível 1' : userSession.role === 'admin' ? 'Administrador' : 'Técnico TI'}
              </span>
            </div>
          </div>

          <button
            id="btn-logout-sidebar"
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 text-[#ffb4ab] hover:text-[#ffdad6] hover:bg-[#93000a]/20 rounded-lg text-xs font-semibold transition-colors mt-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col relative pb-20 md:pb-12">
        {/* TopNavBar */}
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
                placeholder="Pesquisa Global (chamados, clientes, domínios)..."
                className="w-full bg-[#151c25] border border-[#2A2F3A] rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder:text-[#8d90a0] focus:outline-none focus:border-[#45dfa4] focus:ring-1 focus:ring-[#45dfa4]/20 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View client portal button */}
            <button
              id="btn-switch-client-portal"
              onClick={() => setCurrentScreen('client_home')}
              className="hidden lg:flex items-center gap-1.5 text-xs font-mono text-[#c3c6d7] hover:text-[#45dfa4] bg-[#181c22] border border-[#2A2F3A] px-3 py-1.5 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Portal do Cliente</span>
            </button>

            {/* Notifications Toggle */}
            <div className="relative">
              <button
                id="btn-notif-bell-ti"
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className="text-[#c3c6d7] hover:text-white hover:bg-[#1f2630] rounded-lg p-2 transition-all relative"
                title="Notificações"
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#ffb4ab] rounded-full animate-pulse"></span>
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {showNotificationsDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#181c22] border border-[#2A2F3A] rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-3 bg-[#111827] border-b border-[#2A2F3A] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#45dfa4]" />
                      <span className="text-xs font-bold text-white">Notificações do Sistema</span>
                      {unreadNotificationCount > 0 && (
                        <span className="bg-[#ffb4ab]/20 text-[#ffb4ab] text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                          {unreadNotificationCount} novas
                        </span>
                      )}
                    </div>
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-[11px] font-mono text-[#45dfa4] hover:underline"
                    >
                      Marcar lidas
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-[#2A2F3A]">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotificationAsRead(n.id);
                            if (n.ticketId) {
                              const t = tickets.find(tk => tk.id === n.ticketId);
                              if (t) setSelectedTicket(t);
                            }
                            setShowNotificationsDropdown(false);
                          }}
                          className={`p-3.5 hover:bg-[#1f2630] cursor-pointer transition-colors ${
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
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[10px] font-mono text-[#8d90a0]">{n.company}</span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                                n.priority === 'Crítica' || n.priority === 'Alta'
                                  ? 'bg-[#93000a]/30 text-[#ffb4ab]'
                                  : 'bg-[#45dfa4]/20 text-[#45dfa4]'
                              }`}
                            >
                              {n.priority}
                            </span>
                          </div>
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
              className="text-[#c3c6d7] hover:text-white hover:bg-[#1f2630] rounded-lg p-2 transition-all"
              title="Configurações"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Login TI Status */}
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[#2A2F3A]">
              <span className="text-xs font-semibold text-[#45dfa4] font-mono">
                ● Conectado TI
              </span>
            </div>
          </div>
        </header>

        {/* Dashboard Canvas Container */}
        <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
          {/* Page Title & Status */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Dashboard
              </h2>
              <p className="text-xs sm:text-sm text-[#8d90a0] mt-1">
                Visão geral da infraestrutura DescCloud e gestão de Service Desk
              </p>
            </div>
            <div className="text-xs font-mono text-[#8d90a0] flex items-center gap-1.5 bg-[#181c22] px-3 py-1.5 rounded-lg border border-[#2A2F3A]">
              <Clock className="w-3.5 h-3.5 text-[#45dfa4]" />
              <span>Atualizado agora</span>
            </div>
          </div>

          {/* 4 Top Metrics Grid: Tickets Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Metric 1: Tickets Concluídos */}
            <div
              onClick={() => setCurrentScreen('ti_tickets')}
              className="bg-[#111827] border border-[#2A2F3A] rounded-xl p-5 hover:border-[#45dfa4]/50 transition-all duration-200 relative overflow-hidden group cursor-pointer"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-[11px] font-mono text-[#8d90a0] uppercase tracking-wider">
                  Tickets Concluídos
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#181c22] flex items-center justify-center border border-[#2A2F3A] group-hover:border-[#45dfa4]/40">
                  <CheckCircle2 className="w-4 h-4 text-[#45dfa4]" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#45dfa4] mb-1 font-mono">
                {resolvedCount}
              </div>
              <div className="text-xs text-[#8d90a0]">volume total finalizado</div>
            </div>

            {/* Metric 2: Em Aberto */}
            <div
              onClick={() => setCurrentScreen('ti_tickets')}
              className="bg-[#111827] border border-[#2A2F3A] rounded-xl p-5 hover:border-[#45dfa4]/50 transition-all duration-200 relative overflow-hidden group cursor-pointer"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-[11px] font-mono text-[#8d90a0] uppercase tracking-wider">
                  Em Aberto
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#181c22] flex items-center justify-center border border-[#2A2F3A] group-hover:border-[#45dfa4]/40">
                  <Layers className="w-4 h-4 text-[#2563eb]" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#2563eb] mb-1 font-mono">
                {pendingCount}
              </div>
              <div className="text-xs text-[#8d90a0]">aguardando atendimento</div>
            </div>

            {/* Metric 3: Atrasados */}
            <div
              onClick={() => setCurrentScreen('ti_tickets')}
              className="bg-[#111827] border border-[#2A2F3A] rounded-xl p-5 hover:border-[#ffb4ab]/50 transition-all duration-200 relative overflow-hidden group cursor-pointer"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-[11px] font-mono text-[#8d90a0] uppercase tracking-wider">
                  Atrasados (SLA)
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#181c22] flex items-center justify-center border border-[#2A2F3A] group-hover:border-[#ffb4ab]/40">
                  <AlertTriangle className="w-4 h-4 text-[#ffb4ab]" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#ffb4ab] mb-1 font-mono">
                {criticalCount > 0 ? criticalCount : 1}
              </div>
              <div className="text-xs text-[#8d90a0]">fora do prazo limite</div>
            </div>

            {/* Metric 4: Média de Tempo */}
            <div
              className="bg-[#111827] border border-[#2A2F3A] rounded-xl p-5 hover:border-[#ffb95f]/50 transition-all duration-200 relative overflow-hidden group"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-[11px] font-mono text-[#8d90a0] uppercase tracking-wider">
                  Tempo Médio (Resolução)
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#181c22] flex items-center justify-center border border-[#2A2F3A] group-hover:border-[#ffb95f]/40">
                  <Clock className="w-4 h-4 text-[#ffb95f]" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#ffb95f] mb-1 font-mono flex items-baseline gap-1">
                1<span className="text-base font-normal text-[#8d90a0]">h</span> 45<span className="text-base font-normal text-[#8d90a0]">m</span>
              </div>
              <div className="text-xs text-[#8d90a0]">média por chamado</div>
            </div>
          </div>

          {/* Storage Highlight Row & Tickets Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Storage de Email (Spans 2 cols) */}
            <div className="bg-[#111827] border border-[#2A2F3A] rounded-xl p-6 col-span-1 lg:col-span-2 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <HardDrive className="w-36 h-36 text-white" />
              </div>

              <div className="flex justify-between items-start mb-6 relative z-10">
                <span className="text-xs font-mono text-[#8d90a0] uppercase tracking-wider">
                  Storage de Email
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#181c22] flex items-center justify-center border border-[#2A2F3A]">
                  <Database className="w-4 h-4 text-[#45dfa4]" />
                </div>
              </div>

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <div className="text-4xl sm:text-5xl font-extrabold text-[#45dfa4] mb-1 font-mono flex items-baseline gap-2">
                    2.05 <span className="text-2xl font-normal text-[#8d90a0]">TB</span>
                  </div>
                  <div className="text-xs text-[#8d90a0] font-mono">946.2 GB livres</div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-xs text-[#8d90a0] font-mono mb-2">68% de 3.0 TB</div>
                  <div className="w-full sm:w-56 h-2.5 bg-[#181c22] rounded-full overflow-hidden border border-[#2A2F3A]">
                    <div className="h-full bg-[#45dfa4] rounded-full" style={{ width: '68%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visão de Chamados Hoje */}
            <div
              onClick={() => setCurrentScreen('ti_tickets')}
              className="bg-[#111827] border border-[#2A2F3A] rounded-xl p-6 hover:border-[#45dfa4]/50 transition-colors cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-mono text-[#8d90a0] uppercase tracking-wider">
                  Visão de Chamados Hoje
                </h3>
                <span className="text-xs font-mono text-[#45dfa4] hover:underline">Ver Todos</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ffb4ab]"></div>
                    <span className="text-xs text-white">Críticos</span>
                  </div>
                  <span className="font-mono font-bold text-white text-sm">{criticalCount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ffb95f]"></div>
                    <span className="text-xs text-white">Pendentes / Em Fila</span>
                  </div>
                  <span className="font-mono font-bold text-white text-sm">{pendingCount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#45dfa4]"></div>
                    <span className="text-xs text-white">Resolvidos</span>
                  </div>
                  <span className="font-mono font-bold text-white text-sm">{resolvedCount}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#2A2F3A] mt-4 flex justify-between items-end">
                <span className="text-xs text-[#8d90a0]">SLA Médio</span>
                <span className="text-xl font-bold font-mono text-[#45dfa4]">98.5%</span>
              </div>
            </div>
          </div>

          {/* Service Status Bento Grid */}
          <div className="bg-[#1B1F27] border border-[#2A2F3A] rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#8d90a0]" />
                <h3 className="text-base font-bold text-white">Status dos Serviços</h3>
              </div>
              <button
                onClick={() => setCurrentScreen('system_status')}
                className="text-xs font-mono text-[#45dfa4] hover:underline"
              >
                Detalhes &amp; Histórico
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.slice(0, 5).map((srv) => (
                <div
                  key={srv.id}
                  onClick={() => toggleServiceStatus(srv.id)}
                  title="Clique para simular alteração de estado"
                  className={`bg-[#111827] border rounded-lg p-4 flex justify-between items-center cursor-pointer transition-all ${
                    srv.status === 'Erro'
                      ? 'border-[#ffb4ab]/40 hover:bg-[#93000a]/10'
                      : srv.status === 'Instabilidade'
                      ? 'border-[#ffb95f]/40 hover:bg-[#ffb95f]/5'
                      : 'border-[#2A2F3A] hover:bg-[#1f2630]'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold text-white mb-0.5">{srv.name}</div>
                    {srv.endpoint && (
                      <div className="text-[10px] text-[#8d90a0] font-mono">{srv.endpoint}</div>
                    )}
                  </div>

                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold uppercase ${
                      srv.status === 'Operacional'
                        ? 'bg-[#45dfa4]/10 text-[#45dfa4] border-[#45dfa4]/30'
                        : srv.status === 'Instabilidade'
                        ? 'bg-[#ffb95f]/10 text-[#ffb95f] border-[#ffb95f]/30'
                        : 'bg-[#ffb4ab]/10 text-[#ffb4ab] border-[#ffb4ab]/30'
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        srv.status === 'Operacional'
                          ? 'bg-[#45dfa4] animate-pulse'
                          : srv.status === 'Instabilidade'
                          ? 'bg-[#ffb95f]'
                          : 'bg-[#ffb4ab]'
                      }`}
                    ></div>
                    <span>{srv.status === 'Operacional' ? 'OK' : srv.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Tickets Preview List */}
          <div className="bg-[#111827] border border-[#2A2F3A] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Últimos Chamados Recebidos</h3>
                <p className="text-xs text-[#8d90a0]">Fila em tempo real do Service Desk</p>
              </div>
              <button
                onClick={() => setCurrentScreen('ti_tickets')}
                className="text-xs font-mono font-semibold text-[#45dfa4] hover:underline flex items-center gap-1"
              >
                <span>Abrir Central de Chamados</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-[#2A2F3A]">
              {tickets.slice(0, 4).map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => handleOpenTicketDetails(ticket)}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#181c22] px-2 rounded-lg cursor-pointer transition-colors"
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
                          ? 'bg-[#ffb95f]/20 text-[#ffb95f] border-[#ffb95f]/40'
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
              className="bg-[#1B1F27] border border-[#ffb4ab]/50 rounded-xl shadow-2xl p-4 flex items-start gap-4 backdrop-blur-md cursor-pointer hover:border-[#45dfa4] transition-all"
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
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#111827] border-t border-[#2A2F3A] z-40 flex justify-around items-center h-16">
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
          <div className="bg-[#181c22] border border-[#2A2F3A] rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#2A2F3A] mb-4">
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
              <div className="flex items-center justify-between p-3 bg-[#111827] rounded-lg border border-[#2A2F3A]">
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
                    soundEnabled ? 'bg-[#45dfa4]' : 'bg-[#2A2F3A]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      soundEnabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="p-3 bg-[#111827] rounded-lg border border-[#2A2F3A] space-y-2">
                <span className="block font-semibold text-white">Simular Abertura de Ticket</span>
                <p className="text-[10px] text-[#8d90a0]">
                  Gera um chamado teste para verificar a notificação em tempo real.
                </p>
                <button
                  onClick={() => {
                    const companies = ['TechLog Brasil', 'Construtora Global', 'Empresa ABC', 'MedCare'];
                    const comp = companies[Math.floor(Math.random() * companies.length)];
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
                  className="w-full py-2 bg-[#232a34] hover:bg-[#2e353f] border border-[#434655] text-white font-semibold rounded text-xs transition-colors"
                >
                  Disparar Chamado de Teste
                </button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#2A2F3A] flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 bg-[#45dfa4] text-gray-950 font-bold rounded-lg text-xs"
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
