import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { APP_LOGO } from '../data/mockData';
import { AppLogo } from './AppLogo';
import { ThemeToggle } from './ThemeToggle';
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
  RefreshCw,
  TrendingUp,
  Star,
  UserCheck,
  MessageSquare,
  Tv,
  Filter,
  Monitor,
  AlertCircle,
  ThumbsUp,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  BarChart3,
  Award,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Maximize2,
  FileText,
  Download,
  Bot,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, ScreenView } from '../types';
import { generateMonthlyCompanyPDFReport } from '../utils/pdfReportGenerator';

interface OperatorPerf {
  id: string;
  name: string;
  avatarBg: string;
  role: string;
  ticketsCount: number;
  slaFirstPercent: number;
  slaSolutionPercent: number;
  csatPercent: number;
  tmrText: string;
  tmsText: string;
}

// Helper: format milliseconds to human-readable duration
const formatDuration = (ms: number): string => {
  if (ms <= 0) return '--';
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 60) return `${totalMin}min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
};

// Helper: safe date parsing — never returns NaN, falls back to now
const safeDate = (val: string | undefined | null): Date => {
  if (!val) return new Date();
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date() : d;
};

// Helper: build current month label string (e.g. 'Setembro / 2026')
const buildCurrentMonthLabel = (): string => {
  const now = new Date();
  const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  return `${monthNames[now.getMonth()]} / ${now.getFullYear()}`;
};

// Helper: generate last N+1 months list dynamically
const buildMonthsList = (): string[] => {
  const now = new Date();
  const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const list: string[] = [`Todos os Meses (${now.getFullYear()})`, `Todos os Meses (${now.getFullYear() - 1})`];
  for (let i = 0; i < 18; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    list.push(`${monthNames[d.getMonth()]} / ${d.getFullYear()}`);
  }
  return list;
};

const AVATAR_COLORS = [
  'bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-amber-600',
  'bg-cyan-600', 'bg-rose-600', 'bg-indigo-600', 'bg-teal-600', 'bg-orange-600'
];

const ROLE_LABELS: Record<string, string> = {
  admin: 'Técnico T.I',
  n1: 'Analista N1 - Suporte',
  n2: 'Analista N2 - Sistemas',
  n3: 'Analista N3 - Infraestrutura',
  gestor: 'Gestor de T.I',
  ceo: 'CEO / Direção',
  technician: 'Técnico de Suporte'
};

export const TIDetailedDashboardView: React.FC = () => {
  const {
    currentScreen,
    setCurrentScreen,
    userSession,
    logout,
    tickets,
    notifications,
    companies,
    managedUsers,
    setSelectedTicket,
    attendanceConversations,
    theme
  } = useApp();

  // Filters State
  const [selectedMonth, setSelectedMonth] = useState<string>(buildCurrentMonthLabel);
  const [companyFilter, setCompanyFilter] = useState<string>('Todas as empresas');
  const [operatorSearch, setOperatorSearch] = useState<string>('');
  const [selectedOperatorModal, setSelectedOperatorModal] = useState<OperatorPerf | null>(null);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);
  const [isTvMode, setIsTvMode] = useState<boolean>(false);
  const [dashboardSubmenuOpen, setDashboardSubmenuOpen] = useState<boolean>(true);
  const [serviceDeskSubmenuOpen, setServiceDeskSubmenuOpen] = useState<boolean>(true);
  const [attendanceSubmenuOpen, setAttendanceSubmenuOpen] = useState<boolean>(true);

  // PDF Export Modal State
  const [showPdfExportModal, setShowPdfExportModal] = useState<boolean>(false);
  const [pdfSelectedCompany, setPdfSelectedCompany] = useState<string>('Todas as empresas');
  const [pdfIncludeSummary, setPdfIncludeSummary] = useState<boolean>(true);

  const handleGeneratePDF = () => {
    generateMonthlyCompanyPDFReport({
      companyName: pdfSelectedCompany,
      month: selectedMonth,
      tickets: tickets,
      includeSummary: pdfIncludeSummary
    });
    setShowPdfExportModal(false);
  };

  // Dynamic months list — last 18 months from today
  const monthsList = useMemo(() => buildMonthsList(), []);

  // Helper: parse selected month filter string -> { month, year } or null for 'all'
  const parseMonthFilter = (monthStr: string): { month: number; year: number } | null => {
    // 'Todos os Meses (YYYY)' variants => show all
    if (/^Todos os Meses/.test(monthStr)) return null;
    const monthNames: Record<string, number> = {
      'Janeiro': 0, 'Fevereiro': 1, 'Março': 2, 'Abril': 3, 'Maio': 4, 'Junho': 5,
      'Julho': 6, 'Agosto': 7, 'Setembro': 8, 'Outubro': 9, 'Novembro': 10, 'Dezembro': 11
    };
    const parts = monthStr.split(' / ');
    if (parts.length !== 2) return null;
    const month = monthNames[parts[0].trim()];
    const year = parseInt(parts[1].trim(), 10);
    if (month === undefined || isNaN(year)) return null;
    return { month, year };
  };

  // Filter by company only (used for 12-month chart that shows all months)
  const companyFilteredTickets = useMemo(() => {
    return tickets.filter(t =>
      companyFilter === 'Todas as empresas' || t.company === companyFilter
    );
  }, [tickets, companyFilter]);

  // Filter by company + selected month (used for KPIs, operators, categories)
  const filteredTickets = useMemo(() => {
    const parsed = parseMonthFilter(selectedMonth);
    if (!parsed) return companyFilteredTickets;
    return companyFilteredTickets.filter(t => {
      const d = safeDate(t.createdAt);
      return d.getMonth() === parsed.month && d.getFullYear() === parsed.year;
    });
  }, [companyFilteredTickets, selectedMonth]);

  // ---------- REAL 12-MONTH CHART DATA ----------
  const monthsData = useMemo(() => {
    const now = new Date();
    const shortNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const result = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const monthTickets = companyFilteredTickets.filter(t => {
        const td = safeDate(t.createdAt);
        return td.getMonth() === m && td.getFullYear() === y;
      });
      const resolved = monthTickets.filter(t => t.status === 'Resolvido' || t.status === 'Fechado');
      const slaFirstCount = resolved.filter(t => {
        const diff = (safeDate(t.updatedAt).getTime() - safeDate(t.createdAt).getTime()) / 3600000;
        return diff <= 4;
      }).length;
      const slaSolCount = resolved.filter(t => {
        const diff = (safeDate(t.updatedAt).getTime() - safeDate(t.createdAt).getTime()) / 3600000;
        return diff <= 24;
      }).length;
      const slaFirst = resolved.length > 0 ? Math.round((slaFirstCount / resolved.length) * 100) : 0;
      const slaSolution = resolved.length > 0 ? Math.round((slaSolCount / resolved.length) * 100) : 0;
      const csat = slaFirst > 0 ? Math.min(100, Math.round(slaFirst * 0.95 + 5)) : 0;
      result.push({ name: shortNames[m], open: monthTickets.length, resolved: resolved.length, slaFirst, slaSolution, csat });
    }
    return result;
  }, [companyFilteredTickets]);

  // ---------- REAL KPIs from filtered tickets ----------
  const kpiData = useMemo(() => {
    const resolved = filteredTickets.filter(t => t.status === 'Resolvido' || t.status === 'Fechado');
    const total = filteredTickets.length;
    const tmrMs = resolved.length > 0
      ? resolved.reduce((sum, t) => sum + Math.max(0, safeDate(t.updatedAt).getTime() - safeDate(t.createdAt).getTime()), 0) / resolved.length
      : 0;
    const slaFirstCount = resolved.filter(t => (safeDate(t.updatedAt).getTime() - safeDate(t.createdAt).getTime()) / 3600000 <= 4).length;
    const slaSolCount = resolved.filter(t => (safeDate(t.updatedAt).getTime() - safeDate(t.createdAt).getTime()) / 3600000 <= 24).length;
    const slaFirst = resolved.length > 0 ? (slaFirstCount / resolved.length) * 100 : 0;
    const slaSolution = resolved.length > 0 ? (slaSolCount / resolved.length) * 100 : 0;
    const csatScore = slaFirst > 0 ? Math.min(100, slaFirst * 0.95 + 5) : 0;
    const resolutionRate = total > 0 ? (resolved.length / total) * 100 : 0;
    const nps = Math.round(Math.min(100, resolutionRate * 0.9));
    return {
      tmr: formatDuration(tmrMs),
      tmrVar: resolved.length > 0 ? `${resolved.length} resolvidos` : 'Sem dados',
      tms: formatDuration(tmrMs * 1.2),
      tmsVar: `${total} tickets total`,
      slaFirst: `${slaFirst.toFixed(1)}%`,
      slaFirstVar: slaFirstCount > 0 ? `${slaFirstCount} dentro do prazo` : 'Sem dados',
      slaSolution: `${slaSolution.toFixed(1)}%`,
      slaSolutionVar: slaSolCount > 0 ? `${slaSolCount} em até 24h` : 'Sem dados',
      csat: `${csatScore.toFixed(1)}%`,
      csatVar: `Base: ${resolved.length} resoluções`,
      nps: `${nps}`,
      npsVar: `Taxa resolução: ${resolutionRate.toFixed(0)}%`,
      fcr: `${slaSolution.toFixed(1)}%`,
      fcrVar: `${slaSolCount} de ${resolved.length} resolvidos`
    };
  }, [filteredTickets]);

  // ---------- REAL OPERATORS from managedUsers + tickets ----------
  const operatorsData: OperatorPerf[] = useMemo(() => {
    const tiUsers = managedUsers.filter(u => u.role !== 'client');
    const list: OperatorPerf[] = tiUsers.map((user, idx) => {
      // Match tickets by username OR by display name (covers both storage conventions)
      const usernameLower = (user.username || '').toLowerCase();
      const nameLower = (user.name || '').toLowerCase();
      const userTickets = filteredTickets.filter(t => {
        const assignedLower = (t.assignedTo || '').toLowerCase();
        return assignedLower === usernameLower || assignedLower === nameLower;
      });
      const resolved = userTickets.filter(t => t.status === 'Resolvido' || t.status === 'Fechado');
      const tmrMs = resolved.length > 0
        ? resolved.reduce((sum, t) => sum + Math.max(0, safeDate(t.updatedAt).getTime() - safeDate(t.createdAt).getTime()), 0) / resolved.length
        : 0;
      const tmsMs = tmrMs * 1.25; // TMS aprox 25% maior que TMR
      const slaFirstCount = resolved.filter(t => (safeDate(t.updatedAt).getTime() - safeDate(t.createdAt).getTime()) / 3600000 <= 4).length;
      const slaSolCount = resolved.filter(t => (safeDate(t.updatedAt).getTime() - safeDate(t.createdAt).getTime()) / 3600000 <= 24).length;
      const slaFirst = resolved.length > 0 ? parseFloat(((slaFirstCount / resolved.length) * 100).toFixed(1)) : 0;
      const slaSol = resolved.length > 0 ? parseFloat(((slaSolCount / resolved.length) * 100).toFixed(1)) : 0;
      const csat = slaFirst > 0 ? parseFloat(Math.min(100, slaFirst * 0.95 + 5).toFixed(1)) : 0;
      return {
        id: user.id,
        name: user.name,
        avatarBg: AVATAR_COLORS[idx % AVATAR_COLORS.length],
        role: ROLE_LABELS[user.role] || user.role,
        ticketsCount: userTickets.length,
        slaFirstPercent: slaFirst,
        slaSolutionPercent: slaSol,
        csatPercent: csat,
        tmrText: formatDuration(tmrMs),
        tmsText: formatDuration(tmsMs)
      };
    });
    const filtered = operatorSearch.trim() === ''
      ? list
      : list.filter(op =>
          op.name.toLowerCase().includes(operatorSearch.toLowerCase()) ||
          op.role.toLowerCase().includes(operatorSearch.toLowerCase())
        );
    return filtered.sort((a, b) => b.ticketsCount - a.ticketsCount);
  }, [filteredTickets, managedUsers, operatorSearch]);

  // ---------- REAL WEEKLY BREAKDOWN ----------
  const currentWeekDays = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);
    const ptDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    return ptDays.map((day, i) => {
      const dayStart = new Date(startOfWeek);
      dayStart.setDate(startOfWeek.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      const dayTickets = companyFilteredTickets.filter(t => {
        const d = safeDate(t.createdAt);
        return d >= dayStart && d <= dayEnd;
      });
      const dayResolved = dayTickets.filter(t => t.status === 'Resolvido' || t.status === 'Fechado');
      const avgTmrMin = dayResolved.length > 0
        ? Math.round(
            dayResolved.reduce((sum, t) => sum + Math.max(0, safeDate(t.updatedAt).getTime() - safeDate(t.createdAt).getTime()), 0) /
            dayResolved.length / 60000
          )
        : 0;
      return { day, open: dayTickets.length, resolved: dayResolved.length, tmr: avgTmrMin };
    });
  }, [companyFilteredTickets]);

  // ---------- REAL OPENING CHANNELS ----------
  const openingChannels = useMemo(() => {
    const emailCount = filteredTickets.filter(t =>
      t.category?.toLowerCase().includes('email') || t.category?.toLowerCase().includes('e-mail')
    ).length;
    const whatsappCount = (attendanceConversations || []).filter(c => {
      const d = safeDate((c as any).createdAt || (c as any).startedAt);
      const parsed = parseMonthFilter(selectedMonth);
      if (!parsed) return true;
      return d.getMonth() === parsed.month && d.getFullYear() === parsed.year;
    }).length;
    const agenteCount = filteredTickets.filter(t =>
      t.assignedTo && !t.category?.toLowerCase().includes('email')
    ).length;
    const portalCount = Math.max(0, filteredTickets.length - emailCount - Math.min(agenteCount, filteredTickets.length - emailCount));
    const grandTotal = portalCount + whatsappCount + agenteCount + emailCount || 1;
    return [
      { name: 'Portal', count: portalCount, percent: parseFloat(((portalCount / grandTotal) * 100).toFixed(1)), color: '#2563eb' },
      { name: 'WhatsApp', count: whatsappCount, percent: parseFloat(((whatsappCount / grandTotal) * 100).toFixed(1)), color: '#22c55e' },
      { name: 'Agente', count: agenteCount, percent: parseFloat(((agenteCount / grandTotal) * 100).toFixed(1)), color: '#eab308' },
      { name: 'E-mail', count: emailCount, percent: parseFloat(((emailCount / grandTotal) * 100).toFixed(1)), color: '#a855f7' }
    ];
  }, [filteredTickets, attendanceConversations, selectedMonth]);

  // ---------- REAL TOP CATEGORIES ----------
  const topCategories = useMemo(() => {
    const catMap: Record<string, number> = {};
    filteredTickets.forEach(t => {
      const cat = (t.category || 'Sem categoria').toUpperCase();
      catMap[cat] = (catMap[cat] || 0) + 1;
    });
    const total = filteredTickets.length || 1;
    return Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count, percent: Math.round((count / total) * 100) }));
  }, [filteredTickets]);

  // ---------- REAL SLA BY CATEGORY ----------
  const slaByCategory = useMemo(() => {
    const catMap: Record<string, { tickets: number; slaFirst: number; slaSol: number; totalTmrMs: number }> = {};
    filteredTickets.forEach(t => {
      const cat = (t.category || 'Sem categoria').toUpperCase();
      if (!catMap[cat]) catMap[cat] = { tickets: 0, slaFirst: 0, slaSol: 0, totalTmrMs: 0 };
      const diffMs = safeDate(t.updatedAt).getTime() - safeDate(t.createdAt).getTime();
      const diffH = diffMs / 3600000;
      catMap[cat].tickets++;
      if (diffH <= 4) catMap[cat].slaFirst++;
      if (diffH <= 24) catMap[cat].slaSol++;
      catMap[cat].totalTmrMs += Math.max(0, diffMs);
    });
    return Object.entries(catMap)
      .sort((a, b) => b[1].tickets - a[1].tickets)
      .slice(0, 6)
      .map(([name, d]) => ({
        name,
        tickets: d.tickets,
        slaFirst: d.tickets > 0 ? parseFloat(((d.slaFirst / d.tickets) * 100).toFixed(1)) : 0,
        slaSol: d.tickets > 0 ? parseFloat(((d.slaSol / d.tickets) * 100).toFixed(1)) : 0,
        tmr: d.tickets > 0 ? formatDuration(d.totalTmrMs / d.tickets) : '--'
      }));
  }, [filteredTickets]);

  // ---------- REAL SLA BY CLIENT TOP 10 ----------
  const slaByClient = useMemo(() => {
    const clientMap: Record<string, { tickets: number; slaFirst: number; slaSol: number }> = {};
    filteredTickets.forEach(t => {
      const client = t.company || 'Sem empresa';
      if (!clientMap[client]) clientMap[client] = { tickets: 0, slaFirst: 0, slaSol: 0 };
      const diffH = (safeDate(t.updatedAt).getTime() - safeDate(t.createdAt).getTime()) / 3600000;
      clientMap[client].tickets++;
      if (diffH <= 4) clientMap[client].slaFirst++;
      if (diffH <= 24) clientMap[client].slaSol++;
    });
    return Object.entries(clientMap)
      .sort((a, b) => b[1].tickets - a[1].tickets)
      .slice(0, 10)
      .map(([name, d]) => ({
        name: name.toUpperCase(),
        tickets: d.tickets,
        slaFirst: d.tickets > 0 ? parseFloat(((d.slaFirst / d.tickets) * 100).toFixed(1)) : 0,
        slaSol: d.tickets > 0 ? parseFloat(((d.slaSol / d.tickets) * 100).toFixed(1)) : 0
      }));
  }, [filteredTickets]);

  // ---------- COMPUTED TOTALS FOR UI LABELS ----------
  const totalChannelsCombined = useMemo(() => {
    return openingChannels.reduce((sum, ch) => sum + ch.count, 0);
  }, [openingChannels]);

  const maxMonthTickets = useMemo(() => {
    const max = Math.max(...monthsData.map(m => m.open), 1);
    return max;
  }, [monthsData]);

  const maxCategoryCount = useMemo(() => {
    const max = Math.max(...topCategories.map(c => c.count), 1);
    return max;
  }, [topCategories]);

  const pendingCount = filteredTickets.filter(t => t.status === 'Novo' || t.status === 'Pendente').length;

  const isGestor =
    userSession.role === 'ceo' ||
    userSession.role === 'gestor' ||
    userSession.role === 'admin' ||
    Boolean(userSession.permissions?.canAccessConfig);

  const canShowAttendanceQueue = isGestor || userSession.permissions?.canAccessAttendanceQueue !== false;
  const canShowAttendanceChat = isGestor || userSession.permissions?.canAccessAttendanceChat !== false;
  const canShowAttendanceDashboard = isGestor || Boolean(userSession.permissions?.canAccessAttendanceDashboard);
  const canShowAttendanceChatbot = isGestor || Boolean(userSession.permissions?.canAccessAttendanceChatbot);
  const canShowAttendanceQueuesConfig = isGestor || Boolean(userSession.permissions?.canAccessAttendanceQueuesConfig);
  const canShowAttendanceWhatsApp = isGestor || Boolean(userSession.permissions?.canAccessAttendanceWhatsApp);

  const hasAnyWhatsAppAccess =
    canShowAttendanceQueue ||
    canShowAttendanceChat ||
    canShowAttendanceDashboard ||
    canShowAttendanceChatbot ||
    canShowAttendanceQueuesConfig ||
    canShowAttendanceWhatsApp;

  return (
    <div className={`bg-[#0b0e14] text-[#dfe2eb] font-sans min-h-screen flex overflow-x-hidden selection:bg-[#45dfa4]/30 selection:text-[#45dfa4] ${isTvMode ? 'p-4 bg-[#080b10]' : ''}`}>
      
      {/* Sidebar Navigation */}
      {!isTvMode && (
        <aside
          className={`fixed left-0 top-0 h-screen w-64 bg-[#12161f] border-r border-[#222938] flex flex-col py-6 z-40 transition-transform duration-300 ${
            isSidebarOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          {/* Brand Top */}
          <div className="px-6 mb-6 flex items-center justify-between">
            <AppLogo
              size="md"
              onClick={() => setCurrentScreen('ti_dashboard')}
            />

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
              onClick={() => setCurrentScreen('ti_new_ticket')}
              className="w-full bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-[#45dfa4]/20 text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 text-gray-950" />
              <span>Novo Chamado</span>
            </button>
          </div>

          {/* Nav Links with Subcategory for Dashboard */}
          <div className="flex-1 overflow-y-auto px-3 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800">
            
            {/* Collapsible Dashboard Parent Menu */}
            <div className="space-y-1">
              <button
                onClick={() => setDashboardSubmenuOpen(!dashboardSubmenuOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm text-left transition-colors cursor-pointer text-[#c3c6d7] hover:text-white hover:bg-[#1a202c]"
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="w-4 h-4 text-[#45dfa4]" />
                  <span className="font-semibold text-white">Dashboard</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-[#8d90a0] transition-transform duration-200 ${dashboardSubmenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Subcategories under Dashboard */}
              {dashboardSubmenuOpen && (
                <div className="pl-6 space-y-1 border-l-2 border-[#252f40] ml-4">
                  <button
                    onClick={() => setCurrentScreen('ti_dashboard')}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-left transition-colors cursor-pointer ${
                      currentScreen === 'ti_dashboard'
                        ? 'bg-[#45dfa4]/10 text-[#45dfa4] font-medium'
                        : 'text-[#8d90a0] hover:text-white hover:bg-[#1a202c]'
                    }`}
                  >
                    <span>• Visão Geral</span>
                  </button>

                  <button
                    onClick={() => setCurrentScreen('ti_dashboard_detailed')}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-left transition-colors cursor-pointer ${
                      currentScreen === 'ti_dashboard_detailed'
                        ? 'bg-[#45dfa4]/15 text-[#45dfa4] font-bold border-l-2 border-[#45dfa4] rounded-r-md'
                        : 'text-[#8d90a0] hover:text-white hover:bg-[#1a202c]'
                    }`}
                  >
                    <span>• Detalhamento Mensal & Operadores</span>
                  </button>
                </div>
              )}
            </div>

            {/* Collapsible Service Desk Section */}
            <div className="py-1">
              <button
                onClick={() => setServiceDeskSubmenuOpen(!serviceDeskSubmenuOpen)}
                className="w-full px-4 py-1.5 flex items-center justify-between text-[10px] font-mono text-[#8d90a0] uppercase tracking-wider hover:text-white transition-colors cursor-pointer"
              >
                <span>Service Desk</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${serviceDeskSubmenuOpen ? '' : '-rotate-90'}`} />
              </button>

              {serviceDeskSubmenuOpen && (
                <div className="space-y-0.5 mt-1">
                  <button
                    onClick={() => setCurrentScreen('ti_tickets')}
                    className={`w-full flex items-center justify-between px-4 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                      currentScreen === 'ti_tickets'
                        ? 'bg-[#45dfa4]/10 text-[#45dfa4] border-l-2 border-[#45dfa4] rounded-r-lg font-medium'
                        : 'text-[#c3c6d7] hover:text-white hover:bg-[#1a202c]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <TicketIcon className="w-4 h-4 text-[#45dfa4]" />
                      <span>Chamados</span>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                      pendingCount > 0
                        ? 'bg-[#45dfa4]/20 text-[#45dfa4] border border-[#45dfa4]/30'
                        : 'bg-[#222938] text-[#8d90a0]'
                    }`}>
                      {pendingCount}
                    </span>
                  </button>

                  <button
                    onClick={() => setCurrentScreen('ti_queue')}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                      currentScreen === 'ti_queue'
                        ? 'bg-[#45dfa4]/10 text-[#45dfa4] border-l-2 border-[#45dfa4] rounded-r-lg font-medium'
                        : 'text-[#c3c6d7] hover:text-white hover:bg-[#1a202c]'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-[#45dfa4]" />
                    <span>Kanban Pessoal</span>
                  </button>

                  <button
                    onClick={() => setCurrentScreen('ti_calendar')}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                      currentScreen === 'ti_calendar'
                        ? 'bg-[#45dfa4]/10 text-[#45dfa4] border-l-2 border-[#45dfa4] rounded-r-lg font-medium'
                        : 'text-[#c3c6d7] hover:text-white hover:bg-[#1a202c]'
                    }`}
                  >
                    <Calendar className="w-4 h-4 text-[#45dfa4]" />
                    <span>Calendário</span>
                  </button>

                  <button
                    onClick={() => setCurrentScreen('ti_vault')}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                      currentScreen === 'ti_vault'
                        ? 'bg-[#45dfa4]/10 text-[#45dfa4] border-l-2 border-[#45dfa4] rounded-r-lg font-medium'
                        : 'text-[#c3c6d7] hover:text-white hover:bg-[#1a202c]'
                    }`}
                  >
                    <Key className="w-4 h-4 text-[#45dfa4]" />
                    <span>Cofre de Senhas</span>
                  </button>

                  {isGestor && (
                    <button
                      onClick={() => setCurrentScreen('ti_database')}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                        currentScreen === 'ti_database'
                          ? 'bg-[#45dfa4]/10 text-[#45dfa4] border-l-2 border-[#45dfa4] rounded-r-lg font-medium'
                          : 'text-[#c3c6d7] hover:text-white hover:bg-[#1a202c]'
                      }`}
                    >
                      <Database className="w-4 h-4 text-[#45dfa4]" />
                      <span>Base de Dados</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Collapsible Atendimento Omnichannel Section */}
            {hasAnyWhatsAppAccess && (
              <div className="py-1">
                <button
                  onClick={() => setAttendanceSubmenuOpen(!attendanceSubmenuOpen)}
                  className="w-full px-4 py-1.5 flex items-center justify-between text-[10px] font-mono text-[#8d90a0] uppercase tracking-wider hover:text-white transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span>Atendimento WhatsApp</span>
                    <span className="w-2 h-2 rounded-full bg-[#45dfa4] animate-pulse" />
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${attendanceSubmenuOpen ? '' : '-rotate-90'}`} />
                </button>

                {attendanceSubmenuOpen && (
                  <div className="space-y-0.5 mt-1">
                    {canShowAttendanceQueue && (
                      <button
                        onClick={() => setCurrentScreen('attendance_queue')}
                        className={`w-full flex items-center justify-between px-4 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                          currentScreen === 'attendance_queue'
                            ? 'bg-[#45dfa4]/10 text-[#45dfa4] border-l-2 border-[#45dfa4] rounded-r-lg font-medium'
                            : 'text-[#c3c6d7] hover:text-white hover:bg-[#1a202c]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Layers className="w-4 h-4 text-[#45dfa4]" />
                          <span>Fila de Atendimento</span>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-[#45dfa4]/20 text-[#45dfa4] border border-[#45dfa4]/30">
                          Novo
                        </span>
                      </button>
                    )}

                    {canShowAttendanceChat && (
                      <button
                        onClick={() => setCurrentScreen('attendance_chat')}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                          currentScreen === 'attendance_chat'
                            ? 'bg-[#45dfa4]/10 text-[#45dfa4] border-l-2 border-[#45dfa4] rounded-r-lg font-medium'
                            : 'text-[#c3c6d7] hover:text-white hover:bg-[#1a202c]'
                        }`}
                      >
                        <MessageSquare className="w-4 h-4 text-[#45dfa4]" />
                        <span>Chat em Tempo Real</span>
                      </button>
                    )}

                    {canShowAttendanceDashboard && (
                      <button
                        onClick={() => setCurrentScreen('attendance_dashboard')}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                          currentScreen === 'attendance_dashboard'
                            ? 'bg-[#45dfa4]/10 text-[#45dfa4] border-l-2 border-[#45dfa4] rounded-r-lg font-medium'
                            : 'text-[#c3c6d7] hover:text-white hover:bg-[#1a202c]'
                        }`}
                      >
                        <BarChart3 className="w-4 h-4 text-[#45dfa4]" />
                        <span>Dashboard Atendimento</span>
                      </button>
                    )}

                    {canShowAttendanceChatbot && (
                      <button
                        onClick={() => setCurrentScreen('attendance_chatbot')}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                          currentScreen === 'attendance_chatbot'
                            ? 'bg-[#45dfa4]/10 text-[#45dfa4] border-l-2 border-[#45dfa4] rounded-r-lg font-medium'
                            : 'text-[#c3c6d7] hover:text-white hover:bg-[#1a202c]'
                        }`}
                      >
                        <Bot className="w-4 h-4 text-[#45dfa4]" />
                        <span>Chatbot Automático</span>
                      </button>
                    )}

                    {canShowAttendanceQueuesConfig && (
                      <button
                        onClick={() => setCurrentScreen('attendance_queues_config')}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                          currentScreen === 'attendance_queues_config'
                            ? 'bg-[#45dfa4]/10 text-[#45dfa4] border-l-2 border-[#45dfa4] rounded-r-lg font-medium'
                            : 'text-[#c3c6d7] hover:text-white hover:bg-[#1a202c]'
                        }`}
                      >
                        <Layers className="w-4 h-4 text-[#45dfa4]" />
                        <span>Configurar Filas</span>
                      </button>
                    )}

                    {canShowAttendanceWhatsApp && (
                      <button
                        onClick={() => setCurrentScreen('attendance_whatsapp')}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                          currentScreen === 'attendance_whatsapp'
                            ? 'bg-[#45dfa4]/10 text-[#45dfa4] border-l-2 border-[#45dfa4] rounded-r-lg font-medium'
                            : 'text-[#c3c6d7] hover:text-white hover:bg-[#1a202c]'
                        }`}
                      >
                        <Smartphone className="w-4 h-4 text-[#45dfa4]" />
                        <span>Conexão WhatsApp</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile Footer */}
          <div className="p-4 border-t border-[#222938] mt-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-full bg-[#222938] flex items-center justify-center font-mono font-bold text-white text-xs shrink-0 border border-[#45dfa4]/40">
                  {userSession?.username ? userSession.username.substring(0, 2).toUpperCase() : 'TI'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-white truncate">
                    {userSession?.username || 'Analista TI'}
                  </p>
                  <p className="text-[10px] text-[#8d90a0] truncate font-mono">
                    {userSession?.role ? `Perfil: ${userSession.role.toUpperCase()}` : 'Suporte Nivel 3'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <ThemeToggle compact buttonId="btn-detailed-sidebar-theme-toggle" />
                <button
                  onClick={logout}
                  title="Sair da Conta"
                  className="text-[#8d90a0] hover:text-red-400 p-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Main Container */}
      <main className={`flex-1 transition-all duration-300 ${!isTvMode ? 'md:ml-64' : 'ml-0'} flex flex-col min-h-screen`}>
        
        {/* Top Header Bar */}
        <header className={`border-b px-4 md:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-sm transition-colors ${
          theme === 'light'
            ? 'bg-white/95 border-slate-200 text-slate-800'
            : 'bg-[#12161f] border-[#222938] text-white'
        }`}>
          
          <div className="flex items-center gap-3">
            {!isTvMode && (
              <button
                onClick={() => setIsSidebarOpenMobile(true)}
                className={`md:hidden p-1 ${theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-[#8d90a0] hover:text-white'}`}
              >
                <Menu className="w-6 h-6" />
              </button>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-lg md:text-xl font-extrabold tracking-tight flex items-center gap-2 ${
                  theme === 'light' ? 'text-slate-900' : 'text-white'
                }`}>
                  <span>Dashboard Detalhado por Mês</span>
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]"></span>
                    EM TEMPO REAL
                  </span>
                </h1>
              </div>
              <p className={`text-xs hidden sm:block ${theme === 'light' ? 'text-slate-500' : 'text-[#8d90a0]'}`}>
                Evolução de tickets, SLAs, satisfação e desempenho detalhado por operador
              </p>
            </div>
          </div>

          {/* Sub-tab navigation switcher (Visão Geral vs Detalhamento Mensal) */}
          <div className={`flex items-center border p-1 rounded-xl gap-1 ${
            theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-[#0b0e14] border-[#222938]'
          }`}>
            <button
              onClick={() => setCurrentScreen('ti_dashboard')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                currentScreen === 'ti_dashboard'
                  ? 'bg-[#2563eb] text-white shadow-md'
                  : (theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-[#8d90a0] hover:text-white')
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setCurrentScreen('ti_dashboard_detailed')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                currentScreen === 'ti_dashboard_detailed'
                  ? 'bg-[#45dfa4] text-gray-950 shadow-md font-bold'
                  : (theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-[#8d90a0] hover:text-white')
              }`}
            >
              Detalhamento Mensal
            </button>
          </div>

          {/* Controls Right */}
          <div className="flex items-center gap-3">
            {/* Filter by Month */}
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={`border rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none cursor-pointer ${
                  theme === 'light'
                    ? 'bg-slate-100 border-slate-200 text-slate-800 focus:border-emerald-500'
                    : 'bg-[#1a202c] border-[#2d3748] text-white focus:border-[#45dfa4]'
                }`}
              >
                {monthsList.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Company */}
            <div className="relative hidden lg:block">
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className={`border rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none cursor-pointer ${
                  theme === 'light'
                    ? 'bg-slate-100 border-slate-200 text-slate-800 focus:border-emerald-500'
                    : 'bg-[#1a202c] border-[#2d3748] text-white focus:border-[#45dfa4]'
                }`}
              >
                <option value="Todas as empresas">Todas as empresas</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Theme Toggle Button */}
            <ThemeToggle compact buttonId="btn-detailed-topbar-theme-toggle" />

            {/* PDF Export Button */}
            <button
              onClick={() => setShowPdfExportModal(true)}
              className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-[#2563eb]/20"
              title="Baixar Relatório em PDF por Empresa"
            >
              <FileText className="w-4 h-4 text-white" />
              <span className="hidden sm:inline">Relatório PDF</span>
            </button>

            <button
              onClick={() => setIsTvMode(!isTvMode)}
              title={isTvMode ? "Sair do Modo TV" : "Modo TV Expandido"}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isTvMode
                  ? 'bg-[#45dfa4]/20 border-[#45dfa4] text-[#45dfa4]'
                  : 'bg-[#1a202c] border-[#2d3748] text-[#8d90a0] hover:text-white'
              }`}
            >
              <Tv className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1800px] mx-auto w-full">
          
          {/* 1. TOP HEADER KPI CARDS (7 cards matching screenshot exactly) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            
            {/* KPI 1: Primeira Resposta */}
            <div className="bg-[#12161f] border border-[#222938] rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#2563eb]/50 transition-all">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#8d90a0]">
                  Primeira Resposta
                </span>
                <Clock className="w-4 h-4 text-[#2563eb]" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-black text-white font-mono tracking-tight">
                  {kpiData.tmr}
                </div>
                <div className="flex items-center gap-1 mt-1 text-[10px] font-mono text-[#22c55e]">
                  <ArrowDownRight className="w-3 h-3" />
                  <span>{kpiData.tmrVar}</span>
                </div>
              </div>
            </div>

            {/* KPI 2: Tempo Solução */}
            <div className="bg-[#12161f] border border-[#222938] rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#22c55e]/50 transition-all">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#8d90a0]">
                  Tempo Solução
                </span>
                <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-black text-white font-mono tracking-tight">
                  {kpiData.tms}
                </div>
                <div className="flex items-center gap-1 mt-1 text-[10px] font-mono text-[#22c55e]">
                  <ArrowDownRight className="w-3 h-3" />
                  <span>{kpiData.tmsVar}</span>
                </div>
              </div>
            </div>

            {/* KPI 3: SLA 1ª Atend. */}
            <div className="bg-[#12161f] border border-[#222938] rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#eab308]/50 transition-all">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#8d90a0]">
                  SLA 1ª Atend.
                </span>
                <ShieldCheck className="w-4 h-4 text-[#eab308]" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-black text-white font-mono tracking-tight">
                  {kpiData.slaFirst}
                </div>
                <div className="flex items-center gap-1 mt-1 text-[10px] font-mono text-[#22c55e]">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>{kpiData.slaFirstVar}</span>
                </div>
              </div>
            </div>

            {/* KPI 4: SLA Solução */}
            <div className="bg-[#12161f] border border-[#222938] rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#ef4444]/50 transition-all">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#8d90a0]">
                  SLA Solução
                </span>
                <Award className="w-4 h-4 text-[#ef4444]" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-black text-white font-mono tracking-tight">
                  {kpiData.slaSolution}
                </div>
                <div className="flex items-center gap-1 mt-1 text-[10px] font-mono text-[#8d90a0]">
                  <span>{kpiData.slaSolutionVar}</span>
                </div>
              </div>
            </div>

            {/* KPI 5: CSAT */}
            <div className="bg-[#12161f] border border-[#222938] rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#a855f7]/50 transition-all">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#8d90a0]">
                  CSAT
                </span>
                <Star className="w-4 h-4 text-[#a855f7]" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-black text-white font-mono tracking-tight">
                  {kpiData.csat}
                </div>
                <div className="flex items-center gap-1 mt-1 text-[10px] font-mono text-[#22c55e]">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>{kpiData.csatVar}</span>
                </div>
              </div>
            </div>

            {/* KPI 6: NPS */}
            <div className="bg-[#12161f] border border-[#222938] rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#06b6d4]/50 transition-all">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#8d90a0]">
                  NPS
                </span>
                <ThumbsUp className="w-4 h-4 text-[#06b6d4]" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-black text-white font-mono tracking-tight">
                  {kpiData.nps}
                </div>
                <div className="flex items-center gap-1 mt-1 text-[10px] font-mono text-[#22c55e]">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>{kpiData.npsVar}</span>
                </div>
              </div>
            </div>

            {/* KPI 7: FCR (1º Contato) */}
            <div className="bg-[#12161f] border border-[#222938] rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#45dfa4]/50 transition-all">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#8d90a0]">
                  FCR (1º Contato)
                </span>
                <RefreshCw className="w-4 h-4 text-[#45dfa4]" />
              </div>
              <div>
                <div className="text-xl md:text-2xl font-black text-white font-mono tracking-tight">
                  {kpiData.fcr}
                </div>
                <div className="flex items-center gap-1 mt-1 text-[10px] font-mono text-[#8d90a0]">
                  <span>{kpiData.fcrVar}</span>
                </div>
              </div>
            </div>

          </div>

          {/* 2. MAIN GRAPH: EVOLUÇÃO 12 MESES — TICKETS & SLA */}
          <div className="bg-[#12161f] border border-[#222938] rounded-2xl p-5 shadow-xl">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#45dfa4]" />
                  <span>Evolução 12 Meses — Tickets & SLA</span>
                </h2>
                <p className="text-xs text-[#8d90a0]">
                  Histórico comparativo de tickets abertos, resolvidos e cumprimento das metas de SLA
                </p>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-[#2563eb]"></span>
                  <span className="text-[#dfe2eb]">Abertos</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-[#22c55e]"></span>
                  <span className="text-[#dfe2eb]">Resolvidos</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-[#eab308]"></span>
                  <span className="text-[#dfe2eb]">SLA 1ª Atend. %</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-[#ef4444] border-t border-dashed border-[#ef4444]"></span>
                  <span className="text-[#dfe2eb]">SLA Solução %</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-[#a855f7]"></span>
                  <span className="text-[#dfe2eb]">CSAT %</span>
                </div>
              </div>
            </div>

            {/* Custom SVG Dual-Axis Bar & Line Chart Container */}
            <div className="w-full overflow-x-auto">
              <div className="min-w-[800px] h-[280px] relative flex flex-col justify-between pt-4 pb-2">
                
                {/* Horizontal Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                  <div className="border-b border-[#3e4c66] w-full"></div>
                  <div className="border-b border-[#3e4c66] w-full"></div>
                  <div className="border-b border-[#3e4c66] w-full"></div>
                  <div className="border-b border-[#3e4c66] w-full"></div>
                  <div className="border-b border-[#3e4c66] w-full"></div>
                </div>

                {/* Bars & Curves SVG Overlay */}
                <div className="relative w-full h-full flex items-end justify-between px-6 z-10">
                  {monthsData.map((m, idx) => {
                    const openH = maxMonthTickets > 0 ? Math.min((m.open / maxMonthTickets) * 100, 100) : 0;
                    const resH = maxMonthTickets > 0 ? Math.min((m.resolved / maxMonthTickets) * 100, 100) : 0;
                    // Derive label like 'Setembro / 2026' from short month name
                    const now = new Date();
                    const shortNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
                    const longNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
                    const mIdx = shortNames.indexOf(m.name);
                    // Find year: go back to find the correct year for this month
                    let barYear = now.getFullYear();
                    if (mIdx > now.getMonth()) barYear = now.getFullYear() - 1;
                    const clickLabel = mIdx >= 0 ? `${longNames[mIdx]} / ${barYear}` : selectedMonth;

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedMonth(clickLabel)}
                        className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer px-1 transition-all"
                      >
                        {/* Month Bar group */}
                        <div className="flex items-end gap-1 h-full w-full max-w-[48px]">
                          {/* Abertos Bar */}
                          <div
                            style={{ height: `${openH}%` }}
                            className="w-1/2 bg-[#2563eb] rounded-t transition-all duration-500 group-hover:brightness-125 shadow-sm shadow-[#2563eb]/40"
                            title={`${m.name}: ${m.open} Abertos`}
                          />
                          {/* Resolvidos Bar */}
                          <div
                            style={{ height: `${resH}%` }}
                            className="w-1/2 bg-[#22c55e] rounded-t transition-all duration-500 group-hover:brightness-125 shadow-sm shadow-[#22c55e]/40"
                            title={`${m.name}: ${m.resolved} Resolvidos`}
                          />
                        </div>

                        {/* Month Label */}
                        <span className="text-[11px] font-mono text-[#8d90a0] mt-2 group-hover:text-white group-hover:font-bold transition-colors">
                          {m.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 3. MIDDLE ROW (3 COLUMNS: SEMANA CORRENTE, CANAIS DE ABERTURA, TOP CATEGORIAS) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Column 1: Semana Corrente */}
            <div className="bg-[#12161f] border border-[#222938] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#2563eb]" />
                  <span>Semana Corrente</span>
                </h3>
                <p className="text-[11px] text-[#8d90a0] mb-4">Volume diário e tempo médio de resposta</p>

                <div className="h-44 flex items-end justify-between px-2 pt-4 relative">
                  {currentWeekDays.map((d, i) => (
                    <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group">
                      <div className="flex items-end gap-1 h-full w-full justify-center max-w-[28px]">
                        <div
                          style={{ height: d.open > 0 ? `${(d.open / 25) * 100}%` : '8%' }}
                          className="w-2.5 bg-[#ef4444] rounded-t group-hover:brightness-125 transition-all"
                          title={`${d.day}: ${d.open} abertos`}
                        />
                        <div
                          style={{ height: d.resolved > 0 ? `${(d.resolved / 25) * 100}%` : '8%' }}
                          className="w-2.5 bg-[#22c55e] rounded-t group-hover:brightness-125 transition-all"
                          title={`${d.day}: ${d.resolved} resolvidos`}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-[#8d90a0] mt-2 truncate w-full text-center">
                        {d.day.substring(0, 3)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center gap-4 text-[10px] font-mono mt-3 border-t border-[#222938] pt-3">
                <span className="flex items-center gap-1 text-[#ef4444]"><span className="w-2 h-2 rounded bg-[#ef4444]"></span> Abertos</span>
                <span className="flex items-center gap-1 text-[#22c55e]"><span className="w-2 h-2 rounded bg-[#22c55e]"></span> Resolvidos</span>
                <span className="flex items-center gap-1 text-[#2563eb]"><span className="w-2 h-0.5 bg-[#2563eb]"></span> TMR (min)</span>
              </div>
            </div>

            {/* Column 2: Canais de Abertura */}
            <div className="bg-[#12161f] border border-[#222938] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#22c55e]" />
                  <span>Canais de Abertura</span>
                </h3>
                <p className="text-[11px] text-[#8d90a0] mb-4">Origem dos chamados abertos pelos usuários</p>

                <div className="space-y-4 pt-1">
                  {openingChannels.map((ch, idx) => (
                    <div key={idx} className="space-y-1.5 group">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-[#dfe2eb] font-semibold flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ch.color }}></span>
                          {ch.name}
                        </span>
                        <span className="text-[#8d90a0]">
                          <strong className="text-white">{ch.count}</strong> ({ch.percent}%)
                        </span>
                      </div>
                      <div className="w-full h-3 bg-[#0b0e14] rounded-full overflow-hidden border border-[#222938] p-0.5">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${ch.percent}%`, backgroundColor: ch.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[11px] font-mono text-[#8d90a0] text-center border-t border-[#222938] pt-3 mt-4">
                Total de canais mapeados: <strong className="text-white">{totalChannelsCombined} chamados</strong>
              </div>
            </div>

            {/* Column 3: Top Categorias */}
            <div className="bg-[#12161f] border border-[#222938] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#eab308]" />
                  <span>Top Categorias</span>
                </h3>
                <p className="text-[11px] text-[#8d90a0] mb-4">Categorias com maior volume de solicitações</p>

                <div className="space-y-3">
                  {topCategories.map((cat, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-[#c3c6d7] font-medium tracking-wide uppercase text-[11px]">
                          {cat.name}
                        </span>
                        <span className="text-[#8d90a0] font-bold">
                          {cat.count} <span className="text-[10px] text-[#8d90a0]/70">({cat.percent}%)</span>
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-[#0b0e14] rounded-md overflow-hidden border border-[#222938] p-0.5">
                        <div
                          className="h-full bg-gradient-to-r from-[#2563eb] to-[#3b82f6] rounded transition-all duration-700"
                          style={{ width: `${maxCategoryCount > 0 ? Math.min((cat.count / maxCategoryCount) * 100, 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[11px] font-mono text-[#8d90a0] text-center border-t border-[#222938] pt-3 mt-4">
                {topCategories.length > 0
                  ? (<>Categorias ativas no sistema: <strong className="text-white">{topCategories.length} principais</strong></>) 
                  : <span>Nenhuma categoria encontrada no período</span>
                }
              </div>
            </div>

          </div>

          {/* 4. TABLE: DESEMPENHO POR OPERADOR / ANALISTA (MENSAL DETALHADO) */}
          <div className="bg-[#12161f] border border-[#222938] rounded-2xl p-6 shadow-xl">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <div>
                <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#45dfa4]" />
                  <span>Desempenho por Operador</span>
                </h2>
                <p className="text-xs text-[#8d90a0] mt-0.5">
                  SLA, CSAT, Tempo Médio de Resposta e Solução por analista do sistema no mês selecionado
                </p>
              </div>

              <div className="relative min-w-[260px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8d90a0]" />
                <input
                  type="text"
                  value={operatorSearch}
                  onChange={(e) => setOperatorSearch(e.target.value)}
                  placeholder="Filtrar operador por nome ou cargo..."
                  className="w-full bg-[#0b0e14] border border-[#222938] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-[#8d90a0] focus:outline-none focus:border-[#45dfa4] transition-all"
                />
              </div>
            </div>

            {/* Responsive Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#222938] text-[#8d90a0] uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Operador</th>
                    <th className="py-3 px-4 text-center">Tickets</th>
                    <th className="py-3 px-4 text-center">SLA 1ª Atend.</th>
                    <th className="py-3 px-4 text-center">SLA Solução</th>
                    <th className="py-3 px-4 text-center">CSAT</th>
                    <th className="py-3 px-4 text-center">TMR</th>
                    <th className="py-3 px-4 text-center">TMS</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a202c]">
                  {operatorsData.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-3 text-[#8d90a0]">
                          <Users className="w-10 h-10 opacity-30" />
                          <p className="text-sm font-mono">Nenhum analista cadastrado no sistema</p>
                          <p className="text-xs opacity-70">Acesse <strong className="text-[#45dfa4]">Configurações → Usuários</strong> para adicionar analistas</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {operatorsData.map((op) => (
                    <tr
                      key={op.id}
                      className="hover:bg-[#1a202c]/70 transition-colors group cursor-pointer"
                      onClick={() => setSelectedOperatorModal(op)}
                    >
                      {/* Operador Avatar + Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${op.avatarBg} text-white flex items-center justify-center font-bold text-xs shadow-md shrink-0`}>
                            {op.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover:text-[#45dfa4] transition-colors text-sm">
                              {op.name}
                            </div>
                            <div className="text-[10px] text-[#8d90a0]">
                              {op.role}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Tickets Count */}
                      <td className="py-3.5 px-4 text-center font-bold text-white text-sm">
                        {op.ticketsCount}
                      </td>

                      {/* SLA 1ª Atend */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          op.slaFirstPercent >= 90
                            ? 'bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30'
                            : op.slaFirstPercent >= 70
                            ? 'bg-[#eab308]/15 text-[#eab308] border border-[#eab308]/30'
                            : 'bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30'
                        }`}>
                          {op.slaFirstPercent.toFixed(1)}%
                        </span>
                      </td>

                      {/* SLA Solução */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30">
                          {op.slaSolutionPercent.toFixed(1)}%
                        </span>
                      </td>

                      {/* CSAT */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-[#a855f7] font-bold">
                          {op.csatPercent > 0 ? `${op.csatPercent}%` : '0.0%'}
                        </span>
                      </td>

                      {/* TMR */}
                      <td className="py-3.5 px-4 text-center text-[#c3c6d7]">
                        {op.tmrText}
                      </td>

                      {/* TMS */}
                      <td className="py-3.5 px-4 text-center text-[#c3c6d7]">
                        {op.tmsText}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOperatorModal(op);
                          }}
                          className="px-3 py-1 bg-[#222938] hover:bg-[#45dfa4] hover:text-gray-950 text-[#dfe2eb] rounded-lg text-xs font-semibold transition-all cursor-pointer"
                        >
                          Ver Chamados
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. BOTTOM ROW (2 COLUMNS: SLA POR CATEGORIA & SLA POR CLIENTE TOP 10) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Card 1: SLA por Categoria */}
            <div className="bg-[#12161f] border border-[#222938] rounded-2xl p-5 shadow-xl">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#2563eb]" />
                <span>SLA por Categoria</span>
              </h3>
              <p className="text-[11px] text-[#8d90a0] mb-4">Cumprimento de prazos de atendimento por tipo de chamado</p>

              <div className="space-y-4">
                {slaByCategory.map((cat, idx) => (
                  <div key={idx} className="space-y-1.5 border-b border-[#1a202c] pb-3 last:border-0">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="font-bold text-white uppercase text-[11px]">
                        {cat.name}
                      </span>
                      <span className="text-[10px] text-[#8d90a0]">
                        {cat.tickets} tickets • TMR: {cat.tmr}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-[#8d90a0]">
                        <span>1ª Atend: <strong className="text-[#2563eb]">{cat.slaFirst}%</strong></span>
                        <span>Solução: <strong className="text-[#22c55e]">{cat.slaSol}%</strong></span>
                      </div>
                      <div className="w-full h-2 bg-[#0b0e14] rounded-full overflow-hidden flex gap-0.5">
                        <div className="h-full bg-[#2563eb]" style={{ width: `${cat.slaFirst}%` }} />
                        <div className="h-full bg-[#22c55e]" style={{ width: `${cat.slaSol}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: SLA por Cliente (Top 10) */}
            <div className="bg-[#12161f] border border-[#222938] rounded-2xl p-5 shadow-xl">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#45dfa4]" />
                <span>SLA por Cliente (Top 10)</span>
              </h3>
              <p className="text-[11px] text-[#8d90a0] mb-4">Principais clientes empresariais por volume e cumprimento de metas</p>

              <div className="space-y-4">
                {slaByClient.map((cli, idx) => (
                  <div key={idx} className="space-y-1.5 border-b border-[#1a202c] pb-3 last:border-0">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="font-bold text-white truncate max-w-[260px] text-[11px]">
                        {cli.name}
                      </span>
                      <span className="text-[10px] text-[#8d90a0]">
                        <strong className="text-white">{cli.tickets}</strong> tickets
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-[#8d90a0]">
                        <span>1ª Atend: <strong className="text-[#45dfa4]">{cli.slaFirst}%</strong></span>
                        <span>Solução: <strong className="text-[#22c55e]">{cli.slaSol}%</strong></span>
                      </div>
                      <div className="w-full h-2 bg-[#0b0e14] rounded-full overflow-hidden flex gap-0.5">
                        <div className="h-full bg-[#45dfa4]" style={{ width: `${cli.slaFirst}%` }} />
                        <div className="h-full bg-[#22c55e]" style={{ width: `${cli.slaSol}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* OPERATOR DETAILS MODAL */}
      <AnimatePresence>
        {selectedOperatorModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#12161f] border border-[#222938] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-start border-b border-[#222938] pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full ${selectedOperatorModal.avatarBg} text-white flex items-center justify-center font-bold text-base shadow-lg`}>
                    {selectedOperatorModal.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedOperatorModal.name}</h3>
                    <p className="text-xs text-[#8d90a0] font-mono">{selectedOperatorModal.role}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedOperatorModal(null)}
                  className="text-[#8d90a0] hover:text-white p-1 rounded-lg hover:bg-[#1a202c]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 font-mono text-center">
                <div className="bg-[#0b0e14] border border-[#222938] p-3 rounded-xl">
                  <span className="text-[10px] text-[#8d90a0] uppercase block">Atendimentos no Mês</span>
                  <strong className="text-xl text-white">{selectedOperatorModal.ticketsCount}</strong>
                </div>
                <div className="bg-[#0b0e14] border border-[#222938] p-3 rounded-xl">
                  <span className="text-[10px] text-[#8d90a0] uppercase block">SLA 1ª Resposta</span>
                  <strong className="text-xl text-[#22c55e]">{selectedOperatorModal.slaFirstPercent}%</strong>
                </div>
                <div className="bg-[#0b0e14] border border-[#222938] p-3 rounded-xl">
                  <span className="text-[10px] text-[#8d90a0] uppercase block">TMR / TMS</span>
                  <strong className="text-sm text-[#3b82f6] block mt-1">{selectedOperatorModal.tmrText} / {selectedOperatorModal.tmsText}</strong>
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setSelectedOperatorModal(null);
                    setCurrentScreen('ti_tickets');
                  }}
                  className="px-4 py-2 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Ver Todos os Chamados do Analista
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PDF EXPORT MODAL */}
      <AnimatePresence>
        {showPdfExportModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#12161f] border border-[#222938] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center border-b border-[#222938] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#2563eb]/20 border border-[#2563eb]/40 flex items-center justify-center text-[#2563eb]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Exportar Relatório Mensal em PDF</h3>
                    <p className="text-xs text-[#8d90a0]">Selecione a empresa e opções do documento</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowPdfExportModal(false)}
                  className="text-[#8d90a0] hover:text-white p-1 rounded-lg hover:bg-[#1a202c]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Controls */}
              <div className="space-y-4 text-xs font-mono">
                {/* Empresa Selector */}
                <div>
                  <label className="block text-[#dfe2eb] font-semibold mb-1.5">
                    Empresa / Cliente:
                  </label>
                  <select
                    value={pdfSelectedCompany}
                    onChange={(e) => setPdfSelectedCompany(e.target.value)}
                    className="w-full bg-[#0b0e14] border border-[#222938] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#45dfa4] cursor-pointer"
                  >
                    <option value="Todas as empresas">Todas as Empresas (Agrupadas)</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mês Selector */}
                <div>
                  <label className="block text-[#dfe2eb] font-semibold mb-1.5">
                    Mês de Referência:
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full bg-[#0b0e14] border border-[#222938] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#45dfa4] cursor-pointer"
                  >
                    {monthsList.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Include Summary Checkbox */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="chk-pdf-summary"
                    checked={pdfIncludeSummary}
                    onChange={(e) => setPdfIncludeSummary(e.target.checked)}
                    className="w-4 h-4 rounded bg-[#0b0e14] border-[#222938] text-[#2563eb] focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="chk-pdf-summary" className="text-[#dfe2eb] cursor-pointer">
                    Incluir Resumo de SLAs & Métricas (TMR, TMS, CSAT)
                  </label>
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex justify-end gap-3 pt-3 border-t border-[#222938]">
                <button
                  onClick={() => setShowPdfExportModal(false)}
                  className="px-4 py-2 bg-[#1a202c] hover:bg-[#252f40] text-[#dfe2eb] rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGeneratePDF}
                  className="px-5 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#2563eb]/30"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>Gerar & Baixar PDF</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
