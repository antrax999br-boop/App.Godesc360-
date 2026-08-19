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

export default function App() {
  return (
    <AppProvider>
      <ScreenRenderer />
    </AppProvider>
  );
}
