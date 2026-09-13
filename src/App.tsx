import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { PortalLanding } from './components/PortalLanding';
import { ClientHome } from './components/ClientHome';
import { LoginScreen } from './components/LoginScreen';
import { NewTicketForm } from './components/NewTicketForm';
import { TIDashboard } from './components/TIDashboard';
import { ClientMyTickets } from './components/ClientMyTickets';
import { KnowledgeBase } from './components/KnowledgeBase';
import { SystemStatusView } from './components/SystemStatusView';
import {
  TITicketsView,
  TIQueueView,
  TIDomainsView,
  TIClientsView,
  TIMonitoringView
} from './components/TIViews';
import { TicketDetailModal } from './components/TicketDetailModal';
import { CalendarEventsView } from './components/CalendarEventsView';
import { TIConfigView } from './components/TIConfigView';
import { TILoginScreen } from './components/TILoginScreen';
import { TIAuditLogsView } from './components/TIAuditLogsView';
import { TINewTicketView } from './components/TINewTicketView';
import { TIVaultView } from './components/TIVaultView';
import { ProtectedTIRoute } from './components/ProtectedTIRoute';
import { AnimatePresence, motion } from 'motion/react';

import { AttendanceWhatsAppView } from './components/AttendanceWhatsAppView';
import { AttendanceChatView } from './components/AttendanceChatView';
import { AttendanceChatbotView } from './components/AttendanceChatbotView';
import { AttendanceQueuesView } from './components/AttendanceQueuesView';
import { AttendanceSettingsView } from './components/AttendanceSettingsView';
import { AttendanceContactsView } from './components/AttendanceContactsView';
import { AttendanceDashboardView } from './components/AttendanceDashboardView';

