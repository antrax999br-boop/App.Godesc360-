import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  MessageSquare,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  Settings,
  Zap,
  Clock,
  UserCheck,
  PhoneCall,
  ChevronRight,
  Inbox,
  Radio,
  Play
} from 'lucide-react';

export const AttendanceQueueDashboardView: React.FC = () => {
  const {
    attendanceConversations,
    attendanceQueues,
    whatsappConnection,
    userSession,
    assignConversation,
    setCurrentScreen,
    sendAttendanceMessage
  } = useApp();

  const [refreshing, setRefreshing] = useState(false);

  const isConnected =
    whatsappConnection.status === 'CONNECTED';

  // Conversas assumidas PELO analista logado
  const isMine = (c: any) =>
    (userSession.name && c.assignedUserName === userSession.name) ||
    (userSession.username && (c.assignedUserName === userSession.username || c.assignedUser === userSession.username)) ||
    (c.assignedUserName === 'Analista T.I.' && (!userSession.name || userSession.username === 't.i'));

  const myConversations = attendanceConversations.filter(
    c => c.status === 'IN_PROGRESS' && isMine(c)
  );

  // Conversas na fila aguardando (sem analista) — WAITING ou TRANSFERRED
  const waitingConversations = attendanceConversations.filter(
    c =>
      (c.status === 'WAITING' || c.status === 'TRANSFERRED') &&
      (!c.assignedUserName || !c.assignedUser)
  );

  const totalActive = attendanceConversations.filter(
    c => c.status !== 'CLOSED'
  ).length;

  // Aceitar conversa e abrir chat
  const handleAccept = (convId: string) => {
    const userId = userSession.username || 'ti_user';
    const userName = userSession.name || 'Analista T.I.';
    assignConversation(convId, userId, userName);
    sendAttendanceMessage(
      convId,
      `Olá! Meu nome é ${userName} e assumi seu atendimento. Como posso ajudar?`,
      'AGENT'
    );
    // Navega para o chat com a conversa pré-selecionada
    localStorage.setItem('attendance_selected_conv', convId);
    setCurrentScreen('attendance_chat');
  };

  // Abrir chat de conversa já assumida
  const handleOpenChat = (convId: string) => {
    localStorage.setItem('attendance_selected_conv', convId);
    setCurrentScreen('attendance_chat');
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  // Cor/badge da fila
  const queueBadgeClass = (queueName?: string) => {
    const name = (queueName || '').toLowerCase();
    if (name.includes('comercial')) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (name.includes('suporte')) return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
    if (name.includes('financeiro')) return 'bg-violet-500/15 text-violet-400 border-violet-500/30';
    if (name.includes('ticket') || name.includes('chamado')) return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    return 'bg-[#45dfa4]/15 text-[#45dfa4] border-[#45dfa4]/30';
  };

  // Iniciais do nome
  const initials = (name: string) =>
    name
      .split(' ')
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase();

  // Avatar color from name
  const avatarColor = (name: string) => {
    const colors = [
      'bg-emerald-500/20 text-emerald-300',
      'bg-sky-500/20 text-sky-300',
      'bg-violet-500/20 text-violet-300',
      'bg-amber-500/20 text-amber-300',
      'bg-rose-500/20 text-rose-300',
      'bg-[#45dfa4]/20 text-[#45dfa4]',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return colors[hash % colors.length];
  };

  return (
    <div className="min-h-screen bg-[#141416] flex flex-col">
      {/* ─── Top Header ─── */}
      <header className="bg-[#18181b] border-b border-[#27272a] px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentScreen('ti_dashboard')}
            className="p-2 bg-[#27272a] hover:bg-[#323238] text-white rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold"
            title="Voltar ao Painel T.I."
          >
            <ArrowLeft className="w-4 h-4 text-[#45dfa4]" />
            <span>Voltar</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#45dfa4]/10 border border-[#45dfa4]/30 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-[#45dfa4]" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">
                Fila de Atendimento
              </h1>
              <p className="text-[11px] text-[#8d90a0]">
                Gerencie atendimentos técnicos via WhatsApp
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Badge */}
          {isConnected ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Conectado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
              Desconectado
            </span>
          )}

          {/* Iniciar Conversa */}
          <button
            onClick={() => setCurrentScreen('attendance_chat')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-[#45dfa4]/20"
          >
            <Play className="w-3.5 h-3.5 text-gray-950" />
            Iniciar Conversa
          </button>
        </div>
      </header>

      {/* ─── Body ─── */}
      <div className="flex-1 flex gap-0 overflow-hidden">

        {/* ─── Sidebar Status ─── */}
        <aside className="w-72 bg-[#18181b] border-r border-[#27272a] p-5 space-y-5 shrink-0">
          {/* Status card */}
          <div className="bg-[#141416] rounded-2xl border border-[#27272a] p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono text-[#8d90a0]">
                Status
              </h2>
              {isConnected ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Conectado
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                  Offline
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-xs text-[#8d90a0]">
                <div className="w-7 h-7 rounded-lg bg-[#27272a] flex items-center justify-center shrink-0">
                  <Inbox className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span>
                  Fila:{' '}
                  <strong className="text-white font-mono">
                    {waitingConversations.length} aguardando
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-[#8d90a0]">
                <div className="w-7 h-7 rounded-lg bg-[#27272a] flex items-center justify-center shrink-0">
                  <Radio className="w-3.5 h-3.5 text-[#45dfa4]" />
                </div>
                <span>
                  Ativos:{' '}
                  <strong className="text-white font-mono">
                    {totalActive} chats
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Filas configuradas */}
          {attendanceQueues.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[10px] font-mono font-bold text-[#8d90a0] uppercase tracking-wider px-1">
                Filas Configuradas
              </h3>
              {attendanceQueues.map(q => {
                const qCount = waitingConversations.filter(
                  c => c.queueId === q.id || c.queueName === q.name
                ).length;
                return (
                  <div
                    key={q.id}
                    className="flex items-center justify-between px-3 py-2 bg-[#141416] rounded-xl border border-[#27272a]"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: q.color || '#45dfa4' }}
                      />
                      <span className="text-xs text-white">{q.name}</span>
                    </div>
                    {qCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-amber-400 text-gray-950 text-[10px] font-bold flex items-center justify-center">
                        {qCount}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Ações rápidas */}
          <div className="space-y-2 pt-2 border-t border-[#27272a]">
            <button
              onClick={() => setCurrentScreen('attendance_queues_config')}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-[#141416] hover:bg-[#1e1e24] border border-[#27272a] rounded-xl text-xs text-[#8d90a0] hover:text-white transition-all cursor-pointer group"
            >
              <Settings className="w-4 h-4 text-[#45dfa4]" />
              Gerenciar Filas
              <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={() => setCurrentScreen('attendance_chat')}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-[#141416] hover:bg-[#1e1e24] border border-[#27272a] rounded-xl text-xs text-[#8d90a0] hover:text-white transition-all cursor-pointer group"
            >
              <MessageSquare className="w-4 h-4 text-[#45dfa4]" />
              Central de Chat
              <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </aside>

        {/* ─── Main Content ─── */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ─── Meus Atendimentos ─── */}
          <section className="bg-[#18181b] rounded-2xl border border-[#27272a] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#45dfa4]/10 border border-[#45dfa4]/20 flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-[#45dfa4]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Meus Atendimentos</h2>
                  <p className="text-[11px] text-[#8d90a0]">
                    Conversas em andamento atribuídas a você
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-[#45dfa4]/10 text-[#45dfa4] border border-[#45dfa4]/20 rounded-full text-[11px] font-mono font-bold">
                  {myConversations.length}
                </span>
                <button
                  onClick={handleRefresh}
                  className="p-1.5 bg-[#27272a] hover:bg-[#323238] rounded-lg transition-all cursor-pointer"
                  title="Atualizar"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 text-[#8d90a0] ${refreshing ? 'animate-spin' : ''}`}
                  />
                </button>
              </div>
            </div>

            {myConversations.length === 0 ? (
              <div className="px-6 py-10 text-center text-[#8d90a0] space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto text-[#45dfa4]/20" />
                <p className="text-sm font-semibold text-white">Nenhum atendimento ativo</p>
                <p className="text-xs">
                  Aceite conversas abaixo para começar a atender.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#27272a]/60">
                {myConversations.map(conv => (
                  <div
                    key={conv.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-[#1e1e24]/50 transition-colors group"
                  >
                    {/* Avatar */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${avatarColor(conv.contactName)}`}
                    >
                      {initials(conv.contactName)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-sm font-bold text-white truncate">
                          {conv.contactName}
                        </h4>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold border ${queueBadgeClass(conv.queueName)}`}
                        >
                          {conv.queueName || 'Fila Geral'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8d90a0] truncate">
                        {conv.contactPhone}
                      </p>
                      <p className="text-[11px] text-[#8d90a0] truncate mt-0.5">
                        {conv.lastMessageText}
                      </p>
                    </div>

                    {/* Time */}
                    <div className="text-right shrink-0 space-y-1">
                      <div className="flex items-center gap-1 text-[10px] text-[#8d90a0] font-mono justify-end">
                        <Clock className="w-3 h-3" />
                        {conv.lastMessageAt}
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#45dfa4] text-gray-950 text-[10px] font-bold">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>

                    {/* Status badge */}
                    <span className="px-3 py-1.5 bg-[#45dfa4]/10 text-[#45dfa4] border border-[#45dfa4]/20 rounded-lg text-[11px] font-mono font-bold shrink-0">
                      Em Atendimento
                    </span>

                    {/* Action button */}
                    <button
                      onClick={() => handleOpenChat(conv.id)}
                      className="px-4 py-2 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-[#45dfa4]/10 flex items-center gap-1.5 shrink-0 opacity-90 group-hover:opacity-100"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-gray-950" />
                      Abrir Chat
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ─── Novos Clientes Aguardando ─── */}
          <section className="bg-[#18181b] rounded-2xl border border-[#27272a] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <PhoneCall className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Novos Clientes Aguardando</h2>
                  <p className="text-[11px] text-[#8d90a0]">
                    Clientes na fila aguardando um analista
                  </p>
                </div>
              </div>

              {waitingConversations.length > 0 && (
                <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[11px] font-mono font-bold animate-pulse">
                  {waitingConversations.length} aguardando
                </span>
              )}
            </div>

            {waitingConversations.length === 0 ? (
              <div className="px-6 py-14 text-center text-[#8d90a0] space-y-3">
                <div className="flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#27272a] flex items-center justify-center">
                    <Users className="w-8 h-8 text-[#8d90a0]/40" />
                  </div>
                </div>
                <p className="text-sm font-semibold text-white">
                  Nenhum cliente novo aguardando atendimento
                </p>
                <p className="text-xs max-w-sm mx-auto">
                  Quando um cliente selecionar uma fila no chatbot, ele aparecerá aqui para você aceitar.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#27272a]/60">
                {waitingConversations.map(conv => (
                  <div
                    key={conv.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-[#1e1e24]/50 transition-colors group"
                  >
                    {/* Avatar */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 relative ${avatarColor(conv.contactName)}`}
                    >
                      {initials(conv.contactName)}
                      {/* Pulse indicator */}
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-[#18181b] animate-pulse" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-sm font-bold text-white truncate">
                          {conv.contactName}
                        </h4>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold border ${queueBadgeClass(conv.queueName)}`}
                        >
                          {conv.queueName || 'Fila Geral'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8d90a0] truncate">
                        {conv.contactPhone}
                      </p>
                      <p className="text-[11px] text-[#8d90a0] truncate mt-0.5">
                        {conv.lastMessageText}
                      </p>
                    </div>

                    {/* Time */}
                    <div className="text-right shrink-0 space-y-1">
                      <div className="flex items-center gap-1 text-[10px] text-[#8d90a0] font-mono justify-end">
                        <Clock className="w-3 h-3" />
                        {conv.lastMessageAt}
                      </div>
                    </div>

                    {/* Status badge */}
                    <span className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-[11px] font-mono font-bold shrink-0 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      Aguardando
                    </span>

                    {/* Accept button */}
                    <button
                      onClick={() => handleAccept(conv.id)}
                      className="px-4 py-2 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-[#45dfa4]/10 flex items-center gap-1.5 shrink-0 opacity-90 group-hover:opacity-100"
                    >
                      <Zap className="w-3.5 h-3.5 text-gray-950" />
                      Aceitar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};
