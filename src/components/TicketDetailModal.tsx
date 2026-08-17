import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Ticket, TicketStatus, ServiceQueue, TicketAttachment } from '../types';
import { getOperatorsForQueue } from '../utils/queueUtils';
import { processFileAttachment } from '../utils/fileUtils';
import {
  X,
  User,
  Monitor,
  Calendar,
  Send,
  CheckCircle2,
  Clock,
  Paperclip,
  Shield,
  File,
  AlertCircle,
  MessageSquare,
  Sparkles,
  Users,
  Layers,
  Eye,
  Download,
  Image as ImageIcon
} from 'lucide-react';

export const TicketDetailModal: React.FC = () => {
  const {
    selectedTicket,
    setSelectedTicket,
    updateTicketStatus,
    reassignTicket,
    addTicketMessage,
    userSession,
    currentScreen,
    tickets,
    managedUsers
  } = useApp();

  const isTIUser =
    userSession.isAuthenticated &&
    userSession.role !== 'client' &&
    !['client_my_tickets', 'client_home', 'portal_landing', 'new_ticket'].includes(currentScreen);

  const [replyText, setReplyText] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<TicketAttachment[]>([]);
  const [showResolvePrompt, setShowResolvePrompt] = useState(false);
  const [resolveMessage, setResolveMessage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<{ name: string; url?: string; type?: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Derive the fresh, live ticket from tickets array by ID, falling back to selectedTicket
  const activeTicket = tickets.find((t) => t.id === selectedTicket?.id) || selectedTicket;

  // Auto scroll to bottom when messages update
  useEffect(() => {
    if (activeTicket?.messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTicket?.messages?.length]);

  if (!activeTicket) return null;

  const handleChatFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const processed = await Promise.all(
        Array.from(files).map((file: File) => processFileAttachment(file))
      );
      setReplyAttachments(prev => [...prev, ...processed]);
    } catch (err) {
      console.error('Error processing chat file upload:', err);
    }
    e.target.value = '';
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() && replyAttachments.length === 0) return;

    const text = replyText.trim();
    const atts = [...replyAttachments];
    setReplyText('');
    setReplyAttachments([]);

    addTicketMessage(
      activeTicket.id,
      text || (atts.length > 0 ? 'Print / Anexo enviado.' : ''),
      userSession.isAuthenticated ? 'ti' : 'client',
      atts.length > 0 ? atts : undefined
    );
  };

  const handleStatusChange = (newStatus: TicketStatus) => {
    if (activeTicket.status === newStatus) return;
    
    if (newStatus === 'Resolvido') {
      setShowResolvePrompt(true);
      setResolveMessage('');
    } else {
      updateTicketStatus(activeTicket.id, newStatus);
    }
  };

  const handleConfirmResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveMessage.trim()) return;

    updateTicketStatus(activeTicket.id, 'Resolvido', resolveMessage.trim());
    setShowResolvePrompt(false);
    setShowConfirmModal(true);
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'Novo':
        return 'bg-[#2563eb]/20 text-[#b4c5ff] border-[#2563eb]/40';
      case 'Em Atendimento':
        return 'bg-[#ffb95f]/20 text-[#ffb95f] border-[#ffb95f]/40';
      case 'Pendente':
        return 'bg-[#a855f7]/20 text-[#d8b4fe] border-[#a855f7]/40';
      case 'Resolvido':
        return 'bg-[#45dfa4]/20 text-[#45dfa4] border-[#45dfa4]/40';
      case 'Fechado':
        return 'bg-[#8d90a0]/20 text-[#c3c6d7] border-[#8d90a0]/40';
      default:
        return 'bg-[#2563eb]/20 text-[#b4c5ff] border-[#2563eb]/40';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#181c22] border border-[#2A2F3A] rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-[#111827] border-b border-[#2A2F3A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm font-mono font-bold text-[#45dfa4] bg-[#45dfa4]/10 border border-[#45dfa4]/30 px-2.5 py-1 rounded">
              {activeTicket.ticketNumber}
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                {activeTicket.title}
              </h3>
              <p className="text-xs text-[#8d90a0] mt-0.5">
                Aberto em {activeTicket.createdAt} • <span className="text-[#c3c6d7]">{activeTicket.category}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedTicket(null)}
            className="text-[#8d90a0] hover:text-white p-1.5 rounded-lg hover:bg-[#1f2630] transition-colors cursor-pointer"
            title="Fechar Detalhes"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Metadata Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#111827] p-3 rounded-xl border border-[#2A2F3A]">
              <span className="text-[10px] font-mono text-[#8d90a0] block uppercase">Solicitante</span>
              <span className="text-xs font-semibold text-white truncate block">{activeTicket.requesterName}</span>
              <span className="text-[10px] text-[#45dfa4] font-mono truncate block" title={activeTicket.requesterEmail || 'Não informado'}>
                {activeTicket.requesterEmail || 'E-mail não cadastrado'}
              </span>
            </div>

            <div className="bg-[#111827] p-3 rounded-xl border border-[#2A2F3A]">
              <span className="text-[10px] font-mono text-[#8d90a0] block uppercase">Empresa / Máquina</span>
              <span className="text-xs font-semibold text-white truncate block">{activeTicket.company}</span>
              <span className="text-[10px] text-[#45dfa4] font-mono truncate block">{activeTicket.machineName}</span>
            </div>

            <div className="bg-[#111827] p-3 rounded-xl border border-[#2A2F3A]">
              <span className="text-[10px] font-mono text-[#8d90a0] block uppercase">Prioridade</span>
              <span
                className={`inline-block text-[11px] font-mono font-bold px-2 py-0.5 rounded mt-1 border ${
                  activeTicket.priority === 'Crítica' || activeTicket.priority === 'Alta'
                    ? 'bg-[#93000a]/40 text-[#ffb4ab] border-[#ffb4ab]/30'
                    : 'bg-[#45dfa4]/20 text-[#45dfa4] border-[#45dfa4]/30'
                }`}
              >
                {activeTicket.priority}
              </span>
            </div>

            <div className="bg-[#111827] p-3 rounded-xl border border-[#2A2F3A]">
              <span className="text-[10px] font-mono text-[#8d90a0] block uppercase">Status Atual</span>
              <span
                className={`inline-block text-[11px] font-mono font-bold px-2.5 py-0.5 rounded mt-1 border ${getStatusBadge(
                  activeTicket.status
                )}`}
              >
                {activeTicket.status}
              </span>
            </div>
          </div>

          {/* Queue & Operator Re-assignment Card */}
          <div className="bg-[#111827] p-4 rounded-xl border border-[#2A2F3A] grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold text-[#8d90a0] uppercase flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#45dfa4]" />
                <span>Fila de Atendimento</span>
              </label>
              {isTIUser ? (
                <select
                  value={activeTicket.queue || 'N1'}
                  onChange={(e) => {
                    const newQ = e.target.value as ServiceQueue;
                    const validOps = getOperatorsForQueue(managedUsers, newQ);
                    const isOpValid = validOps.some((u) => u.name === activeTicket.assignedTo);
                    const newAssignedTo = isOpValid ? activeTicket.assignedTo : undefined;
                    reassignTicket(activeTicket.id, newQ, newAssignedTo);
                  }}
                  className="w-full bg-[#181c22] border border-[#2A2F3A] focus:border-[#45dfa4] text-white text-xs rounded-lg p-2.5 focus:outline-none cursor-pointer"
                >
                  <option value="N1">Fila N1 (Triagem & Nível 1)</option>
                  <option value="N2">Fila N2 (Nível 2)</option>
                  <option value="N3">Fila N3 (Nível 3 / Infra)</option>
                  <option value="ADM">Fila ADM (Administração)</option>
                </select>
              ) : (
                <div className="bg-[#181c22] border border-[#2A2F3A] rounded-lg p-2.5 text-xs text-white font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#45dfa4]"></span>
                  <span>
                    {activeTicket.queue === 'N1'
                      ? 'Fila N1 (Triagem & Nível 1)'
                      : activeTicket.queue === 'N2'
                      ? 'Fila N2 (Nível 2)'
                      : activeTicket.queue === 'N3'
                      ? 'Fila N3 (Nível 3 / Infra)'
                      : activeTicket.queue === 'ADM'
                      ? 'Fila ADM (Administração)'
                      : 'Fila N1 (Triagem & Nível 1)'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold text-[#8d90a0] uppercase flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#45dfa4]" />
                <span>Operador Responsável ({activeTicket.queue || 'N1'})</span>
              </label>
              {isTIUser ? (
                <select
                  value={activeTicket.assignedTo || ''}
                  onChange={(e) => {
                    const newOp = e.target.value;
                    reassignTicket(
                      activeTicket.id,
                      activeTicket.queue || 'N1',
                      newOp || undefined
                    );
                  }}
                  className="w-full bg-[#181c22] border border-[#2A2F3A] focus:border-[#45dfa4] text-white text-xs rounded-lg p-2.5 focus:outline-none cursor-pointer"
                >
                  <option value="">Sem Operador (Fila Geral)</option>
                  {getOperatorsForQueue(managedUsers, activeTicket.queue || 'N1').map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({u.role.toUpperCase()})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="bg-[#181c22] border border-[#2A2F3A] rounded-lg p-2.5 text-xs text-white font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#2563eb]"></span>
                  <span>{activeTicket.assignedTo || 'Sem Operador (Fila Geral)'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Ticket Description */}
          <div className="bg-[#111827] p-4 rounded-xl border border-[#2A2F3A]">
            <h4 className="text-xs font-mono font-bold text-[#8d90a0] uppercase mb-2">
              Descrição do Chamado
            </h4>
            <p className="text-xs sm:text-sm text-[#dfe2eb] whitespace-pre-wrap leading-relaxed">
              {activeTicket.description}
            </p>

            {/* Attachments if any */}
            {activeTicket.attachments && activeTicket.attachments.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[#2A2F3A]">
                <span className="text-xs font-mono text-[#8d90a0] block mb-2">
                  Arquivos Anexados ({activeTicket.attachments.length}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeTicket.attachments.map((att, i) => {
                    const isImg = att.type?.startsWith('image/') || att.url?.startsWith('data:image/') || att.name.match(/\.(png|jpe?g|gif|webp|bmp)$/i);
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-[#181c22] border border-[#2A2F3A] p-2.5 rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-2 text-white truncate mr-2">
                          {isImg ? (
                            <ImageIcon className="w-4 h-4 text-[#45dfa4] shrink-0" />
                          ) : (
                            <File className="w-4 h-4 text-blue-400 shrink-0" />
                          )}
                          <div className="truncate">
                            <div className="truncate font-medium">{att.name}</div>
                            <div className="text-[#8d90a0] font-mono text-[10px]">{att.size}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Visualizar Print Button */}
                          <button
                            type="button"
                            onClick={() => setPreviewAttachment(att)}
                            className="px-2.5 py-1 bg-[#45dfa4]/10 hover:bg-[#45dfa4]/30 text-[#45dfa4] border border-[#45dfa4]/40 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Visualizar Print/Imagem enviado"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Visualizar</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Status Updater (Novo, Em Atendimento, Pendente, Resolvido) - Exibido apenas para Técnicos TI */}
          {isTIUser && (
            <div className="p-3.5 bg-[#111827] rounded-xl border border-[#2A2F3A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#8d90a0] uppercase">
                  Alterar Status:
                </span>
                <span className="text-[11px] text-[#c3c6d7] font-mono hidden sm:inline">
                  (Clique para atualizar)
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {/* Novo Button */}
                <button
                  type="button"
                  id="btn-status-novo"
                  onClick={() => handleStatusChange('Novo')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    activeTicket.status === 'Novo'
                      ? 'bg-[#2563eb] text-white border-[#2563eb] shadow-md shadow-blue-500/20 font-bold'
                      : 'bg-[#181c22] text-[#c3c6d7] border-[#2A2F3A] hover:border-[#2563eb]/60 hover:text-white'
                  }`}
                >
                  Novo
                </button>

                {/* Em Atendimento Button */}
                <button
                  type="button"
                  id="btn-status-em-atendimento"
                  onClick={() => handleStatusChange('Em Atendimento')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    activeTicket.status === 'Em Atendimento'
                      ? 'bg-[#ffb95f] text-gray-950 font-bold border-[#ffb95f] shadow-md shadow-amber-500/20'
                      : 'bg-[#181c22] text-[#c3c6d7] border-[#2A2F3A] hover:border-[#ffb95f]/60 hover:text-white'
                  }`}
                >
                  Em Atendimento
                </button>

                {/* Pendente Button */}
                <button
                  type="button"
                  id="btn-status-pendente"
                  onClick={() => handleStatusChange('Pendente')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    activeTicket.status === 'Pendente'
                      ? 'bg-[#a855f7] text-white font-bold border-[#a855f7] shadow-md shadow-purple-500/20'
                      : 'bg-[#181c22] text-[#c3c6d7] border-[#2A2F3A] hover:border-[#a855f7]/60 hover:text-white'
                  }`}
                >
                  Pendente
                </button>

                {/* Resolvido Button */}
                <button
                  type="button"
                  id="btn-status-resolvido"
                  onClick={() => handleStatusChange('Resolvido')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    activeTicket.status === 'Resolvido'
                      ? 'bg-[#45dfa4] text-gray-950 font-bold border-[#45dfa4] shadow-md shadow-emerald-500/20'
                      : 'bg-[#181c22] text-[#c3c6d7] border-[#2A2F3A] hover:border-[#45dfa4]/60 hover:text-white'
                  }`}
                >
                  Resolvido
                </button>
              </div>
            </div>
          )}

          {/* Conversation History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold text-[#8d90a0] uppercase flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-[#45dfa4]" />
                <span>Histórico &amp; Interações ({activeTicket.messages.length})</span>
              </h4>
              <span className="text-[10px] text-[#8d90a0] font-mono">
                {activeTicket.updatedAt}
              </span>
            </div>

            <div className="space-y-3 bg-[#111827]/60 p-3 rounded-xl border border-[#2A2F3A]/70 max-h-72 overflow-y-auto">
              {activeTicket.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3.5 rounded-xl text-xs space-y-1.5 transition-all ${
                    msg.role === 'ti'
                      ? 'bg-[#45dfa4]/10 border border-[#45dfa4]/30 ml-4'
                      : 'bg-[#151c25] border border-[#2A2F3A] mr-4'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold ${
                          msg.role === 'ti' ? 'text-[#45dfa4]' : 'text-white'
                        }`}
                      >
                        {msg.sender}
                      </span>
                      {msg.role === 'ti' ? (
                        <span className="bg-[#45dfa4]/20 text-[#45dfa4] text-[9px] px-1.5 py-0.2 rounded font-mono font-bold">
                          Suporte TI
                        </span>
                      ) : (
                        <span className="bg-[#2e353f] text-[#c3c6d7] text-[9px] px-1.5 py-0.2 rounded font-mono">
                          Solicitante
                        </span>
                      )}
                    </div>
                    <span className="text-[#8d90a0] font-mono text-[10px]">{msg.timestamp}</span>
                  </div>
                  <p className="text-[#dfe2eb] leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                  {/* Render message attachments if present */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[#2A2F3A]/40 space-y-1.5">
                      <span className="text-[10px] text-[#8d90a0] font-mono block">Anexo(s) nesta mensagem:</span>
                      <div className="flex flex-wrap gap-2">
                        {msg.attachments.map((att: any, attIdx: number) => (
                          <button
                            key={attIdx}
                            type="button"
                            onClick={() => setPreviewAttachment(att)}
                            className="flex items-center gap-1.5 bg-[#181c22] hover:bg-[#252c38] border border-[#45dfa4]/30 text-[#45dfa4] text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span className="font-mono text-[11px] font-semibold truncate max-w-[150px]">{att.name}</span>
                            <Eye className="w-3 h-3 text-[#45dfa4] shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Modal Reply Footer */}
        <div className="bg-[#111827] border-t border-[#2A2F3A] p-3.5 sm:p-4 space-y-2">
          {/* Selected Chat Attachments Thumbnails */}
          {replyAttachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-1">
              {replyAttachments.map((att, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-[#181c22] border border-[#45dfa4]/40 text-[#45dfa4] text-xs px-2.5 py-1 rounded-lg">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[140px] font-mono text-[11px]">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => setReplyAttachments(prev => prev.filter((_, i) => i !== idx))}
                    className="hover:text-red-400 cursor-pointer ml-1"
                    title="Remover anexo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form
            onSubmit={handleSendMessage}
            className="flex gap-2 sm:gap-3 items-center"
          >
            {/* Paperclip Attachment Button */}
            <label
              className="p-3 bg-[#181c22] hover:bg-[#252b36] text-[#45dfa4] border border-[#2A2F3A] rounded-xl cursor-pointer transition-colors shrink-0 flex items-center justify-center"
              title="Anexar print ou arquivo no chamado"
            >
              <Paperclip className="w-4 h-4" />
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx,.txt"
                multiple
                onChange={handleChatFileUpload}
                className="hidden"
              />
            </label>

            <input
              id="ticket-reply-input"
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={
                userSession.isAuthenticated
                  ? 'Escreva uma resposta ou anexe um print...'
                  : 'Escreva um comentário ou anexe um print...'
              }
              className="flex-1 bg-[#181c22] border border-[#2A2F3A] focus:border-[#45dfa4] text-white text-xs rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#45dfa4]/30 transition-all placeholder:text-[#8d90a0]"
            />
            <button
              id="btn-send-ticket-reply"
              type="submit"
              disabled={!replyText.trim() && replyAttachments.length === 0}
              className="px-4 sm:px-5 py-3 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed shadow-md shadow-[#45dfa4]/10 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </form>
        </div>

        {/* Modal 1: Prompt de Mensagem de Resolução */}
        {showResolvePrompt && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#181c22] border border-[#2A2F3A] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-[#2A2F3A] pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#45dfa4]" />
                  <h3 className="text-base font-bold text-white">Finalizar Chamado {activeTicket.ticketNumber}</h3>
                </div>
                <button
                  onClick={() => setShowResolvePrompt(false)}
                  className="text-[#8d90a0] hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-[#c3c6d7]">
                Descreva a mensagem de resolução para o solicitante <strong className="text-white">{activeTicket.requesterName}</strong>:
              </p>

              <form onSubmit={handleConfirmResolve} className="space-y-4">
                <textarea
                  required
                  rows={4}
                  value={resolveMessage}
                  onChange={(e) => setResolveMessage(e.target.value)}
                  placeholder="Ex: Chamado finalizado. A configuração foi ajustada e testada com sucesso."
                  className="w-full bg-[#111827] border border-[#2A2F3A] focus:border-[#45dfa4] text-white text-xs rounded-xl p-3 focus:outline-none placeholder:text-[#8d90a0]"
                />

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#2A2F3A]">
                  <button
                    type="button"
                    onClick={() => setShowResolvePrompt(false)}
                    className="px-4 py-2 bg-[#2a2f3a] hover:bg-[#383d4a] text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!resolveMessage.trim()}
                    className="px-4 py-2 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-xs rounded-lg transition-colors disabled:opacity-40"
                  >
                    Confirmar e Finalizar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Confirmação na Tela */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#181c22] border border-[#45dfa4]/40 rounded-2xl max-w-md w-full p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-[#45dfa4]/20 text-[#45dfa4] flex items-center justify-center mx-auto border border-[#45dfa4]/40">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h3 className="text-lg font-bold text-white">Chamado Finalizado com Sucesso!</h3>
              
              <p className="text-xs text-[#c3c6d7] bg-[#111827] p-3 rounded-xl border border-[#2A2F3A] italic">
                "{resolveMessage}"
              </p>

              <p className="text-[11px] text-[#8d90a0]">
                O cliente pode visualizar o ticket como resolvido e ver sua mensagem na thread em tempo real.
              </p>

              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-full py-2.5 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-xs rounded-xl transition-colors shadow-lg shadow-[#45dfa4]/10 cursor-pointer"
              >
                OK, Entendi
              </button>
            </div>
          </div>
        )}

        {/* Modal 3: Visualização do Print / Imagem */}
        {previewAttachment && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <div className="bg-[#111622] border border-[#2A2F3A] rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
              {/* Header */}
              <div className="p-4 bg-[#181c22] border-b border-[#2A2F3A] flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm truncate">
                  <ImageIcon className="w-4 h-4 text-[#45dfa4] shrink-0" />
                  <span className="truncate">{previewAttachment.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  {previewAttachment.url && (
                    <a
                      href={previewAttachment.url}
                      download={previewAttachment.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-[#1f2632] hover:bg-[#2e3748] text-[#45dfa4] border border-[#45dfa4]/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  )}
                  <button
                    onClick={() => setPreviewAttachment(null)}
                    className="text-[#8d90a0] hover:text-white p-1.5 rounded-lg hover:bg-[#1f2632] transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Image Preview Box */}
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[#0d141d]">
                {previewAttachment.url ? (
                  <img
                    src={previewAttachment.url}
                    alt={previewAttachment.name}
                    className="max-w-full max-h-[75vh] object-contain rounded-lg border border-[#2A2F3A] shadow-lg"
                  />
                ) : (
                  <div className="text-center py-10 px-6 max-w-lg">
                    <div className="w-full bg-[#181c22] border border-[#2A2F3A] rounded-xl p-8 flex flex-col items-center justify-center gap-3">
                      <ImageIcon className="w-12 h-12 text-[#45dfa4] animate-pulse" />
                      <div>
                        <p className="text-sm font-bold text-white mb-1">
                          {previewAttachment.name}
                        </p>
                        <p className="text-xs text-[#8d90a0]">
                          Print/Imagem anexado pelo usuário.
                        </p>
                      </div>
                      <div className="bg-[#111827] border border-[#2A2F3A] px-4 py-3 rounded-lg text-xs font-mono text-[#45dfa4] w-full text-center mt-2">
                        📷 Imagem carregada e salva no chamado
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
