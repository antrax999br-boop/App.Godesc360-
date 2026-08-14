import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  Plus,
  ArrowLeft,
  ChevronRight,
  Mail
} from 'lucide-react';
import { TicketStatus } from '../types';

export const ClientMyTickets: React.FC = () => {
  const { tickets, setCurrentScreen, setSelectedTicket, userSession } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');

  const savedEmail = localStorage.getItem('godesc_saved_email') || '';
  const [filterEmail, setFilterEmail] = useState(userSession.email || savedEmail);

  useEffect(() => {
    if (filterEmail.trim()) {
      localStorage.setItem('godesc_saved_email', filterEmail.trim().toLowerCase());
    }
  }, [filterEmail]);

  const cleanFilterEmail = filterEmail.trim().toLowerCase();

  const filteredTickets = tickets.filter((tk) => {
    // Filtragem estrita pelo e-mail do solicitante
    if (cleanFilterEmail) {
      const ticketEmail = (tk.requesterEmail || '').trim().toLowerCase();
      const hasEmailInMsgs = tk.messages?.some(m => (m as any).requesterEmail?.trim().toLowerCase() === cleanFilterEmail);
      if (ticketEmail !== cleanFilterEmail && !hasEmailInMsgs) {
        return false;
      }
    } else {
      // Se nenhum e-mail for informado, não exibe chamados de terceiros
      return false;
    }

    const matchSearch =
      tk.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
      tk.title.toLowerCase().includes(search.toLowerCase()) ||
      tk.category.toLowerCase().includes(search.toLowerCase()) ||
      tk.requesterName.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      statusFilter === 'Todos' ||
      (statusFilter === 'Abertos' && tk.status !== 'Resolvido' && tk.status !== 'Fechado') ||
      tk.status === statusFilter;

    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen bg-[#1e1e24] text-[#dfe2eb] flex flex-col font-sans selection:bg-[#45dfa4]/30 selection:text-[#45dfa4]">
      {/* Top Header */}
      <header className="bg-[#18181b] border-b border-[#27272a] px-6 md:px-12 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentScreen('client_home')}
            className="text-xs font-mono text-[#8d90a0] hover:text-[#45dfa4] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Portal</span>
          </button>
          <span className="text-[#434655]">|</span>
          <h1 className="text-base font-bold text-white">Central de Chamados do Solicitante</h1>
        </div>

        <button
          onClick={() => setCurrentScreen('new_ticket')}
          className="px-3.5 py-1.5 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-md shadow-[#45dfa4]/10 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Novo Chamado</span>
        </button>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Meus Chamados</h2>
            <p className="text-xs text-[#8d90a0] mt-1">
              Acompanhe o andamento dos seus chamados de suporte técnico em tempo real.
            </p>
          </div>

          {/* Search Input */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8d90a0]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por número ou título..."
                className="bg-[#151c25] border border-[#2A2F3A] focus:border-[#45dfa4] rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder:text-[#8d90a0] focus:outline-none transition-all w-full sm:w-64"
              />
            </div>
          </div>
        </div>

        {/* Email Filter Bar */}
        <div className="bg-[#151c25] border border-[#2A2F3A] rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2 text-xs text-[#c3c6d7]">
            <Mail className="w-4 h-4 text-[#45dfa4]" />
            <span>Consultando chamados do e-mail:</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="email"
              value={filterEmail}
              onChange={(e) => setFilterEmail(e.target.value)}
              placeholder="Digite seu e-mail para ver seus chamados..."
              className="bg-[#111827] border border-[#2A2F3A] focus:border-[#45dfa4] text-white text-xs rounded-lg px-3.5 py-2 focus:outline-none w-full sm:w-72 placeholder:text-[#8d90a0]"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 text-xs font-mono">
          {['Todos', 'Abertos', 'Novo', 'Em Atendimento', 'Pendente', 'Resolvido'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-full border transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#45dfa4]/15 text-[#45dfa4] border-[#45dfa4]/40 font-bold'
                  : 'bg-[#151c25] text-[#8d90a0] border-[#2A2F3A] hover:text-white hover:border-[#434655]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Ticket List */}
        {filteredTickets.length > 0 ? (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="bg-[#151c25] border border-[#2A2F3A] hover:border-[#45dfa4]/50 rounded-xl p-5 cursor-pointer transition-all duration-200 hover:bg-[#192029] shadow-lg group flex flex-col md:flex-row justify-between md:items-center gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-[#45dfa4] bg-[#45dfa4]/10 border border-[#45dfa4]/30 px-2 py-0.5 rounded">
                      {ticket.ticketNumber}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        ticket.priority === 'Crítica' || ticket.priority === 'Alta'
                          ? 'bg-[#93000a]/40 text-[#ffb4ab]'
                          : 'bg-[#45dfa4]/20 text-[#45dfa4]'
                      }`}
                    >
                      Prioridade: {ticket.priority}
                    </span>
                    <span className="text-xs text-[#8d90a0] font-mono">• {ticket.category}</span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#45dfa4] transition-colors">
                    {ticket.title}
                  </h3>

                  <p className="text-xs text-[#c3c6d7] line-clamp-2 leading-relaxed">
                    {ticket.description}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-[#8d90a0] font-mono pt-1">
                    <span>Solicitante: {ticket.requesterName}</span>
                    <span>•</span>
                    <span>Máquina: {ticket.machineName}</span>
                    <span>•</span>
                    <span>{ticket.messages.length} interações</span>
                  </div>
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[#2A2F3A]">
                  <span
                    className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                      ticket.status === 'Novo'
                        ? 'bg-[#2563eb]/20 text-[#b4c5ff] border-[#2563eb]/40'
                        : ticket.status === 'Em Atendimento'
                        ? 'bg-[#ffb95f]/20 text-[#ffb95f] border-[#ffb95f]/40'
                        : ticket.status === 'Pendente'
                        ? 'bg-[#b4c5ff]/20 text-[#b4c5ff] border-[#b4c5ff]/40'
                        : 'bg-[#45dfa4]/20 text-[#45dfa4] border-[#45dfa4]/40'
                    }`}
                  >
                    {ticket.status}
                  </span>

                  <span className="text-[10px] text-[#8d90a0] font-mono">
                    {ticket.createdAt}
                  </span>

                  <div className="text-xs font-mono text-[#45dfa4] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Ver detalhes</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#151c25] border border-[#2A2F3A] rounded-2xl p-12 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-[#232a34] text-[#8d90a0] flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-[#45dfa4]" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              {cleanFilterEmail ? 'Nenhum chamado encontrado para este e-mail' : 'Informe seu e-mail de solicitante'}
            </h3>
            <p className="text-xs text-[#8d90a0] mb-6">
              {cleanFilterEmail
                ? `Não foram encontrados chamados vinculados ao e-mail "${cleanFilterEmail}".`
                : 'Digite seu e-mail no campo acima ou abra um novo chamado para acompanhar.'}
            </p>
            <button
              onClick={() => setCurrentScreen('new_ticket')}
              className="px-4 py-2.5 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Abrir Novo Chamado</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
