import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { INITIAL_CLIENTS, INITIAL_DOMAINS } from '../data/mockData';
import { Ticket, TicketPriority, TicketStatus } from '../types';
import { getOperatorsForQueue } from '../utils/queueUtils';
import {
  Search,
  Plus,
  ArrowLeft,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Layers,
  Globe,
  Users,
  Server,
  Activity,
  HardDrive,
  Cpu,
  Radio,
  ChevronRight,
  Trash2,
  Edit2,
  Play,
  Pause,
  FileText,
  UserCheck,
  Check,
  Eye,
  RotateCcw,
  Flag,
  X
} from 'lucide-react';

export const TITicketsView: React.FC = () => {
  const {
    tickets,
    setSelectedTicket,
    updateTicketStatus,
    reassignTicket,
    deleteTicket,
    setCurrentScreen,
    triggerSystemNotification,
    managedUsers,
    companies
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedQueue, setSelectedQueue] = useState<string>('Todas');
  const [selectedStatus, setSelectedStatus] = useState<string>('Abertos');
  const [selectedPriority, setSelectedPriority] = useState<string>('Todos');
  const [selectedClient, setSelectedClient] = useState<string>('Todos');
  const [selectedOperator, setSelectedOperator] = useState<string>('Todos');

  // Play Button & Ticket Lifecycle Modals
  const [startConfirmTicket, setStartConfirmTicket] = useState<Ticket | null>(null);
  const [activeManageTicket, setActiveManageTicket] = useState<Ticket | null>(null);
  const [pauseTicketModal, setPauseTicketModal] = useState<Ticket | null>(null);
  const [pauseReason, setPauseReason] = useState<string>('');
  const [finalizingTicket, setFinalizingTicket] = useState<Ticket | null>(null);
  const [finalMessage, setFinalMessage] = useState<string>('');

  const filteredTickets = tickets.filter((t) => {
    const matchSearch =
      !search.trim() ||
      t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.requesterName.toLowerCase().includes(search.toLowerCase()) ||
      t.company.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      selectedStatus === 'Todos'
        ? true
        : selectedStatus === 'Abertos'
        ? t.status !== 'Resolvido' && t.status !== 'Fechado'
        : t.status === selectedStatus;

    const matchPriority = selectedPriority === 'Todos' || t.priority === selectedPriority;

    const matchQueue =
      selectedQueue === 'Todas'
        ? true
        : selectedQueue === 'Geral'
        ? !t.queue || t.queue === 'N1'
        : (t.queue || 'N1') === selectedQueue;

    const matchClient =
      selectedClient === 'Todos' || t.company.toLowerCase() === selectedClient.toLowerCase();

    const matchOperator =
      selectedOperator === 'Todos'
        ? true
        : selectedOperator === 'Unassigned'
        ? !t.assignedTo || t.assignedTo === ''
        : t.assignedTo === selectedOperator;

    return matchSearch && matchStatus && matchPriority && matchQueue && matchClient && matchOperator;
  });

  const handleClearFilters = () => {
    setSearch('');
    setSelectedQueue('Todas');
    setSelectedStatus('Abertos');
    setSelectedPriority('Todos');
    setSelectedClient('Todos');
    setSelectedOperator('Todos');
  };

  const handlePlayClick = (e: React.MouseEvent, ticket: Ticket) => {
    e.stopPropagation();
    if (ticket.status === 'Em Atendimento') {
      setActiveManageTicket(ticket);
    } else {
      setStartConfirmTicket(ticket);
    }
  };

  const handleConfirmStart = () => {
    if (!startConfirmTicket) return;
    const ticket = startConfirmTicket;
    updateTicketStatus(
      ticket.id,
      'Em Atendimento',
      'Atendimento aceito e iniciado pelo analista de T.I.'
    );
    triggerSystemNotification(
      `Ticket ${ticket.ticketNumber} Aceito`,
      `Atendimento iniciado pelo analista de T.I.`,
      ticket.company || 'Atendimento TI',
      'Média'
    );
    setStartConfirmTicket(null);
  };

  const handleConfirmPause = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pauseTicketModal || !pauseReason.trim()) return;

    const reasonText = pauseReason.trim();
    const ticketNumber = pauseTicketModal.ticketNumber;

    updateTicketStatus(
      pauseTicketModal.id,
      'Pendente',
      `[Chamado Pausado] Motivo: ${reasonText}`
    );

    triggerSystemNotification(
      `Chamado ${ticketNumber} Pausado`,
      `Motivo do pausamento registrado para o cliente.`,
      pauseTicketModal.company || 'Atendimento TI',
      'Baixa'
    );

    setPauseTicketModal(null);
    setPauseReason('');
  };

  const handleConfirmFinalization = (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalizingTicket || !finalMessage.trim()) return;

    const messageText = finalMessage.trim();
    const ticketNumber = finalizingTicket.ticketNumber;

    updateTicketStatus(
      finalizingTicket.id,
      'Resolvido',
      `[Chamado Finalizado] Solução: ${messageText}`
    );

    triggerSystemNotification(
      `Chamado ${ticketNumber} Finalizado`,
      `Mensagem de conclusão/solução enviada ao cliente.`,
      finalizingTicket.company || 'Atendimento TI',
      'Baixa'
    );

    setFinalizingTicket(null);
    setFinalMessage('');
  };

  const handleDelete = (e: React.MouseEvent, ticket: Ticket) => {
    e.stopPropagation();
    if (window.confirm(`Tem certeza que deseja excluir o ticket ${ticket.ticketNumber}?`)) {
      deleteTicket(ticket.id);
      triggerSystemNotification(
        `Ticket Excluído`,
        `Ticket ${ticket.ticketNumber} removido do sistema.`,
        ticket.company,
        'Baixa'
      );
    }
  };

  const getTicketCode = (t: Ticket) => {
    if (t.ticketNumber && t.ticketNumber.length > 5 && !t.ticketNumber.startsWith('#00')) {
      return t.ticketNumber;
    }
    const num = t.ticketNumber.replace('#', '');
    return `#${num.padStart(6, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#1e1e24] text-[#dfe2eb] flex flex-col font-sans selection:bg-[#45dfa4]/30 selection:text-[#45dfa4]">
      {/* Top Header */}
      <header className="bg-[#18181b] border-b border-[#27272a] px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentScreen('ti_dashboard')}
            className="text-xs font-mono text-[#c3c6d7] hover:text-[#45dfa4] flex items-center gap-1.5 transition-all cursor-pointer bg-[#18181b] px-3 py-1.5 rounded-lg border border-[#45dfa4]/50 hover:border-[#45dfa4] shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-[#45dfa4]" />
            <span>Voltar ao Dashboard</span>
          </button>
          <span className="text-[#434655]">|</span>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Tickets</h1>
            <p className="text-xs text-[#8d90a0]">Gerencie todos os tickets do sistema</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentScreen('ti_new_ticket')}
            className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Novo Ticket</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 md:p-8 space-y-5 max-w-[1700px] mx-auto w-full">
        {/* Filters Toolbar matching Screenshot */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-4 shadow-xl flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative min-w-[240px] flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8d90a0]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por assunto, solicitante ou ID..."
              className="w-full bg-[#1e1e24] border border-[#27272a] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-[#8d90a0] focus:outline-none focus:border-[#45dfa4] transition-all"
            />
          </div>

          {/* Fila Filter Dropdown */}
          <select
            value={selectedQueue}
            onChange={(e) => setSelectedQueue(e.target.value)}
            className="bg-[#18181b] border border-[#27272a] text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#45dfa4] cursor-pointer"
          >
            <option value="Todas">Todas as Filas</option>
            <option value="N1">Fila N1 (Triagem &amp; Nível 1)</option>
            <option value="N2">Fila N2 (Nível 2)</option>
            <option value="N3">Fila N3 (Nível 3 / Infra)</option>
            <option value="ADM">Fila ADM (Administração)</option>
            <option value="Geral">Fila Geral (Sem Fila)</option>
          </select>

          {/* Status Filter Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#18181b] border border-[#27272a] text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#45dfa4] cursor-pointer"
          >
            <option value="Abertos">Abertos</option>
            <option value="Todos">Todos os Status</option>
            <option value="Novo">Novo</option>
            <option value="Em Atendimento">Em Atendimento</option>
            <option value="Pendente">Pendente</option>
            <option value="Resolvido">Resolvido</option>
            <option value="Fechado">Fechado</option>
          </select>

          {/* Priority Filter Dropdown */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-[#18181b] border border-[#27272a] text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#45dfa4] cursor-pointer"
          >
            <option value="Todos">Todas as Prioridades</option>
            <option value="Crítica">Crítica</option>
            <option value="Alta">Alta</option>
            <option value="Média">Média</option>
            <option value="Baixa">Baixa</option>
          </select>

          {/* Cliente Filter Dropdown */}
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="bg-[#18181b] border border-[#27272a] text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#45dfa4] cursor-pointer min-w-[140px]"
          >
            <option value="Todos">Cliente</option>
            {companies.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Operador Filter Dropdown */}
          <select
            value={selectedOperator}
            onChange={(e) => setSelectedOperator(e.target.value)}
            className="bg-[#18181b] border border-[#27272a] text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#45dfa4] cursor-pointer min-w-[140px]"
          >
            <option value="Todos">Operador</option>
            <option value="Unassigned">Sem Operador (Fila Geral)</option>
            {managedUsers.map((u) => (
              <option key={u.id} value={u.name}>
                {u.name} ({u.role.toUpperCase()})
              </option>
            ))}
          </select>

          {/* Limpar Button */}
          <button
            onClick={handleClearFilters}
            className="px-4 py-2.5 bg-[#27272a] hover:bg-[#3f3f46] text-[#c3c6d7] hover:text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-[#3f3f46]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpar</span>
          </button>
        </div>

        {/* Tickets Table matching Screenshot */}
        <div className="bg-[#1e1e24] border border-[#27272a] rounded-2xl shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-[#18181b] border-b border-[#27272a] text-[11px] font-mono font-bold text-[#8d90a0] uppercase tracking-wider">
                  <th className="py-4 px-4">ID ⇅</th>
                  <th className="py-4 px-4">Título ⇅</th>
                  <th className="py-4 px-4">Cliente ⇅</th>
                  <th className="py-4 px-3 text-center">Status / Prio</th>
                  <th className="py-4 px-4">Departamento / Fila</th>
                  <th className="py-4 px-3">Mesa</th>
                  <th className="py-4 px-4">Operador</th>
                  <th className="py-4 px-3">Criado ⇣</th>
                  <th className="py-4 px-3">SLA Res</th>
                  <th className="py-4 px-3">SLA Sol</th>
                  <th className="py-4 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a] text-xs">
                {filteredTickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className="hover:bg-[#27272a]/50 transition-colors cursor-pointer group"
                  >
                    {/* ID Badge */}
                    <td className="py-3.5 px-4 font-mono font-bold text-[#45dfa4] whitespace-nowrap">
                      {getTicketCode(t)}
                    </td>

                    {/* Título */}
                    <td className="py-3.5 px-4 font-bold text-white group-hover:text-[#45dfa4] transition-colors max-w-xs truncate">
                      {t.title.toUpperCase()}
                    </td>

                    {/* Cliente */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white truncate max-w-[200px]">
                        {t.company || 'Empresa Geral'}
                      </div>
                      <div className="text-[10px] text-[#8d90a0] truncate max-w-[200px]">
                        {t.requesterName}
                      </div>
                    </td>

                    {/* Status & Priority Icons */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Clock Status Button Icon */}
                        <div
                          className={`p-1 rounded-md border ${
                            t.status === 'Novo'
                              ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                              : t.status === 'Em Atendimento'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : t.status === 'Pendente'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                              : 'bg-emerald-500/20 text-[#45dfa4] border-emerald-500/30'
                          }`}
                          title={`Status: ${t.status}`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                        </div>

                        {/* Priority Flag Icon */}
                        <div
                          className={`p-1 rounded-md border ${
                            t.priority === 'Crítica' || t.priority === 'Alta'
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : 'bg-emerald-500/20 text-[#45dfa4] border-emerald-500/30'
                          }`}
                          title={`Prioridade: ${t.priority}`}
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </td>

                    {/* Departamento / Fila Selector */}
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={t.queue || 'N1'}
                        onChange={(e) => {
                          const newQ = e.target.value as any;
                          const validOps = getOperatorsForQueue(managedUsers, newQ);
                          const isOpValid = validOps.some((u) => u.name === t.assignedTo);
                          reassignTicket(
                            t.id,
                            newQ,
                            isOpValid ? t.assignedTo : undefined
                          );
                        }}
                        className="bg-[#18181b] border border-[#27272a] focus:border-[#45dfa4] text-white text-[11px] rounded-lg px-2.5 py-1.5 w-full focus:outline-none cursor-pointer"
                      >
                        <option value="N1">Suporte Técnico / N1</option>
                        <option value="N2">Suporte N2 (Sistemas)</option>
                        <option value="N3">Infraestrutura N3</option>
                        <option value="ADM">Administração ADM</option>
                      </select>
                    </td>

                    {/* Mesa */}
                    <td className="py-3.5 px-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        defaultValue="geral"
                        className="bg-[#18181b] border border-[#27272a] text-[#8d90a0] text-[11px] rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer"
                      >
                        <option value="geral">Mesa de trabalho</option>
                      </select>
                    </td>

                    {/* Operador Selector */}
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={t.assignedTo || ''}
                        onChange={(e) => {
                          const newOp = e.target.value;
                          reassignTicket(
                            t.id,
                            t.queue || 'N1',
                            newOp || undefined
                          );
                        }}
                        className="bg-[#18181b] border border-[#27272a] focus:border-[#45dfa4] text-white text-[11px] rounded-lg px-2.5 py-1.5 w-full focus:outline-none cursor-pointer"
                      >
                        <option value="">Sem Operador (Fila Geral)</option>
                        {getOperatorsForQueue(managedUsers, t.queue || 'N1').map((u) => (
                          <option key={u.id} value={u.name}>
                            {u.name} ({u.role.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Criado */}
                    <td className="py-3.5 px-3 font-mono text-[11px] text-[#8d90a0] whitespace-nowrap">
                      {t.createdAt.includes('às') ? t.createdAt.split('às')[0].trim() : t.createdAt}
                    </td>

                    {/* SLA Res Progress Bar */}
                    <td className="py-3.5 px-3">
                      <div className="w-20 space-y-1">
                        <div className="h-1.5 w-full bg-[#1e2634] rounded-full overflow-hidden">
                          <div className="h-full bg-red-500 rounded-full w-full"></div>
                        </div>
                        <span className="text-[10px] font-mono text-[#8d90a0] block text-right">100%</span>
                      </div>
                    </td>

                    {/* SLA Sol Progress Bar */}
                    <td className="py-3.5 px-3">
                      <div className="w-20 space-y-1">
                        <div className="h-1.5 w-full bg-[#1e2634] rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full w-0"></div>
                        </div>
                        <span className="text-[10px] font-mono text-[#8d90a0] block text-right">0%</span>
                      </div>
                    </td>

                    {/* Ações */}
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1.5">
                        {t.status === 'Concluído' ? (
                          <div
                            className="p-1.5 rounded-lg bg-emerald-500/20 text-[#45dfa4] border border-emerald-500/40 flex items-center justify-center cursor-default"
                            title="Chamado Finalizado / Concluído"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        ) : t.status === 'Pendente' ? (
                          <button
                            onClick={(e) => handlePlayClick(e, t)}
                            className="p-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 border border-purple-500/40 flex items-center justify-center transition-colors cursor-pointer"
                            title="Chamado Pausado - Clique para Retomar ou Gerenciar"
                          >
                            <Pause className="w-3.5 h-3.5 fill-purple-300" />
                          </button>
                        ) : t.status === 'Em Atendimento' ? (
                          <button
                            onClick={(e) => handlePlayClick(e, t)}
                            className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-[#45dfa4] border border-emerald-500/40 flex items-center justify-center transition-colors cursor-pointer shadow-md shadow-emerald-500/10"
                            title="Chamado Em Atendimento - Clique para Pausar ou Finalizar"
                          >
                            <Play className="w-3.5 h-3.5 fill-[#45dfa4]" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => handlePlayClick(e, t)}
                            className="p-1.5 rounded-lg bg-[#2e3644] hover:bg-[#3d4758] text-[#8d90a0] border border-[#435069]/40 flex items-center justify-center transition-colors cursor-pointer"
                            title="Pendente para ser Iniciado - Clique para Aceitar / Iniciar"
                          >
                            <Play className="w-3.5 h-3.5 text-[#a0a5b8]" />
                          </button>
                        )}

                        {/* View Ticket Details Modal */}
                        <button
                          onClick={() => setSelectedTicket(t)}
                          className="p-1.5 rounded-lg bg-[#45dfa4]/20 hover:bg-[#45dfa4]/40 text-[#45dfa4] transition-colors cursor-pointer border border-[#45dfa4]/30"
                          title="Ver Detalhes do Ticket"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Ticket */}
                        <button
                          onClick={(e) => handleDelete(e, t)}
                          className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-colors cursor-pointer border border-red-500/30"
                          title="Excluir Ticket"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredTickets.length === 0 && (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-[#8d90a0]">
                      Nenhum ticket encontrado para os filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL 1: Confirmação de Aceite e Início de Atendimento */}
      {startConfirmTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Aceitar e Iniciar Atendimento</h3>
              </div>
              <button
                onClick={() => setStartConfirmTicket(null)}
                className="text-[#8d90a0] hover:text-white text-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-[#c3c6d7]">
                Você confirma o aceite e o início do atendimento para este chamado?
              </p>

              <div className="bg-[#141416] border border-[#27272a] p-3.5 rounded-xl space-y-1">
                <div className="text-xs font-mono font-bold text-[#45dfa4]">
                  {getTicketCode(startConfirmTicket)}
                </div>
                <div className="text-sm font-bold text-white">
                  {startConfirmTicket.title}
                </div>
                <div className="text-xs text-[#8d90a0]">
                  Solicitante: <strong className="text-white">{startConfirmTicket.requesterName}</strong> ({startConfirmTicket.company})
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex items-center gap-2.5 text-xs text-blue-300">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>O status será alterado para <strong>Em Atendimento</strong> com o botão de play verde ativo.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#27272a]">
              <button
                type="button"
                onClick={() => setStartConfirmTicket(null)}
                className="px-4 py-2 bg-[#27272a] hover:bg-[#3f3f46] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmStart}
                className="px-4 py-2 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Confirmar e Iniciar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Chamado em Atendimento (Opções de Pausar ou Finalizar) */}
      {activeManageTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#45dfa4]" />
                <h3 className="text-base font-bold text-white">Chamado em Atendimento</h3>
              </div>
              <button
                onClick={() => setActiveManageTicket(null)}
                className="text-[#8d90a0] hover:text-white text-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#141416] border border-[#27272a] p-3.5 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#45dfa4]">
                  {getTicketCode(activeManageTicket)}
                </span>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-[#45dfa4] border border-emerald-500/30">
                  ● EM ANDAMENTO
                </span>
              </div>
              <div className="text-sm font-bold text-white">{activeManageTicket.title}</div>
              <div className="text-xs text-[#8d90a0]">
                {activeManageTicket.company} • {activeManageTicket.requesterName}
              </div>
            </div>

            <p className="text-xs text-[#c3c6d7]">
              Selecione o procedimento que deseja realizar para este chamado:
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Option: Pausar Chamado */}
              <button
                type="button"
                onClick={() => {
                  const target = activeManageTicket;
                  setActiveManageTicket(null);
                  setPauseTicketModal(target);
                  setPauseReason('');
                }}
                className="p-4 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-500/60 rounded-xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
              >
                <Pause className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
                <div className="text-center">
                  <div className="text-xs font-bold text-purple-300">Pausar Chamado</div>
                  <div className="text-[10px] text-purple-400/80 mt-0.5">Informar motivo ao cliente</div>
                </div>
              </button>

              {/* Option: Finalizar Chamado */}
              <button
                type="button"
                onClick={() => {
                  const target = activeManageTicket;
                  setActiveManageTicket(null);
                  setFinalizingTicket(target);
                  setFinalMessage('');
                }}
                className="p-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/60 rounded-xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
              >
                <CheckCircle2 className="w-6 h-6 text-[#45dfa4] group-hover:scale-110 transition-transform" />
                <div className="text-center">
                  <div className="text-xs font-bold text-[#45dfa4]">Finalizar Chamado</div>
                  <div className="text-[10px] text-emerald-400/80 mt-0.5">Enviar solução ao cliente</div>
                </div>
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#27272a]">
              <button
                type="button"
                onClick={() => setActiveManageTicket(null)}
                className="px-4 py-2 bg-[#27272a] hover:bg-[#3f3f46] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Motivo do Pausamento */}
      {pauseTicketModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <div className="flex items-center gap-2">
                <Pause className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Pausar Chamado {getTicketCode(pauseTicketModal)}</h3>
              </div>
              <button
                onClick={() => setPauseTicketModal(null)}
                className="text-[#8d90a0] hover:text-white text-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#c3c6d7]">
              Descreva o <strong className="text-white">motivo do pausamento</strong>. Esta informação ficará gravada no histórico e será visível no ticket do cliente:
            </p>

            <form onSubmit={handleConfirmPause} className="space-y-4">
              <textarea
                required
                rows={4}
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                placeholder="Ex: Aguardando o envio das evidências de erro / logs pelo cliente para dar suporte."
                className="w-full bg-[#141416] border border-[#27272a] focus:border-purple-500 text-white text-xs rounded-xl p-3 focus:outline-none placeholder:text-[#8d90a0]"
              />

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setPauseTicketModal(null)}
                  className="px-4 py-2 bg-[#27272a] hover:bg-[#3f3f46] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!pauseReason.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shadow-lg shadow-purple-600/20"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Confirmar e Pausar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Finalização com Mensagem de Solução */}
      {finalizingTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#45dfa4]" />
                <h3 className="text-base font-bold text-white">Finalizar Chamado {getTicketCode(finalizingTicket)}</h3>
              </div>
              <button
                onClick={() => setFinalizingTicket(null)}
                className="text-[#8d90a0] hover:text-white text-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#c3c6d7]">
              Descreva o <strong className="text-white">procedimento realizado / solução</strong> para <strong className="text-white">{finalizingTicket.requesterName}</strong>:
            </p>

            <form onSubmit={handleConfirmFinalization} className="space-y-4">
              <textarea
                required
                rows={4}
                value={finalMessage}
                onChange={(e) => setFinalMessage(e.target.value)}
                placeholder="Ex: Atendimento concluído. O acesso ao sistema foi restabelecido e validado com o cliente."
                className="w-full bg-[#141416] border border-[#27272a] focus:border-[#45dfa4] text-white text-xs rounded-xl p-3 focus:outline-none placeholder:text-[#8d90a0]"
              />

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setFinalizingTicket(null)}
                  className="px-4 py-2 bg-[#27272a] hover:bg-[#3f3f46] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!finalMessage.trim()}
                  className="px-4 py-2 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-xs rounded-xl transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirmar e Finalizar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export interface PersonalTask {
  id: string;
  title: string;
  description: string;
  priority: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  status: 'Novo' | 'Em Atendimento' | 'Pendente' | 'Resolvido';
  createdAt: string;
  updatedAt: string;
}

export const TIQueueView: React.FC = () => {
  const { userSession, managedUsers, setCurrentScreen } = useApp();
  const loggedUserKey = userSession.username || 't.i';

  // Privileged roles permission check: CEO, Gestor, Admin, T.I or explicit permission
  const canViewAllKanbans = 
    userSession.role === 'ceo' || 
    userSession.role === 'gestor' || 
    userSession.role === 'admin' || 
    loggedUserKey === 't.i' || 
    Boolean(userSession.permissions?.canViewAllKanbans);

  // Active user Kanban key being viewed
  const [activeUserKey, setActiveUserKey] = useState<string>(loggedUserKey);

  // Synchronize activeUserKey if loggedUserKey changes and user cannot view all
  useEffect(() => {
    if (!canViewAllKanbans) {
      setActiveUserKey(loggedUserKey);
    }
  }, [loggedUserKey, canViewAllKanbans]);

  // Load tasks for activeUserKey
  const [tasks, setTasks] = useState<PersonalTask[]>(() => {
    const saved = localStorage.getItem(`godesc_kanban_tasks_${activeUserKey}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) { /* ignore */ }
    }
    return [
      {
        id: 'task-1',
        title: 'Verificar relatórios diários de backup',
        description: 'Conferir integridade das imagens do servidor de arquivos e Veeam.',
        priority: 'Média',
        status: 'Novo',
        createdAt: 'Hoje às 08:30',
        updatedAt: 'Hoje às 08:30'
      },
      {
        id: 'task-2',
        title: 'Atualizar firmware dos roteadores da filial',
        description: 'Andamento: Realizado backup das configurações. Aguardando janela de manutenção.',
        priority: 'Alta',
        status: 'Em Atendimento',
        createdAt: 'Hoje às 09:15',
        updatedAt: 'Hoje às 09:45'
      }
    ];
  });

  // Reload tasks whenever activeUserKey changes
  useEffect(() => {
    const saved = localStorage.getItem(`godesc_kanban_tasks_${activeUserKey}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setTasks(parsed);
          return;
        }
      } catch (e) { /* ignore */ }
    }
    // Default initial state if empty
    setTasks([
      {
        id: `task-init-${Date.now()}`,
        title: `Primeira tarefa de @${activeUserKey}`,
        description: `Quadro Kanban pessoal individual para @${activeUserKey}.`,
        priority: 'Média',
        status: 'Novo',
        createdAt: 'Hoje às ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        updatedAt: 'Hoje às ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [activeUserKey]);

  // Persist tasks in localStorage for activeUserKey
  useEffect(() => {
    localStorage.setItem(`godesc_kanban_tasks_${activeUserKey}`, JSON.stringify(tasks));
  }, [tasks, activeUserKey]);

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<PersonalTask['status'] | null>(null);

  // New Personal Task Modal State
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<PersonalTask['priority']>('Média');

  // Edit / Progress Note Modal State
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<PersonalTask['priority']>('Média');
  const [editStatus, setEditStatus] = useState<PersonalTask['status']>('Novo');

  const columns: { title: PersonalTask['status']; label: string; color: string; badgeBg: string }[] = [
    { title: 'Novo', label: 'NOVO', color: 'border-blue-500/40 text-blue-400', badgeBg: 'bg-blue-500/20 text-blue-300' },
    { title: 'Em Atendimento', label: 'EM ATENDIMENTO / ANDAMENTO', color: 'border-amber-500/40 text-amber-400', badgeBg: 'bg-amber-500/20 text-amber-300' },
    { title: 'Pendente', label: 'PENDENTE', color: 'border-purple-500/40 text-purple-400', badgeBg: 'bg-purple-500/20 text-purple-300' },
    { title: 'Resolvido', label: 'CONCLUÍDO', color: 'border-green-500/40 text-[#45dfa4]', badgeBg: 'bg-emerald-500/20 text-emerald-300' }
  ];

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const nowFormatted = 'Hoje às ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newTask: PersonalTask = {
      id: `task-${Date.now()}`,
      title: newTitle.trim(),
      description: newDescription.trim(),
      priority: newPriority,
      status: 'Novo',
      createdAt: nowFormatted,
      updatedAt: nowFormatted
    };

    setTasks(prev => [newTask, ...prev]);
    setNewTitle('');
    setNewDescription('');
    setNewPriority('Média');
    setShowNewTaskModal(false);
  };

  const handleSaveEditTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTitle.trim()) return;

    const nowFormatted = 'Hoje às ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setTasks(prev =>
      prev.map(t =>
        t.id === editingTask.id
          ? {
              ...t,
              title: editTitle.trim(),
              description: editDescription.trim(),
              priority: editPriority,
              status: editStatus,
              updatedAt: nowFormatted
            }
          : t
      )
    );

    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (editingTask?.id === taskId) setEditingTask(null);
  };

  const handleTaskMove = (taskId: string, targetStatus: PersonalTask['status']) => {
    const nowFormatted = 'Hoje às ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: targetStatus, updatedAt: nowFormatted } : t))
    );
  };

  // Drag & Drop
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, colStatus: PersonalTask['status']) => {
    e.preventDefault();
    if (dragOverColumn !== colStatus) {
      setDragOverColumn(colStatus);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: PersonalTask['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDragOverColumn(null);
    setDraggedTaskId(null);

    if (taskId) {
      handleTaskMove(taskId, targetStatus);
    }
  };

  const handleOpenEditModal = (task: PersonalTask) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditPriority(task.priority);
    setEditStatus(task.status);
  };

  const activeUserObject = (managedUsers || []).find(u => u.username.toLowerCase() === activeUserKey.toLowerCase());
  const activeDisplayName = activeUserObject ? `${activeUserObject.name} (@${activeUserObject.username})` : `@${activeUserKey}`;

  return (
    <div className="min-h-screen bg-[#1e1e24] text-[#dfe2eb] flex flex-col font-sans selection:bg-[#45dfa4]/30 selection:text-[#45dfa4]">
      <header className="bg-[#18181b] border-b border-[#27272a] px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentScreen('ti_dashboard')}
            className="text-xs font-mono text-[#c3c6d7] hover:text-[#45dfa4] flex items-center gap-1.5 transition-all cursor-pointer bg-[#27272a] px-3 py-1.5 rounded-lg border border-[#45dfa4]/50 hover:border-[#45dfa4] shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-[#45dfa4]" />
            <span>Voltar ao Dashboard</span>
          </button>
          <span className="text-[#434655]">|</span>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#45dfa4]" />
              <span>Kanban de Tarefas • {activeDisplayName}</span>
            </h1>
          </div>
        </div>

        <button
          onClick={() => setShowNewTaskModal(true)}
          className="px-3.5 py-1.5 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nova Tarefa ({activeUserKey})</span>
        </button>
      </header>

      {/* Info & User Selector Banner */}
      <div className="bg-[#141416] border-b border-[#27272a] px-6 py-3 text-xs text-[#c3c6d7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-[#45dfa4] shrink-0" />
          <span>
            Exibindo Kanban Pessoal de: <strong className="text-white">{activeDisplayName}</strong>
          </span>
        </div>

        {/* User Selection Dropdown for CEO / Gestor / TI */}
        {canViewAllKanbans ? (
          <div className="flex items-center gap-2 bg-[#18181b] px-3 py-1.5 rounded-lg border border-[#27272a]">
            <span className="text-[11px] font-semibold text-[#8d90a0]">Visualizar Quadro do Usuário:</span>
            <select
              value={activeUserKey}
              onChange={(e) => setActiveUserKey(e.target.value)}
              className="bg-[#18181b] border border-[#27272a] text-white text-xs font-mono rounded px-2 py-1 focus:outline-none focus:border-[#45dfa4]"
            >
              {(managedUsers || []).map((u) => (
                <option key={u.id} value={u.username}>
                  {u.name} (@{u.username}) [{u.role.toUpperCase()}]
                </option>
              ))}
            </select>
          </div>
        ) : (
          <span className="text-[10px] font-mono text-[#45dfa4] bg-[#45dfa4]/10 px-2.5 py-1 rounded border border-[#45dfa4]/30">
            🔒 Quadro Isolado e Exclusivo do seu Usuário (@{loggedUserKey})
          </span>
        )}
      </div>

      <main className="flex-1 p-4 sm:p-6 overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-w-[900px] h-full items-start">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.title);
            const isOver = dragOverColumn === col.title;

            return (
              <div
                key={col.title}
                onDragOver={(e) => handleDragOver(e, col.title)}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={(e) => handleDrop(e, col.title)}
                className={`bg-[#18181b] border rounded-2xl p-4 flex flex-col min-h-[550px] transition-all duration-200 ${
                  isOver
                    ? 'border-[#45dfa4] bg-[#45dfa4]/5 shadow-xl shadow-[#45dfa4]/10 scale-[1.01]'
                    : 'border-[#27272a]'
                }`}
              >
                <div className={`flex items-center justify-between pb-3 border-b border-[#27272a] mb-3 ${col.color}`}>
                  <span className="font-bold text-xs uppercase tracking-wider">{col.label}</span>
                  <span className={`text-xs font-mono px-2.5 py-0.5 rounded-full font-bold ${col.badgeBg}`}>
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => handleOpenEditModal(task)}
                      className="bg-[#27272a]/50 border border-[#27272a] hover:border-[#45dfa4]/60 rounded-xl p-3.5 cursor-grab active:cursor-grabbing hover:bg-[#27272a] transition-all space-y-2.5 group shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                            task.priority === 'Crítica' || task.priority === 'Alta'
                              ? 'bg-[#93000a]/40 text-[#ffb4ab]'
                              : 'bg-[#45dfa4]/20 text-[#45dfa4]'
                          }`}
                        >
                          {task.priority}
                        </span>

                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(task);
                            }}
                            className="p-1 hover:text-[#45dfa4] text-[#8d90a0] cursor-pointer"
                            title="Editar / Adicionar Andamento"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id);
                            }}
                            className="p-1 hover:text-red-400 text-[#8d90a0] cursor-pointer"
                            title="Excluir Tarefa"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-white group-hover:text-[#45dfa4] transition-colors leading-snug">
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className="text-[11px] text-[#c3c6d7] line-clamp-3 bg-[#141416] p-2 rounded border border-[#27272a]">
                          {task.description}
                        </p>
                      )}

                      {/* Quick Move Buttons */}
                      <div className="pt-2 border-t border-[#27272a] flex items-center justify-between gap-1 text-[10px] font-mono">
                        <span className="text-[#8d90a0]">Mover:</span>
                        <div className="flex items-center gap-1">
                          {col.title !== 'Novo' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTaskMove(task.id, 'Novo');
                              }}
                              className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors cursor-pointer"
                            >
                              Novo
                            </button>
                          )}
                          {col.title !== 'Em Atendimento' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTaskMove(task.id, 'Em Atendimento');
                              }}
                              className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors cursor-pointer"
                            >
                              Andamento
                            </button>
                          )}
                          {col.title !== 'Pendente' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTaskMove(task.id, 'Pendente');
                              }}
                              className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors cursor-pointer"
                            >
                              Pendente
                            </button>
                          )}
                          {col.title !== 'Resolvido' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTaskMove(task.id, 'Resolvido');
                              }}
                              className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                            >
                              Concluir
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {colTasks.length === 0 && (
                    <div className="h-32 flex items-center justify-center text-xs text-[#8d90a0] italic border border-dashed border-[#27272a] rounded-xl">
                      Solte sua tarefa aqui
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Modal: Nova Tarefa Pessoal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h3 className="text-base font-bold text-white">Criar Tarefa Pessoal</h3>
              <button onClick={() => setShowNewTaskModal(false)} className="text-[#8d90a0] hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-white block mb-1">Título da Atividade</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Atualizar backup do servidor Protheus"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#141416] border border-[#27272a] focus:border-[#45dfa4] text-white text-xs rounded-xl p-3 focus:outline-none placeholder:text-[#8d90a0]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white block mb-1">Andamentos / Detalhes</label>
                <textarea
                  rows={3}
                  placeholder="Anote os detalhes do trabalho, observações ou próximos passos..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-[#141416] border border-[#27272a] focus:border-[#45dfa4] text-white text-xs rounded-xl p-3 focus:outline-none placeholder:text-[#8d90a0]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white block mb-1">Prioridade</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as PersonalTask['priority'])}
                  className="w-full bg-[#141416] border border-[#27272a] text-white text-xs rounded-xl p-3 focus:outline-none"
                >
                  <option value="Baixa">Baixa</option>
                  <option value="Média">Média</option>
                  <option value="Alta">Alta</option>
                  <option value="Crítica">Crítica</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2 bg-[#27272a] text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#45dfa4] text-gray-950 font-bold text-xs rounded-lg cursor-pointer"
                >
                  Adicionar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Tarefa / Adicionar Andamentos */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h3 className="text-base font-bold text-white">Editar / Atualizar Andamentos</h3>
              <button onClick={() => setEditingTask(null)} className="text-[#8d90a0] hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditTask} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-white block mb-1">Título da Atividade</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#141416] border border-[#27272a] focus:border-[#45dfa4] text-white text-xs rounded-xl p-3 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white block mb-1">Andamentos e Notas de Progresso</label>
                <textarea
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Escreva aqui os andamentos do trabalho..."
                  className="w-full bg-[#141416] border border-[#27272a] focus:border-[#45dfa4] text-white text-xs rounded-xl p-3 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-white block mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as PersonalTask['status'])}
                    className="w-full bg-[#141416] border border-[#27272a] text-white text-xs rounded-xl p-3 focus:outline-none"
                  >
                    <option value="Novo">Novo</option>
                    <option value="Em Atendimento">Em Atendimento</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Resolvido">Concluído</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-white block mb-1">Prioridade</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as PersonalTask['priority'])}
                    className="w-full bg-[#141416] border border-[#27272a] text-white text-xs rounded-xl p-3 focus:outline-none"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Crítica">Crítica</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => handleDeleteTask(editingTask.id)}
                  className="px-3.5 py-2 bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Tarefa</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTask(null)}
                    className="px-4 py-2 bg-[#27272a] text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#45dfa4] text-gray-950 font-bold text-xs rounded-lg cursor-pointer"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const TIDomainsView: React.FC = () => {
  const { setCurrentScreen } = useApp();
  const [domains, setDomains] = useState(INITIAL_DOMAINS);
  const [showNewDomainModal, setShowNewDomainModal] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [newClient, setNewClient] = useState('');

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    setDomains((prev) => [
      ...prev,
      {
        id: `dom-${Date.now()}`,
        domain: newDomain.trim().toLowerCase(),
        clientName: newClient || 'Cliente GoDesc',
        dnsProvider: 'Cloudflare',
        mailboxesCount: 10,
        storage: '50 GB / 200 GB',
        status: 'OK',
        sslValid: true
      }
    ]);
    setNewDomain('');
    setNewClient('');
    setShowNewDomainModal(false);
  };

  return (
    <div className="min-h-screen bg-[#1e1e24] text-[#dfe2eb] flex flex-col font-sans selection:bg-[#45dfa4]/30 selection:text-[#45dfa4]">
      <header className="bg-[#18181b] border-b border-[#27272a] px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentScreen('ti_dashboard')}
            className="text-xs font-mono text-[#c3c6d7] hover:text-[#45dfa4] flex items-center gap-1.5 transition-all cursor-pointer bg-[#27272a] px-3 py-1.5 rounded-lg border border-[#45dfa4]/50 hover:border-[#45dfa4] shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-[#45dfa4]" />
            <span>Voltar ao Dashboard</span>
          </button>
          <span className="text-[#434655]">|</span>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#45dfa4]" />
            <span>DescMail • Domínios &amp; Caixas Postais</span>
          </h1>
        </div>

        <button
          onClick={() => setShowNewDomainModal(true)}
          className="px-3.5 py-1.5 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Provisionar Domínio</span>
        </button>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6">
        <div className="bg-[#18181b] border border-[#27272a] rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-5 bg-[#141416] border-b border-[#27272a] flex justify-between items-center">
            <h2 className="text-sm font-bold text-white">Domínios Gerenciados ({domains.length})</h2>
            <span className="text-xs font-mono text-[#45dfa4]">Total de Caixas: 484</span>
          </div>

          <div className="divide-y divide-[#27272a]">
            {domains.map((d) => (
              <div
                key={d.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#27272a]/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white font-mono">{d.domain}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-[#45dfa4]/10 text-[#45dfa4] border border-[#45dfa4]/30 rounded">
                      SSL Ativo
                    </span>
                  </div>
                  <p className="text-xs text-[#8d90a0]">
                    Cliente: <strong className="text-[#c3c6d7]">{d.clientName}</strong> • DNS: {d.dnsProvider}
                  </p>
                </div>

                <div className="flex items-center gap-6 text-xs font-mono">
                  <div>
                    <span className="text-[#8d90a0] block text-[10px]">Caixas</span>
                    <span className="text-white font-bold">{d.mailboxesCount}</span>
                  </div>
                  <div>
                    <span className="text-[#8d90a0] block text-[10px]">Storage</span>
                    <span className="text-white">{d.storage}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#45dfa4]/15 text-[#45dfa4] border border-[#45dfa4]/30 text-[10px] font-bold">
                    {d.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* New Domain Modal */}
      {showNewDomainModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Provisionar Novo Domínio DescMail</h3>
            <form onSubmit={handleAddDomain} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-white block mb-1">Nome do Domínio</label>
                <input
                  type="text"
                  required
                  placeholder="exemplo.com.br"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="w-full bg-[#141416] border border-[#27272a] focus:border-[#45dfa4] text-white rounded-lg p-2.5 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white block mb-1">Cliente Vinculado</label>
                <input
                  type="text"
                  placeholder="Nome da empresa"
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  className="w-full bg-[#141416] border border-[#27272a] focus:border-[#45dfa4] text-white rounded-lg p-2.5 text-xs focus:outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setShowNewDomainModal(false)}
                  className="px-4 py-2 border border-[#3f3f46] bg-[#27272a] text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#45dfa4] text-gray-950 font-bold text-xs rounded-lg cursor-pointer"
                >
                  Provisionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const TIClientsView: React.FC = () => {
  const { setCurrentScreen } = useApp();

  return (
    <div className="min-h-screen bg-[#1e1e24] text-[#dfe2eb] flex flex-col font-sans selection:bg-[#45dfa4]/30 selection:text-[#45dfa4]">
      <header className="bg-[#18181b] border-b border-[#27272a] px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentScreen('ti_dashboard')}
            className="text-xs font-mono text-[#8d90a0] hover:text-[#45dfa4] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Dashboard</span>
          </button>
          <span className="text-[#434655]">|</span>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-[#45dfa4]" />
            <span>Gestão de Clientes &amp; Contratos</span>
          </h1>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {INITIAL_CLIENTS.map((cli) => (
            <div
              key={cli.id}
              className="bg-[#18181b] border border-[#27272a] hover:border-[#45dfa4]/50 rounded-2xl p-6 shadow-xl space-y-4 hover:bg-[#27272a]/50 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{cli.name}</h3>
                  <p className="text-xs text-[#8d90a0] mt-0.5">{cli.contactName} ({cli.email})</p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-[#45dfa4]/10 text-[#45dfa4] border border-[#45dfa4]/30 rounded-full font-bold">
                  {cli.status}
                </span>
              </div>

              <div className="p-3 bg-[#141416] rounded-xl border border-[#27272a] space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-[#8d90a0]">Plano:</span>
                  <span className="text-white font-bold">{cli.plan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8d90a0]">Caixas Postais:</span>
                  <span className="text-[#45dfa4] font-bold">{cli.mailboxes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8d90a0]">Espaço Usado:</span>
                  <span className="text-white">{cli.storageUsed}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2">
                <span className="text-[#8d90a0]">Chamados em aberto:</span>
                <span className="font-mono font-bold text-[#ffb95f]">{cli.activeTickets}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export const TIMonitoringView: React.FC = () => {
  const { setCurrentScreen } = useApp();

  return (
    <div className="min-h-screen bg-[#1e1e24] text-[#dfe2eb] flex flex-col font-sans selection:bg-[#45dfa4]/30 selection:text-[#45dfa4]">
      <header className="bg-[#18181b] border-b border-[#27272a] px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentScreen('ti_dashboard')}
            className="text-xs font-mono text-[#c3c6d7] hover:text-[#45dfa4] flex items-center gap-1.5 transition-all cursor-pointer bg-[#27272a] px-3 py-1.5 rounded-lg border border-[#45dfa4]/50 hover:border-[#45dfa4] shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-[#45dfa4]" />
            <span>Voltar ao Dashboard</span>
          </button>
          <span className="text-[#434655]">|</span>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#45dfa4]" />
            <span>Telemetria &amp; Monitoramento de Infraestrutura</span>
          </h1>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#8d90a0]">
              <span>CPU Global (Cluster)</span>
              <Cpu className="w-4 h-4 text-[#45dfa4]" />
            </div>
            <div className="text-3xl font-mono font-bold text-white">24.8%</div>
            <div className="w-full bg-[#141416] h-2 rounded-full overflow-hidden">
              <div className="bg-[#45dfa4] h-full w-[25%] rounded-full"></div>
            </div>
          </div>

          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#8d90a0]">
              <span>Memória RAM Usada</span>
              <Radio className="w-4 h-4 text-[#45dfa4]" />
            </div>
            <div className="text-3xl font-mono font-bold text-white">41.2 GB <span className="text-xs font-normal text-[#8d90a0]">/ 128 GB</span></div>
            <div className="w-full bg-[#141416] h-2 rounded-full overflow-hidden">
              <div className="bg-[#45dfa4] h-full w-[32%] rounded-full"></div>
            </div>
          </div>

          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#8d90a0]">
              <span>Throughput de Rede</span>
              <Activity className="w-4 h-4 text-[#45dfa4]" />
            </div>
            <div className="text-3xl font-mono font-bold text-white">480 Mbps</div>
            <span className="text-[10px] text-[#45dfa4] font-mono">Sem saturação detectada</span>
          </div>

          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#8d90a0]">
              <span>Storage Total SSD NVMe</span>
              <HardDrive className="w-4 h-4 text-[#45dfa4]" />
            </div>
            <div className="text-3xl font-mono font-bold text-white">2.05 TB <span className="text-xs font-normal text-[#8d90a0]">/ 3.0 TB</span></div>
            <div className="w-full bg-[#141416] h-2 rounded-full overflow-hidden">
              <div className="bg-[#ffb95f] h-full w-[68%] rounded-full"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
