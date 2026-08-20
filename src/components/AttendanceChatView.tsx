import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  AttendanceConversation,
  AttendanceMessage,
  ConversationStatus,
  TicketPriority
} from '../types';
import {
  Search,
  Send,
  Paperclip,
  Smile,
  User,
  Phone,
  Building,
  Tag,
  Clock,
  CheckCheck,
  Bot,
  UserCheck,
  ArrowRightLeft,
  XCircle,
  Ticket as TicketIcon,
  Filter,
  Plus,
  MessageSquare,
  AlertCircle,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

export const AttendanceChatView: React.FC = () => {
  const {
    attendanceConversations,
    attendanceMessages,
    sendAttendanceMessage,
    assignConversation,
    transferConversation,
    closeConversation,
    toggleBotState,
    addTicket,
    userSession,
    attendanceQueues,
    userAccounts,
    setCurrentScreen
  } = useApp();

  const [selectedConvId, setSelectedConvId] = useState<string>(
    attendanceConversations[0]?.id || ''
  );
  const [filterTab, setFilterTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [targetQueueId, setTargetQueueId] = useState('');
  const [targetUserId, setTargetUserId] = useState('');

  const activeConv = attendanceConversations.find(c => c.id === selectedConvId);

  const activeMessages = activeConv
    ? attendanceMessages.filter(m => m.conversationId === activeConv.id)
    : [];

  const filteredConversations = attendanceConversations.filter(c => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = c.contactName.toLowerCase().includes(q);
      const matchPhone = c.contactPhone.toLowerCase().includes(q);
      if (!matchName && !matchPhone) return false;
    }

    if (filterTab === 'mine') {
      return c.assignedUserName === userSession.name;
    }
    if (filterTab === 'waiting') {
      return c.status === 'WAITING';
    }
    if (filterTab === 'in_progress') {
      return c.status === 'IN_PROGRESS';
    }
    if (filterTab === 'closed') {
      return c.status === 'CLOSED';
    }
    return true;
  });

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeConv) return;
    sendAttendanceMessage(activeConv.id, inputText.trim(), 'AGENT');
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAssignToMe = () => {
    if (!activeConv) return;
    assignConversation(activeConv.id, userSession.username || 'ti_user', userSession.name || 'Analista T.I.');
    sendAttendanceMessage(activeConv.id, `Olá! Meu nome é ${userSession.name || 'Analista T.I.'} e assumi seu atendimento. Como posso ajudar?`, 'AGENT');
  };

  const handleToggleBot = () => {
    if (!activeConv) return;
    toggleBotState(activeConv.id, !activeConv.botActive);
  };

  const handleClose = () => {
    if (!activeConv) return;
    sendAttendanceMessage(activeConv.id, 'Atendimento encerrado pelo analista. Obrigado pelo contato!', 'AGENT');
    closeConversation(activeConv.id);
    setSelectedConversationId(null);
  };

  const handleConfirmTransfer = () => {
    if (!activeConv) return;
    const targetQ = attendanceQueues.find(q => q.id === targetQueueId);
    const targetU = userAccounts.find(u => u.id === targetUserId);
    
    transferConversation(activeConv.id, targetQ?.id, targetQ?.name, targetU?.name);
    sendAttendanceMessage(
      activeConv.id,
      `Atendimento transferido para a fila: ${targetQ?.name || 'Geral'}${targetU ? ` (Analista: ${targetU.name})` : ''}`,
      'AGENT'
    );
    setShowTransferModal(false);
  };

  const handleCreateTicketFromChat = () => {
    if (!activeConv) return;
    const newT = addTicket({
      requesterName: activeConv.contactName,
      requesterEmail: `${activeConv.contactPhone.replace(/\D/g, '')}@whatsapp.com`,
      company: 'Empresa Corporativa',
      machineName: 'WhatsApp Contact',
      onlyMeOnComputer: true,
      category: 'Atendimento WhatsApp',
      subcategory: activeConv.queueName || 'Geral',
      priority: 'Média',
      title: `Atendimento WhatsApp: ${activeConv.contactName}`,
      description: `Ticket gerado a partir de conversa WhatsApp (${activeConv.contactPhone}). Última mensagem: ${activeConv.lastMessageText}`,
      attachments: []
    });
    alert(`Ticket ${newT.ticketNumber} criado com sucesso a partir desta conversa!`);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-[#18181b]">
      {/* Top Header Bar with Voltar Button */}
      <div className="p-3 bg-[#141416] border-b border-[#27272a] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentScreen('ti_dashboard')}
            className="p-1.5 bg-[#27272a] hover:bg-[#323238] text-white rounded-lg transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4 text-[#45dfa4]" />
            <span>Voltar ao Painel</span>
          </button>
          <div className="flex items-center gap-2 text-xs text-white font-bold">
            <MessageSquare className="w-4 h-4 text-[#45dfa4]" />
            <span>Central de Atendimento WhatsApp em Tempo Real</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#8d90a0]">
          <span className="w-2 h-2 rounded-full bg-[#45dfa4] animate-pulse" />
          <span className="font-mono text-[#45dfa4]">Servidor Ativo</span>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* COLUMN 1: Conversations & Filters List */}
        <div className="w-80 border-r border-[#27272a] bg-[#141416] flex flex-col shrink-0">
          {/* Header & Search */}
          <div className="p-3 border-b border-[#27272a] space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white text-xs uppercase tracking-wider font-mono">
                Conversas Ativas
              </h2>
              <span className="text-xs font-mono bg-[#45dfa4]/10 text-[#45dfa4] px-2 py-0.5 rounded-full border border-[#45dfa4]/30 font-bold">
                {filteredConversations.length}
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-[#8d90a0] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nome ou telefone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#1e1e24] border border-[#27272a] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#8d90a0] focus:outline-none focus:border-[#45dfa4]"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-[11px] font-mono">
              {[
                { id: 'all', label: 'Todas' },
                { id: 'mine', label: 'Minhas' },
                { id: 'waiting', label: 'Aguardando' },
                { id: 'in_progress', label: 'Em Atend.' },
                { id: 'closed', label: 'Encerradas' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id)}
                  className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    filterTab === tab.id
                      ? 'bg-[#45dfa4] text-gray-950 font-bold'
                      : 'bg-[#1e1e24] text-[#8d90a0] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#27272a]/50">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-[#8d90a0] text-xs font-mono space-y-2">
                <AlertCircle className="w-6 h-6 mx-auto text-[#8d90a0]/60" />
                <p>Nenhuma conversa encontrada</p>
              </div>
            ) : (
              filteredConversations.map(c => {
                const isSelected = c.id === selectedConvId;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedConvId(c.id)}
                    className={`p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#1e1e24] border-l-4 border-[#45dfa4]' : 'hover:bg-[#1a1a1e]'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-[#27272a] flex items-center justify-center font-bold text-sm text-[#45dfa4]">
                        {c.contactName.substring(0, 2).toUpperCase()}
                      </div>
                      {c.status === 'WAITING' && (
                        <span className="w-3 h-3 rounded-full bg-amber-400 border-2 border-[#141416] absolute -bottom-0.5 -right-0.5" />
                      )}
                      {c.status === 'IN_PROGRESS' && (
                        <span className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#141416] absolute -bottom-0.5 -right-0.5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-bold text-white truncate">{c.contactName}</h4>
                        <span className="text-[10px] text-[#8d90a0] font-mono">{c.lastMessageAt}</span>
                      </div>

                      <p className="text-xs text-[#8d90a0] truncate mb-1.5">{c.lastMessageText}</p>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#27272a] text-[#45dfa4] font-mono font-medium">
                          {c.queueName || 'Geral'}
                        </span>
                        {c.unreadCount > 0 && (
                          <span className="w-4 h-4 rounded-full bg-[#45dfa4] text-gray-950 text-[10px] font-bold flex items-center justify-center font-mono">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMN 2: Active Chat Feed Workspace */}
        <div className="flex-1 flex flex-col bg-[#18181b] min-w-0">
          {activeConv ? (
            <>
              {/* Active Conversation Header */}
              <div className="p-3 border-b border-[#27272a] bg-[#141416] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#45dfa4]/20 border border-[#45dfa4]/40 flex items-center justify-center font-bold text-xs text-[#45dfa4]">
                    {activeConv.contactName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-2">
                      {activeConv.contactName}
                      <span className="text-[11px] font-mono text-[#8d90a0] font-normal">
                        ({activeConv.contactPhone})
                      </span>
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-[#8d90a0]">
                      <span>Fila: <strong className="text-[#45dfa4] font-mono">{activeConv.queueName || 'Geral'}</strong></span>
                      <span>•</span>
                      <span>Atendente: <strong className="text-white">{activeConv.assignedUserName || 'Nenhum'}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  {activeConv.status === 'WAITING' || !activeConv.assignedUserName ? (
                    <button
                      onClick={handleAssignToMe}
                      className="px-3 py-1.5 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-[#45dfa4]/20"
                    >
                      <UserCheck className="w-4 h-4" />
                      Assumir Atendimento
                    </button>
                  ) : (
                    <button
                      onClick={handleToggleBot}
                      className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer font-bold ${
                        activeConv.botActive
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                          : 'bg-[#27272a] text-[#8d90a0] hover:text-white'
                      }`}
                    >
                      <Bot className="w-4 h-4" />
                      {activeConv.botActive ? 'Devolver p/ BOT' : 'Ativar BOT'}
                    </button>
                  )}

                  <button
                    onClick={() => setShowTransferModal(true)}
                    className="px-3 py-1.5 bg-[#27272a] hover:bg-[#323238] text-white text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ArrowRightLeft className="w-4 h-4 text-[#45dfa4]" />
                    Transferir
                  </button>

                  <button
                    onClick={handleCreateTicketFromChat}
                    className="px-3 py-1.5 bg-[#27272a] hover:bg-[#323238] text-white text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <TicketIcon className="w-4 h-4 text-[#45dfa4]" />
                    Criar Ticket
                  </button>

                  <button
                    onClick={handleClose}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    Encerrar Conversa
                  </button>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#18181b]">
                {activeMessages.map(msg => {
                  const isCustomer = msg.senderType === 'CUSTOMER';
                  const isBot = msg.senderType === 'BOT';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                    >
                      <div
                        className={`max-w-lg p-3 rounded-2xl text-xs space-y-1 ${
                          isCustomer
                            ? 'bg-[#1e1e24] text-white border border-[#27272a] rounded-tl-none'
                            : isBot
                            ? 'bg-purple-950/40 text-purple-200 border border-purple-500/30 rounded-tr-none'
                            : 'bg-[#45dfa4]/10 text-white border border-[#45dfa4]/30 rounded-tr-none'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 text-[10px] font-mono text-[#8d90a0] mb-0.5">
                          <span className="font-bold text-[#45dfa4]">
                            {msg.senderName} {isBot && '(Assistente Virtual)'}
                          </span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Composer */}
              <div className="p-3 border-t border-[#27272a] bg-[#141416]">
                <div className="flex items-end gap-2 bg-[#1e1e24] border border-[#27272a] rounded-xl p-2 focus-within:border-[#45dfa4]">
                  <textarea
                    rows={2}
                    placeholder="Digite sua mensagem (Enter para enviar)..."
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent text-xs text-white placeholder-[#8d90a0] resize-none focus:outline-none"
                  />

                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleSendMessage}
                      className="px-4 py-2 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 rounded-lg font-bold text-xs transition-all cursor-pointer shadow-md flex items-center gap-2"
                    >
                      <Send className="w-4 h-4 text-gray-950" />
                      Enviar
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[#8d90a0] space-y-3">
              <MessageSquare className="w-12 h-12 text-[#45dfa4]/40" />
              <h3 className="text-base font-bold text-white">Nenhuma Conversa Selecionada</h3>
              <p className="text-xs max-w-sm">
                Selecione uma conversa na lista à esquerda para atender o cliente via WhatsApp.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl max-w-md w-full p-6 space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-[#45dfa4]" />
              Transferir Atendimento
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#8d90a0] block mb-1">Selecionar Fila / Setor:</label>
                <select
                  value={targetQueueId}
                  onChange={e => setTargetQueueId(e.target.value)}
                  className="w-full bg-[#1e1e24] border border-[#27272a] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#45dfa4]"
                >
                  <option value="">-- Manter Fila Atual --</option>
                  {attendanceQueues.map(q => (
                    <option key={q.id} value={q.id}>{q.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-[#8d90a0] block mb-1">Selecionar Atendente Específico:</label>
                <select
                  value={targetUserId}
                  onChange={e => setTargetUserId(e.target.value)}
                  className="w-full bg-[#1e1e24] border border-[#27272a] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#45dfa4]"
                >
                  <option value="">-- Qualquer Atendente Disponível --</option>
                  {userAccounts.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#27272a]">
              <button
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 bg-[#27272a] hover:bg-[#323238] text-white text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmTransfer}
                className="px-4 py-2 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-xs rounded-xl cursor-pointer"
              >
                Confirmar Transferência
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