const ScreenRenderer: React.FC = () => {
  const { currentScreen } = useApp();

  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'portal_landing':
        return <PortalLanding key="portal_landing" />;
      case 'client_home':
        return <ClientHome key="client_home" />;
      case 'login':
        return <LoginScreen key="login" />;
      case 'ti_login':
        return <TILoginScreen key="ti_login" />;
      case 'new_ticket':
        return <NewTicketForm key="new_ticket" />;
      case 'ti_dashboard':
        return (
          <ProtectedTIRoute requiredModule="ti_dashboard">
            <TIDashboard key="ti_dashboard" />
          </ProtectedTIRoute>
        );
      case 'attendance_dashboard':
        return (
          <ProtectedTIRoute requiredModule="ti_dashboard">
            <AttendanceDashboardView key="attendance_dashboard" />
          </ProtectedTIRoute>
        );
      case 'attendance_chat':
        return (
          <ProtectedTIRoute requiredModule="ti_tickets">
            <AttendanceChatView key="attendance_chat" />
          </ProtectedTIRoute>
        );
      case 'attendance_whatsapp':
        return (
          <ProtectedTIRoute requiredModule="ti_config">
            <AttendanceWhatsAppView key="attendance_whatsapp" />
          </ProtectedTIRoute>
        );
      case 'attendance_chatbot':
        return (
          <ProtectedTIRoute requiredModule="ti_config">
            <AttendanceChatbotView key="attendance_chatbot" />
          </ProtectedTIRoute>
        );
      case 'attendance_queue':
      case 'attendance_queues_config':
        return (
          <ProtectedTIRoute requiredModule="ti_queue">
            <AttendanceQueuesView key="attendance_queue" />
          </ProtectedTIRoute>
        );
      case 'attendance_settings':
        return (
          <ProtectedTIRoute requiredModule="ti_config">
            <AttendanceSettingsView key="attendance_settings" />
          </ProtectedTIRoute>
        );
      case 'attendance_contacts':
        return (
          <ProtectedTIRoute requiredModule="ti_clients">
            <AttendanceContactsView key="attendance_contacts" />
          </ProtectedTIRoute>
        );
      case 'client_my_tickets':
        return <ClientMyTickets key="client_my_tickets" />;
      case 'knowledge_base':
        return (
          <ProtectedTIRoute requiredModule="knowledge_base">
            <KnowledgeBase key="knowledge_base" />
          </ProtectedTIRoute>
        );
      case 'system_status':
        return <SystemStatusView key="system_status" />;
      case 'ti_tickets':
      case 'attendance_tickets':
        return (
          <ProtectedTIRoute requiredModule="ti_tickets">
            <TITicketsView key="ti_tickets" />
          </ProtectedTIRoute>
        );
      case 'ti_queue':
        return (
          <ProtectedTIRoute requiredModule="ti_queue">
            <TIQueueView key="ti_queue" />
          </ProtectedTIRoute>
        );
      case 'ti_domains':
      case 'ti_emails':
        return (
          <ProtectedTIRoute requiredModule="ti_domains">
            <TIDomainsView key="ti_domains" />
          </ProtectedTIRoute>
        );
      case 'ti_clients':
        return (
          <ProtectedTIRoute requiredModule="ti_clients">
            <TIClientsView key="ti_clients" />
          </ProtectedTIRoute>
        );
      case 'ti_hosting':
      case 'ti_monitoring':
        return (
          <ProtectedTIRoute requiredModule="ti_monitoring">
            <TIMonitoringView key="ti_monitoring" />
          </ProtectedTIRoute>
        );
      case 'ti_config':
        return (
          <ProtectedTIRoute requiredModule="ti_config">
            <TIConfigView key="ti_config" />
          </ProtectedTIRoute>
        );
      case 'ti_calendar':
        return (
          <ProtectedTIRoute requiredModule="ti_calendar">
            <CalendarEventsView key="ti_calendar" />
          </ProtectedTIRoute>
        );
      case 'ti_audit_logs':
        return (
          <ProtectedTIRoute requiredModule="ti_audit_logs">
            <TIAuditLogsView key="ti_audit_logs" />
          </ProtectedTIRoute>
        );
      case 'ti_new_ticket':
        return (
          <ProtectedTIRoute requiredModule="ti_new_ticket">
            <TINewTicketView key="ti_new_ticket" />
          </ProtectedTIRoute>
        );
      case 'ti_vault':
        return (
          <ProtectedTIRoute requiredModule="ti_vault">
            <TIVaultView key="ti_vault" />
          </ProtectedTIRoute>
        );
      default:
        return <PortalLanding key="default_landing" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#1e1e24] text-[#dfe2eb] font-sans antialiased">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {renderActiveScreen()}
        </motion.div>
      </AnimatePresence>

      {/* Global Ticket Modal for inspecting/updating any ticket */}
      <TicketDetailModal />
    </div>
  );
};

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error?.message || 'Erro inesperado de renderização.' };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou uma exceção:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#141416] text-[#dfe2eb] flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-2xl">
            ⚠️
          </div>
          <h2 className="text-lg font-bold text-white">Falha Temporária de Renderização</h2>
          <p className="text-xs text-[#8d90a0] max-w-md font-mono bg-[#1e1e24] p-3 rounded-xl border border-[#27272a]">
            {this.state.errorMessage}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                this.setState({ hasError: false, errorMessage: '' });
                window.location.reload();
              }}
              className="px-4 py-2 bg-[#45dfa4] text-gray-950 font-bold rounded-xl text-xs hover:bg-[#00bd85] transition-all cursor-pointer shadow-lg shadow-[#45dfa4]/20"
            >
              Recarregar Página
            </button>
            <button
              onClick={() => {
                try {
                  localStorage.removeItem('godesc_business_hours');
                } catch (e) {}
                window.location.reload();
              }}
              className="px-4 py-2 bg-[#27272a] hover:bg-[#323238] text-white rounded-xl text-xs transition-all cursor-pointer"
            >
              Resetar Horários & Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <ScreenRenderer />
      </AppProvider>
    </ErrorBoundary>
  );
}
