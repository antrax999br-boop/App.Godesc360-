import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { AttendanceContact } from '../types';
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
  Play,
  Plus,
  X,
  User,
  Phone,
  ChevronDown,
  Search,
  BookUser,
  Trash2,
  Star,
  Building2,
  UserPlus
} from 'lucide-react';

type ModalMode = 'none' | 'new_conv' | 'contacts';

export const AttendanceQueueDashboardView: React.FC = () => {
  const {
    attendanceConversations,
    attendanceQueues,
    whatsappConnection,
    userSession,
    assignConversation,
    setCurrentScreen,
    sendAttendanceMessage,
    createManualConversation,
    attendanceContacts,
    saveContact,
    deleteContact
  } = useApp();

  const [refreshing, setRefreshing] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('none');

  // ── Nova Conversa Manual ──
  const [newConvName, setNewConvName] = useState('');
  const [newConvPhone, setNewConvPhone] = useState('');
  const [newConvQueueId, setNewConvQueueId] = useState('');
  const [newConvError, setNewConvError] = useState('');
  const [creating, setCreating] = useState(false);

  // ── Salvar Contato inline no modal ──
  const [saveAsContact, setSaveAsContact] = useState(false);

  // ── Painel de Contatos ──
  const [contactSearch, setContactSearch] = useState('');
  const [showSaveContactForm, setShowSaveContactForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Partial<AttendanceContact> | null>(null);
  const [contactError, setContactError] = useState('');

  const isConnected = whatsappConnection.status === 'CONNECTED';

  const isMine = (c: any) =>
    (userSession.name && c.assignedUserName === userSession.name) ||
    (userSession.username && (c.assignedUserName === userSession.username || c.assignedUser === userSession.username)) ||
    (c.assignedUserName === 'Analista T.I.' && (!userSession.name || userSession.username === 't.i'));

  const myConversations = attendanceConversations.filter(
    c => c.status === 'IN_PROGRESS' && isMine(c)
  );
  const waitingConversations = attendanceConversations.filter(
    c => (c.status === 'WAITING' || c.status === 'TRANSFERRED') && (!c.assignedUserName || !c.assignedUser)
  );
  const totalActive = attendanceConversations.filter(c => c.status !== 'CLOSED').length;

  // Contatos filtrados pela busca
  const filteredContacts = useMemo(() => {
    const q = contactSearch.toLowerCase().trim();
    if (!q) return attendanceContacts;
    return attendanceContacts.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
      (c.companyName || '').toLowerCase().includes(q)
    );
  }, [attendanceContacts, contactSearch]);

  const handleAccept = (convId: string) => {
    const userId = userSession.username || 'ti_user';
    const userName = userSession.name || 'Analista T.I.';
    assignConversation(convId, userId, userName);
    sendAttendanceMessage(convId, `Olá! Meu nome é ${userName} e assumi seu atendimento. Como posso ajudar?`, 'AGENT');
    localStorage.setItem('attendance_selected_conv', convId);
    setCurrentScreen('attendance_chat');
  };

  const handleOpenChat = (convId: string) => {
    localStorage.setItem('attendance_selected_conv', convId);
    setCurrentScreen('attendance_chat');
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  // Formata telefone enquanto digita
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 13);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  };

  // ── Criar conversa manual ──
  const handleCreateConversation = () => {
    setNewConvError('');
    const nameClean = newConvName.trim();
    const phoneClean = newConvPhone.replace(/\D/g, '');
    if (!nameClean) { setNewConvError('Informe o nome do contato.'); return; }
    if (phoneClean.length < 10) { setNewConvError('Informe um número válido (com DDD).'); return; }
    setCreating(true);
    try {
      const selectedQueue = attendanceQueues.find(q => q.id === newConvQueueId);
      const conv = createManualConversation(nameClean, newConvPhone.trim(), selectedQueue?.id, selectedQueue?.name);
      if (saveAsContact) {
        saveContact({ companyId: 'default-company', name: nameClean, phone: newConvPhone.trim(), tags: [] });
      }
      closeModal();
      localStorage.setItem('attendance_selected_conv', conv.id);
      setCurrentScreen('attendance_chat');
    } finally {
      setCreating(false);
    }
  };

  // ── Iniciar conversa a partir de um contato ──
  const handleStartFromContact = (contact: AttendanceContact) => {
    const selectedQueue = attendanceQueues[0];
    const conv = createManualConversation(contact.name, contact.phone, selectedQueue?.id, selectedQueue?.name);
    closeModal();
    localStorage.setItem('attendance_selected_conv', conv.id);
    setCurrentScreen('attendance_chat');
  };

  // ── Salvar contato no painel de contatos ──
  const handleSaveContactForm = () => {
    setContactError('');
    if (!editingContact?.name?.trim()) { setContactError('Informe o nome.'); return; }
    if (!editingContact?.phone?.trim() || editingContact.phone.replace(/\D/g, '').length < 10) {
      setContactError('Informe um número válido.');
      return;
    }
    saveContact({
      companyId: 'default-company',
      name: editingContact.name.trim(),
      phone: editingContact.phone.trim(),
      email: editingContact.email,
      companyName: editingContact.companyName,
      tags: editingContact.tags || []
    });
    setShowSaveContactForm(false);
    setEditingContact(null);
    setContactError('');
  };

  const closeModal = () => {
    setModalMode('none');
    setNewConvName('');
    setNewConvPhone('');
    setNewConvQueueId('');
    setNewConvError('');
    setSaveAsContact(false);
    setShowSaveContactForm(false);
    setEditingContact(null);
    setContactError('');
    setContactSearch('');
  };

  const queueBadgeClass = (queueName?: string) => {
    const name = (queueName || '').toLowerCase();
    if (name.includes('comercial')) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (name.includes('suporte')) return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
    if (name.includes('financeiro')) return 'bg-violet-500/15 text-violet-400 border-violet-500/30';
    if (name.includes('ticket') || name.includes('chamado')) return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    return 'bg-[#45dfa4]/15 text-[#45dfa4] border-[#45dfa4]/30';
  };

  const initials = (name: string) =>
    name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

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
      {/* ─── Header ─── */}
      <header className="bg-[#18181b] border-b border-[#27272a] px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentScreen('ti_dashboard')}
            className="p-2 bg-[#27272a] hover:bg-[#323238] text-white rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4 text-[#45dfa4]" />
            <span>Voltar</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#45dfa4]/10 border border-[#45dfa4]/30 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-[#45dfa4]" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">Fila de Atendimento</h1>
              <p className="text-[11px] text-[#8d90a0]">Gerencie atendimentos técnicos via WhatsApp</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Conectado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />Desconectado
            </span>
          )}
          <button
            onClick={() => setModalMode('contacts')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#27272a] hover:bg-[#323238] border border-[#27272a] text-[#8d90a0] hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            <BookUser className="w-3.5 h-3.5" />
            Contatos
          </button>
          <button
            onClick={() => setModalMode('new_conv')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#27272a] hover:bg-[#323238] border border-[#45dfa4]/30 text-[#45dfa4] font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Conversa
          </button>
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
        {/* ─── Sidebar ─── */}
        <aside className="w-72 bg-[#18181b] border-r border-[#27272a] p-5 space-y-5 shrink-0">
          <div className="bg-[#141416] rounded-2xl border border-[#27272a] p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-[#8d90a0]">Status</h2>
              {isConnected ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Conectado</span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/20">Offline</span>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-xs text-[#8d90a0]">
                <div className="w-7 h-7 rounded-lg bg-[#27272a] flex items-center justify-center shrink-0">
                  <Inbox className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span>Fila: <strong className="text-white font-mono">{waitingConversations.length} aguardando</strong></span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#8d90a0]">
                <div className="w-7 h-7 rounded-lg bg-[#27272a] flex items-center justify-center shrink-0">
                  <Radio className="w-3.5 h-3.5 text-[#45dfa4]" />
                </div>
                <span>Ativos: <strong className="text-white font-mono">{totalActive} chats</strong></span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#8d90a0]">
                <div className="w-7 h-7 rounded-lg bg-[#27272a] flex items-center justify-center shrink-0">
                  <BookUser className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <span>Contatos: <strong className="text-white font-mono">{attendanceContacts.length} salvos</strong></span>
              </div>
            </div>
          </div>

          {attendanceQueues.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[10px] font-mono font-bold text-[#8d90a0] uppercase tracking-wider px-1">Filas Configuradas</h3>
              {attendanceQueues.map(q => {
                const qCount = waitingConversations.filter(c => c.queueId === q.id || c.queueName === q.name).length;
                return (
                  <div key={q.id} className="flex items-center justify-between px-3 py-2 bg-[#141416] rounded-xl border border-[#27272a]">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: q.color || '#45dfa4' }} />
                      <span className="text-xs text-white">{q.name}</span>
                    </div>
                    {qCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-amber-400 text-gray-950 text-[10px] font-bold flex items-center justify-center">{qCount}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-[#27272a]">
            <button
              onClick={() => setModalMode('contacts')}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-violet-500/5 hover:bg-violet-500/10 border border-violet-500/20 rounded-xl text-xs text-violet-400 font-semibold hover:text-violet-300 transition-all cursor-pointer group"
            >
              <BookUser className="w-4 h-4" />
              Contatos Salvos
              <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button
              onClick={() => setModalMode('new_conv')}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-[#45dfa4]/5 hover:bg-[#45dfa4]/10 border border-[#45dfa4]/20 rounded-xl text-xs text-[#45dfa4] hover:text-[#45dfa4] transition-all cursor-pointer group font-semibold"
            >
              <Plus className="w-4 h-4" />
              Nova Conversa Manual
              <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
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

        {/* ─── Main ─── */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Meus Atendimentos */}
          <section className="bg-[#18181b] rounded-2xl border border-[#27272a] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#45dfa4]/10 border border-[#45dfa4]/20 flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-[#45dfa4]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Meus Atendimentos</h2>
                  <p className="text-[11px] text-[#8d90a0]">Conversas em andamento atribuídas a você</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-[#45dfa4]/10 text-[#45dfa4] border border-[#45dfa4]/20 rounded-full text-[11px] font-mono font-bold">{myConversations.length}</span>
                <button onClick={handleRefresh} className="p-1.5 bg-[#27272a] hover:bg-[#323238] rounded-lg transition-all cursor-pointer">
                  <RefreshCw className={`w-3.5 h-3.5 text-[#8d90a0] ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            {myConversations.length === 0 ? (
              <div className="px-6 py-10 text-center text-[#8d90a0] space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto text-[#45dfa4]/20" />
                <p className="text-sm font-semibold text-white">Nenhum atendimento ativo</p>
                <p className="text-xs">Aceite conversas abaixo ou inicie uma nova.</p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <button
                    onClick={() => setModalMode('new_conv')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#45dfa4]/10 hover:bg-[#45dfa4]/20 border border-[#45dfa4]/30 text-[#45dfa4] font-semibold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Nova Conversa
                  </button>
                  <button
                    onClick={() => setModalMode('contacts')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-400 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    <BookUser className="w-3.5 h-3.5" />
                    Contatos
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[#27272a]/60">
                {myConversations.map(conv => (
                  <div key={conv.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#1e1e24]/50 transition-colors group">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${avatarColor(conv.contactName)}`}>
                      {initials(conv.contactName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-sm font-bold text-white truncate">{conv.contactName}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold border ${queueBadgeClass(conv.queueName)}`}>
                          {conv.queueName || 'Fila Geral'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8d90a0] truncate">{conv.contactPhone}</p>
                      <p className="text-[11px] text-[#8d90a0] truncate mt-0.5">{conv.lastMessageText}</p>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <div className="flex items-center gap-1 text-[10px] text-[#8d90a0] font-mono justify-end">
                        <Clock className="w-3 h-3" />{conv.lastMessageAt}
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#45dfa4] text-gray-950 text-[10px] font-bold">{conv.unreadCount}</span>
                      )}
                    </div>
                    <span className="px-3 py-1.5 bg-[#45dfa4]/10 text-[#45dfa4] border border-[#45dfa4]/20 rounded-lg text-[11px] font-mono font-bold shrink-0">Em Atendimento</span>
                    <button
                      onClick={() => handleOpenChat(conv.id)}
                      className="px-4 py-2 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-[#45dfa4]/10 flex items-center gap-1.5 shrink-0 opacity-90 group-hover:opacity-100"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-gray-950" />Abrir Chat
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Novos Clientes Aguardando */}
          <section className="bg-[#18181b] rounded-2xl border border-[#27272a] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <PhoneCall className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Novos Clientes Aguardando</h2>
                  <p className="text-[11px] text-[#8d90a0]">Clientes na fila aguardando um analista</p>
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
                <div className="w-16 h-16 rounded-full bg-[#27272a] flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8 text-[#8d90a0]/40" />
                </div>
                <p className="text-sm font-semibold text-white">Nenhum cliente aguardando</p>
                <p className="text-xs max-w-sm mx-auto">Quando um cliente selecionar uma fila no chatbot, ele aparecerá aqui.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#27272a]/60">
                {waitingConversations.map(conv => (
                  <div key={conv.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#1e1e24]/50 transition-colors group">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 relative ${avatarColor(conv.contactName)}`}>
                      {initials(conv.contactName)}
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-[#18181b] animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-sm font-bold text-white truncate">{conv.contactName}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold border ${queueBadgeClass(conv.queueName)}`}>
                          {conv.queueName || 'Fila Geral'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8d90a0] truncate">{conv.contactPhone}</p>
                      <p className="text-[11px] text-[#8d90a0] truncate mt-0.5">{conv.lastMessageText}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-[10px] text-[#8d90a0] font-mono justify-end">
                        <Clock className="w-3 h-3" />{conv.lastMessageAt}
                      </div>
                    </div>
                    <span className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-[11px] font-mono font-bold shrink-0 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />Aguardando
                    </span>
                    <button
                      onClick={() => handleAccept(conv.id)}
                      className="px-4 py-2 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-[#45dfa4]/10 flex items-center gap-1.5 shrink-0 opacity-90 group-hover:opacity-100"
                    >
                      <Zap className="w-3.5 h-3.5 text-gray-950" />Aceitar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* ══════════════════════════════════════════
          MODAL: Nova Conversa Manual
      ══════════════════════════════════════════ */}
      {modalMode === 'new_conv' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#27272a]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#45dfa4]/10 border border-[#45dfa4]/30 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-[#45dfa4]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Nova Conversa Manual</h2>
                  <p className="text-[11px] text-[#8d90a0]">Inicie sem precisar do WhatsApp conectado</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-1.5 bg-[#27272a] hover:bg-[#323238] rounded-lg transition-all cursor-pointer">
                <X className="w-4 h-4 text-[#8d90a0]" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Busca rápida de contato salvo */}
              <div className="bg-[#141416] border border-[#27272a] rounded-xl p-3 space-y-2">
                <p className="text-[10px] font-mono font-bold text-[#8d90a0] uppercase tracking-wider">Usar contato salvo</p>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8d90a0]" />
                  <input
                    type="text"
                    placeholder="Buscar contato por nome ou número..."
                    value={contactSearch}
                    onChange={e => setContactSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-[#1e1e24] border border-[#27272a] rounded-lg text-xs text-white placeholder-[#8d90a0]/50 outline-none"
                  />
                </div>
                {contactSearch && (
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {filteredContacts.length === 0 ? (
                      <p className="text-[10px] text-[#8d90a0] text-center py-2">Nenhum contato encontrado</p>
                    ) : filteredContacts.slice(0, 5).map(contact => (
                      <button
                        key={contact.id}
                        onClick={() => handleStartFromContact(contact)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 bg-[#27272a] hover:bg-[#323238] rounded-lg transition-all cursor-pointer text-left"
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${avatarColor(contact.name)}`}>
                          {initials(contact.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{contact.name}</p>
                          <p className="text-[10px] text-[#8d90a0] font-mono truncate">{contact.phone}</p>
                        </div>
                        <MessageSquare className="w-3.5 h-3.5 text-[#45dfa4] shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#27272a]" />
                <span className="text-[10px] text-[#8d90a0] font-mono">ou preencha manualmente</span>
                <div className="flex-1 h-px bg-[#27272a]" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#8d90a0] uppercase tracking-wide flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#45dfa4]" />Nome do Contato *
                </label>
                <input
                  type="text"
                  placeholder="Ex: João Silva"
                  value={newConvName}
                  onChange={e => setNewConvName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateConversation()}
                  className="w-full px-4 py-3 bg-[#141416] border border-[#27272a] focus:border-[#45dfa4]/50 rounded-xl text-sm text-white placeholder-[#8d90a0]/50 outline-none transition-all"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#8d90a0] uppercase tracking-wide flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#45dfa4]" />Número do WhatsApp *
                </label>
                <input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={newConvPhone}
                  onChange={e => setNewConvPhone(formatPhone(e.target.value))}
                  onKeyDown={e => e.key === 'Enter' && handleCreateConversation()}
                  className="w-full px-4 py-3 bg-[#141416] border border-[#27272a] focus:border-[#45dfa4]/50 rounded-xl text-sm text-white placeholder-[#8d90a0]/50 outline-none transition-all"
                />
              </div>

              {attendanceQueues.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#8d90a0] uppercase tracking-wide flex items-center gap-1.5">
                    <ChevronDown className="w-3.5 h-3.5 text-[#45dfa4]" />Fila (opcional)
                  </label>
                  <select
                    value={newConvQueueId}
                    onChange={e => setNewConvQueueId(e.target.value)}
                    className="w-full px-4 py-3 bg-[#141416] border border-[#27272a] focus:border-[#45dfa4]/50 rounded-xl text-sm text-white outline-none transition-all cursor-pointer"
                  >
                    <option value="">Sem fila específica</option>
                    {attendanceQueues.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                  </select>
                </div>
              )}

              {/* Salvar como contato */}
              <label className="flex items-center gap-3 px-3 py-2.5 bg-[#141416] border border-[#27272a] rounded-xl cursor-pointer hover:border-[#45dfa4]/30 transition-all">
                <input
                  type="checkbox"
                  checked={saveAsContact}
                  onChange={e => setSaveAsContact(e.target.checked)}
                  className="w-4 h-4 accent-[#45dfa4] cursor-pointer"
                />
                <div>
                  <p className="text-xs font-semibold text-white">Salvar como contato</p>
                  <p className="text-[10px] text-[#8d90a0]">Guarda o contato para uso futuro</p>
                </div>
              </label>

              {newConvError && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <X className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-xs text-red-400">{newConvError}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 px-6 py-4 border-t border-[#27272a] bg-[#141416]/50">
              <button onClick={closeModal} className="flex-1 px-4 py-2.5 bg-[#27272a] hover:bg-[#323238] text-[#8d90a0] hover:text-white font-semibold text-sm rounded-xl transition-all cursor-pointer">
                Cancelar
              </button>
              <button
                onClick={handleCreateConversation}
                disabled={creating || !newConvName.trim() || newConvPhone.replace(/\D/g, '').length < 10}
                className="flex-1 px-4 py-2.5 bg-[#45dfa4] hover:bg-[#00bd85] disabled:opacity-40 disabled:cursor-not-allowed text-gray-950 font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#45dfa4]/20"
              >
                {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                {creating ? 'Criando...' : 'Iniciar Conversa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL: Contatos Salvos
      ══════════════════════════════════════════ */}
      {modalMode === 'contacts' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col" style={{ maxHeight: '85vh' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#27272a] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center">
                  <BookUser className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Contatos Salvos</h2>
                  <p className="text-[11px] text-[#8d90a0]">{attendanceContacts.length} contatos • clique para iniciar conversa</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setShowSaveContactForm(true); setEditingContact({ companyId: 'default-company', tags: [] }); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-400 font-bold text-xs rounded-lg transition-all cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Novo Contato
                </button>
                <button onClick={closeModal} className="p-1.5 bg-[#27272a] hover:bg-[#323238] rounded-lg transition-all cursor-pointer">
                  <X className="w-4 h-4 text-[#8d90a0]" />
                </button>
              </div>
            </div>

            {/* Form: Novo Contato */}
            {showSaveContactForm && editingContact && (
              <div className="px-6 py-4 border-b border-[#27272a] bg-[#141416]/50 space-y-3 shrink-0">
                <p className="text-xs font-bold text-white">Adicionar Novo Contato</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-[#8d90a0] font-mono mb-1 block">Nome *</label>
                    <input
                      type="text"
                      placeholder="Nome completo"
                      value={editingContact.name || ''}
                      onChange={e => setEditingContact(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#1e1e24] border border-[#27272a] focus:border-violet-500/50 rounded-lg text-xs text-white placeholder-[#8d90a0]/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#8d90a0] font-mono mb-1 block">WhatsApp *</label>
                    <input
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={editingContact.phone || ''}
                      onChange={e => setEditingContact(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                      className="w-full px-3 py-2 bg-[#1e1e24] border border-[#27272a] focus:border-violet-500/50 rounded-lg text-xs text-white placeholder-[#8d90a0]/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#8d90a0] font-mono mb-1 block">Empresa</label>
                    <input
                      type="text"
                      placeholder="Nome da empresa"
                      value={editingContact.companyName || ''}
                      onChange={e => setEditingContact(prev => ({ ...prev, companyName: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#1e1e24] border border-[#27272a] focus:border-violet-500/50 rounded-lg text-xs text-white placeholder-[#8d90a0]/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#8d90a0] font-mono mb-1 block">E-mail</label>
                    <input
                      type="email"
                      placeholder="email@exemplo.com"
                      value={editingContact.email || ''}
                      onChange={e => setEditingContact(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#1e1e24] border border-[#27272a] focus:border-violet-500/50 rounded-lg text-xs text-white placeholder-[#8d90a0]/50 outline-none"
                    />
                  </div>
                </div>
                {contactError && <p className="text-[10px] text-red-400">{contactError}</p>}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setShowSaveContactForm(false); setEditingContact(null); setContactError(''); }}
                    className="px-3 py-1.5 bg-[#27272a] text-[#8d90a0] text-xs font-semibold rounded-lg cursor-pointer"
                  >Cancelar</button>
                  <button
                    onClick={handleSaveContactForm}
                    className="px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                  >Salvar Contato</button>
                </div>
              </div>
            )}

            {/* Busca */}
            <div className="px-6 py-3 border-b border-[#27272a] shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8d90a0]" />
                <input
                  type="text"
                  placeholder="Buscar por nome, número ou empresa..."
                  value={contactSearch}
                  onChange={e => setContactSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 bg-[#141416] border border-[#27272a] rounded-xl text-xs text-white placeholder-[#8d90a0]/50 outline-none focus:border-violet-500/40 transition-all"
                />
              </div>
            </div>

            {/* Lista de Contatos */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#27272a]/60">
              {filteredContacts.length === 0 ? (
                <div className="py-16 text-center text-[#8d90a0] space-y-3">
                  <BookUser className="w-10 h-10 mx-auto text-[#8d90a0]/30" />
                  <p className="text-sm font-semibold text-white">
                    {contactSearch ? 'Nenhum contato encontrado' : 'Nenhum contato salvo'}
                  </p>
                  <p className="text-xs">
                    {contactSearch ? 'Tente outro termo de busca.' : 'Clique em "Novo Contato" para adicionar.'}
                  </p>
                </div>
              ) : filteredContacts.map(contact => (
                <div key={contact.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#1e1e24]/50 transition-colors group">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${avatarColor(contact.name)}`}>
                    {initials(contact.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-bold text-white truncate">{contact.name}</h4>
                      {contact.tags?.map(tag => (
                        <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-violet-500/15 text-violet-400 border border-violet-500/25 rounded font-mono">{tag}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[11px] text-[#45dfa4] font-mono">
                        <Phone className="w-3 h-3" />{contact.phone}
                      </span>
                      {contact.companyName && (
                        <span className="flex items-center gap-1 text-[11px] text-[#8d90a0] truncate">
                          <Building2 className="w-3 h-3 shrink-0" />{contact.companyName}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#8d90a0] mt-0.5 font-mono">
                      Último contato: {contact.lastContactAt} • {contact.totalAttendances} atendimentos
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => deleteContact(contact.id)}
                      className="p-1.5 bg-transparent hover:bg-red-500/10 text-transparent hover:text-red-400 rounded-lg transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                      title="Excluir contato"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleStartFromContact(contact)}
                      className="px-4 py-2 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-[#45dfa4]/10"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-gray-950" />Iniciar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
