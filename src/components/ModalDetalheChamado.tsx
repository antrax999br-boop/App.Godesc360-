import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { TicketStatus, ServiceQueue, TicketAttachment, TicketEvent } from '../types';
import { getOperatorsForQueue } from '../utils/queueUtils';
import { processFileAttachment } from '../utils/fileUtils';
import {
  X, User, Send, CheckCircle2, Clock, Paperclip, Shield,
  File, AlertCircle, MessageSquare, Layers, Eye,
  Download, Image as ImageIcon, ArrowRightLeft, Lock,
  UserCheck, Tag, Building2, Monitor, Plus, Info,
  Edit2, Save, ChevronDown, GitBranch, Activity,
  ArrowUpDown, UserPlus, UserMinus, FileText, Star
} from 'lucide-react';

export const TicketDetailModal: React.FC = () => {
  const {
    selectedTicket, setSelectedTicket, updateTicketStatus,
    reassignTicket, addTicketMessage, addTicketInternalNote,
    updateTicketFields, userSession, currentScreen, tickets,
    managedUsers, ticketCategories
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
  const [showQueueTransferModal, setShowQueueTransferModal] = useState(false);
  const [targetQueue, setTargetQueue] = useState<ServiceQueue>('N1');
  const [targetOperator, setTargetOperator] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [internalNoteText, setInternalNoteText] = useState('');
  const [internalNoteAttachments, setInternalNoteAttachments] = useState<TicketAttachment[]>([]);

  // Edição de campos
  const [isEditingFields, setIsEditingFields] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editSubcategory, setEditSubcategory] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editRequesterName, setEditRequesterName] = useState('');
  const [editRequesterEmail, setEditRequesterEmail] = useState('');
  const [editMachineName, setEditMachineName] = useState('');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const internalFileRef = useRef<HTMLInputElement | null>(null);
  const activeTicket = tickets.find(t => t.id === selectedTicket?.id) || selectedTicket;

  useEffect(() => {
    if (activeTicket?.messages) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTicket?.messages?.length]);

  useEffect(() => {
    if (showQueueTransferModal && activeTicket) {
      setTargetQueue(activeTicket.queue || 'N1');
      setTargetOperator(activeTicket.assignedTo || '');
      setTransferNote('');
    }
  }, [showQueueTransferModal]);

  useEffect(() => {
    if (isEditingFields && activeTicket) {
      setEditTitle(activeTicket.title || '');
      setEditCategory(activeTicket.category || '');
      setEditSubcategory(activeTicket.subcategory || '');
      setEditPriority(activeTicket.priority || 'Baixa');
      setEditCompany(activeTicket.company || '');
      setEditRequesterName(activeTicket.requesterName || '');
      setEditRequesterEmail(activeTicket.requesterEmail || '');
      setEditMachineName(activeTicket.machineName || '');
    }
  }, [isEditingFields]);

  if (!activeTicket) return null;

  const handleChatFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    try {
      const processed = await Promise.all(Array.from(files).map((f: File) => processFileAttachment(f)));
      setReplyAttachments(prev => [...prev, ...processed]);
    } catch (err) { console.error(err); }
    e.target.value = '';
  };

  const handleInternalFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    try {
      const processed = await Promise.all(Array.from(files).map((f: File) => processFileAttachment(f)));
      setInternalNoteAttachments(prev => [...prev, ...processed]);
    } catch (err) { console.error(err); }
    e.target.value = '';
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() && !replyAttachments.length) return;
    const text = replyText.trim();
    const atts = [...replyAttachments];
    setReplyText('');
    setReplyAttachments([]);
    addTicketMessage(activeTicket.id, text || (atts.length > 0 ? 'Print / Anexo enviado.' : ''), userSession.isAuthenticated ? 'ti' : 'client', atts.length > 0 ? atts : undefined);
  };

  const handleSendInternalNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalNoteText.trim() && !internalNoteAttachments.length) return;
    const text = internalNoteText.trim();
    const atts = [...internalNoteAttachments];
    setInternalNoteText('');
    setInternalNoteAttachments([]);
    addTicketInternalNote(activeTicket.id, text || (atts.length > 0 ? 'Print interno anexado.' : ''), atts.length > 0 ? atts : undefined);
  };

  const handleStatusChange = (newStatus: TicketStatus) => {
    if (activeTicket.status === newStatus) return;
    if (newStatus === 'Resolvido') { setShowResolvePrompt(true); setResolveMessage(''); }
    else updateTicketStatus(activeTicket.id, newStatus);
  };

  const handleConfirmResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveMessage.trim()) return;
    updateTicketStatus(activeTicket.id, 'Resolvido', resolveMessage.trim());
    setShowResolvePrompt(false);
    setShowConfirmModal(true);
  };

  const handleConfirmTransfer = () => {
    const validOps = getOperatorsForQueue(managedUsers, targetQueue);
    const finalOp = validOps.some(u => u.name === targetOperator) ? targetOperator : undefined;
    const noteText = transferNote.trim()
      ? `Chamado transferido para Fila ${targetQueue}${finalOp ? ' para ' + finalOp : ''}. ${transferNote.trim()}`
      : `Chamado transferido para Fila ${targetQueue}${finalOp ? ' para ' + finalOp : ''}.`;
    reassignTicket(activeTicket.id, targetQueue, finalOp, noteText);
    setShowQueueTransferModal(false);
  };

  const handleSaveFields = () => {
    const updates: any = {};
    if (editTitle !== activeTicket.title) updates.title = editTitle;
    if (editCategory !== activeTicket.category) updates.category = editCategory;
    if (editSubcategory !== activeTicket.subcategory) updates.subcategory = editSubcategory;
    if (editPriority !== activeTicket.priority) updates.priority = editPriority;
    if (editCompany !== activeTicket.company) updates.company = editCompany;
    if (editRequesterName !== activeTicket.requesterName) updates.requesterName = editRequesterName;
    if (editRequesterEmail !== activeTicket.requesterEmail) updates.requesterEmail = editRequesterEmail;
    if (editMachineName !== activeTicket.machineName) updates.machineName = editMachineName;
    if (Object.keys(updates).length > 0) {
      updateTicketFields(activeTicket.id, updates);
    }
    setIsEditingFields(false);
  };

  const statusBadge = (s: TicketStatus) => {
    if (s === 'Novo') return 'bg-[#2563eb]/20 text-[#b4c5ff] border-[#2563eb]/40';
    if (s === 'Em Atendimento') return 'bg-[#ffb95f]/20 text-[#ffb95f] border-[#ffb95f]/40';
    if (s === 'Pendente') return 'bg-[#a855f7]/20 text-[#d8b4fe] border-[#a855f7]/40';
    if (s === 'Resolvido') return 'bg-[#45dfa4]/20 text-[#45dfa4] border-[#45dfa4]/40';
    return 'bg-[#8d90a0]/20 text-[#c3c6d7] border-[#8d90a0]/40';
  };

  const prioBadge = (p: string) => {
    if (p === 'Critica' || p === 'Alta' || p === 'Cr\u00edtica') return 'bg-red-900/40 text-red-300 border-red-500/40';
    if (p === 'Media' || p === 'M\u00e9dia') return 'bg-yellow-900/30 text-yellow-300 border-yellow-500/40';
    return 'bg-emerald-900/30 text-emerald-300 border-emerald-500/40';
  };

  const qLabel = (q?: ServiceQueue) => {
    if (q === 'N2') return 'N2 - Nivel 2';
    if (q === 'N3') return 'N3 - Nivel 3 / Infra';
    if (q === 'ADM') return 'ADM - Administracao';
    return 'N1 - Triagem / Nivel 1';
  };

  const qDot = (q?: ServiceQueue) => {
    if (q === 'N2') return 'bg-amber-400';
    if (q === 'N3') return 'bg-purple-400';
    if (q === 'ADM') return 'bg-emerald-400';
    return 'bg-blue-400';
  };

  const qText = (q?: ServiceQueue) => {
    if (q === 'N2') return 'text-amber-400';
    if (q === 'N3') return 'text-purple-400';
    if (q === 'ADM') return 'text-emerald-400';
    return 'text-blue-400';
  };

  const eventIcon = (ev: TicketEvent) => {
    switch (ev.type) {
      case 'CREATED': return <Star className="w-3.5 h-3.5 text-[#45dfa4]" />;
      case 'STATUS_CHANGED': return <Activity className="w-3.5 h-3.5 text-[#ffb95f]" />;
      case 'TRANSFERRED': return <ArrowRightLeft className="w-3.5 h-3.5 text-[#a78bfa]" />;
      case 'ASSIGNED': return <UserPlus className="w-3.5 h-3.5 text-[#60a5fa]" />;
      case 'UNASSIGNED': return <UserMinus className="w-3.5 h-3.5 text-[#f87171]" />;
      case 'FIELD_CHANGED': return <Edit2 className="w-3.5 h-3.5 text-[#34d399]" />;
      case 'NOTE_ADDED': return <FileText className="w-3.5 h-3.5 text-[#c4b5fd]" />;
      default: return <Activity className="w-3.5 h-3.5 text-[#8d90a0]" />;
    }
  };

  const eventDotColor = (ev: TicketEvent) => {
    switch (ev.type) {
      case 'CREATED': return 'bg-[#45dfa4]';
      case 'STATUS_CHANGED': return 'bg-[#ffb95f]';
      case 'TRANSFERRED': return 'bg-[#a78bfa]';
      case 'ASSIGNED': return 'bg-[#60a5fa]';
      case 'UNASSIGNED': return 'bg-[#f87171]';
      case 'FIELD_CHANGED': return 'bg-[#34d399]';
      case 'NOTE_ADDED': return 'bg-[#c4b5fd]';
      default: return 'bg-[#8d90a0]';
    }
  };

  const tiNotes = activeTicket.tiInternalNotes || [];
  const events = activeTicket.events || [];
  const subcategories = ticketCategories?.find(c => c.name === editCategory)?.subcategories || [];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div id="modal-detalhe-chamado" className="modal-detalhe-chamado-root bg-[#0f1318] border border-[#1e2430] rounded-2xl w-full max-w-6xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#111827] border-b border-[#1e2430] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs font-mono font-bold text-[#45dfa4] bg-[#45dfa4]/10 border border-[#45dfa4]/30 px-2.5 py-1 rounded-lg shrink-0">
              {activeTicket.ticketNumber}
            </span>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight truncate max-w-[440px]">
                {activeTicket.title}
              </h2>
              <p className="text-[11px] text-[#8d90a0] mt-0.5">
                Aberto em <span className="text-[#c3c6d7]">{activeTicket.createdAt}</span>
                {' - '}<span className="text-[#45dfa4]">{activeTicket.category}</span>
                {activeTicket.subcategory && <span className="text-[#8d90a0]"> / {activeTicket.subcategory}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`hidden sm:inline-block text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border ${statusBadge(activeTicket.status)}`}>
              {activeTicket.status}
            </span>
            {isTIUser && (
              <button id="btn-transfer-queue" type="button" onClick={() => setShowQueueTransferModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7c3aed]/20 hover:bg-[#7c3aed]/40 text-[#c4b5fd] border border-[#7c3aed]/50 rounded-lg text-xs font-semibold transition-all cursor-pointer">
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Transferir Fila</span>
              </button>
            )}
            <button onClick={() => setSelectedTicket(null)}
              className="text-[#8d90a0] hover:text-white p-1.5 rounded-lg hover:bg-[#1f2630] transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* LEFT COLUMN */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">

              {/* Descricao */}
              <div className="bg-[#111827] rounded-xl border border-[#1e2430] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2430] bg-[#0f1318]">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-[#45dfa4]" />
                    <h4 className="text-xs font-mono font-bold text-[#8d90a0] uppercase">Descricao do Problema</h4>
                  </div>
                  {isTIUser && !isEditingFields && (
                    <button type="button" id="btn-edit-ticket-fields" onClick={() => setIsEditingFields(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1f2630] hover:bg-[#252c38] text-[#8d90a0] hover:text-[#45dfa4] border border-[#2A2F3A] hover:border-[#45dfa4]/40 rounded-lg text-[11px] font-semibold transition-all cursor-pointer">
                      <Edit2 className="w-3 h-3" /> Editar Campos
                    </button>
                  )}
                  {isTIUser && isEditingFields && (
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => setIsEditingFields(false)}
                        className="px-2.5 py-1 bg-[#2a2f3a] hover:bg-[#383d4a] text-white text-[11px] font-semibold rounded-lg transition-colors cursor-pointer">
                        Cancelar
                      </button>
                      <button type="button" id="btn-save-ticket-fields" onClick={handleSaveFields}
                        className="flex items-center gap-1 px-2.5 py-1 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 text-[11px] font-bold rounded-lg transition-colors cursor-pointer">
                        <Save className="w-3 h-3" /> Salvar
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-4">
                  {isEditingFields ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-mono text-[#8d90a0] uppercase block mb-1">Titulo do Chamado</label>
                        <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                          className="w-full bg-[#181c22] border border-[#2A2F3A] focus:border-[#45dfa4] text-white text-xs rounded-lg px-3 py-2 focus:outline-none transition-all" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-mono text-[#8d90a0] uppercase block mb-1">Categoria</label>
                          <select value={editCategory} onChange={e => { setEditCategory(e.target.value); setEditSubcategory(''); }}
                            className="w-full bg-[#181c22] border border-[#2A2F3A] focus:border-[#45dfa4] text-white text-xs rounded-lg px-3 py-2 focus:outline-none cursor-pointer">
                            {ticketCategories?.map(c => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-mono text-[#8d90a0] uppercase block mb-1">Subcategoria</label>
                          <select value={editSubcategory} onChange={e => setEditSubcategory(e.target.value)}
                            className="w-full bg-[#181c22] border border-[#2A2F3A] focus:border-[#45dfa4] text-white text-xs rounded-lg px-3 py-2 focus:outline-none cursor-pointer">
                            <option value="">Selecione...</option>
                            {subcategories.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-mono text-[#8d90a0] uppercase block mb-1">Prioridade</label>
                          <select value={editPriority} onChange={e => setEditPriority(e.target.value)}
                            className="w-full bg-[#181c22] border border-[#2A2F3A] focus:border-[#45dfa4] text-white text-xs rounded-lg px-3 py-2 focus:outline-none cursor-pointer">
                            <option value="Baixa">Baixa</option>
                            <option value="M\u00e9dia">Media</option>
                            <option value="Alta">Alta</option>
                            <option value="Cr\u00edtica">Critica</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-mono text-[#8d90a0] uppercase block mb-1">Empresa</label>
                          <input type="text" value={editCompany} onChange={e => setEditCompany(e.target.value)}
                            className="w-full bg-[#181c22] border border-[#2A2F3A] focus:border-[#45dfa4] text-white text-xs rounded-lg px-3 py-2 focus:outline-none transition-all" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-mono text-[#8d90a0] uppercase block mb-1">Nome do Solicitante</label>
                          <input type="text" value={editRequesterName} onChange={e => setEditRequesterName(e.target.value)}
                            className="w-full bg-[#181c22] border border-[#2A2F3A] focus:border-[#45dfa4] text-white text-xs rounded-lg px-3 py-2 focus:outline-none transition-all" />
                        </div>
                        <div>
                          <label className="text-[10px] font-mono text-[#8d90a0] uppercase block mb-1">E-mail do Solicitante</label>
                          <input type="email" value={editRequesterEmail} onChange={e => setEditRequesterEmail(e.target.value)}
                            className="w-full bg-[#181c22] border border-[#2A2F3A] focus:border-[#45dfa4] text-white text-xs rounded-lg px-3 py-2 focus:outline-none transition-all" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-[#8d90a0] uppercase block mb-1">Nome da Maquina</label>
                        <input type="text" value={editMachineName} onChange={e => setEditMachineName(e.target.value)}
                          className="w-full bg-[#181c22] border border-[#2A2F3A] focus:border-[#45dfa4] text-white text-xs rounded-lg px-3 py-2 focus:outline-none transition-all" />
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-[#dfe2eb] whitespace-pre-wrap leading-relaxed">{activeTicket.description}</p>
                  )}
                  {activeTicket.attachments && activeTicket.attachments.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-[#1e2430]">
                      <span className="text-[10px] font-mono text-[#8d90a0] block mb-2 uppercase">Arquivos ({activeTicket.attachments.length}):</span>
                      <div className="flex flex-wrap gap-2">
                        {activeTicket.attachments.map((att, i) => (
                          <button key={i} type="button" onClick={() => setPreviewAttachment(att)}
                            className="flex items-center gap-1.5 bg-[#181c22] hover:bg-[#252c38] border border-[#45dfa4]/30 text-[#45dfa4] text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer">
                            {att.type?.startsWith('image/') ? <ImageIcon className="w-3.5 h-3.5" /> : <File className="w-3.5 h-3.5" />}
                            <span className="font-mono text-[11px] truncate max-w-[150px]">{att.name}</span>
                            <Eye className="w-3 h-3 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* TIMELINE DE EVENTOS (Tarefas) */}
              <div className="bg-[#111827] rounded-xl border border-[#1e2430] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2430] bg-[#0f1318]">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-3.5 h-3.5 text-[#45dfa4]" />
                    <h4 className="text-xs font-mono font-bold text-[#8d90a0] uppercase">Timeline do Chamado</h4>
                    {events.length > 0 && (
                      <span className="bg-[#45dfa4]/15 text-[#45dfa4] text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-[#45dfa4]/30">{events.length} evento{events.length !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#8d90a0]">Historico de movimentos do chamado</span>
                </div>
                <div className="p-3 max-h-64 overflow-y-auto">
                  {events.length === 0 ? (
                    <div className="text-center py-6 text-[#8d90a0]">
                      <GitBranch className="w-7 h-7 mx-auto mb-2 opacity-25" />
                      <p className="text-xs">Nenhum evento registrado ainda.</p>
                      <p className="text-[11px] opacity-60 mt-0.5">Os movimentos do chamado aparecerao aqui.</p>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-[15px] top-3 bottom-3 w-px bg-[#2A2F3A]" />
                      <div className="space-y-0">
                        {events.map((ev, idx) => (
                          <div key={ev.id} className="flex gap-3 pb-3 last:pb-0 relative">
                            <div className={`w-[30px] flex-shrink-0 flex items-start justify-center pt-0.5`}>
                              <div className={`w-6 h-6 rounded-full border-2 border-[#0f1318] flex items-center justify-center z-10 relative ${eventDotColor(ev)}/20 border-${eventDotColor(ev)}/60`}>
                                {eventIcon(ev)}
                              </div>
                            </div>
                            <div className="flex-1 bg-[#0f1318] border border-[#1e2430] rounded-xl p-2.5 hover:border-[#2A2F3A] transition-colors">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[11px] font-semibold text-[#c3c6d7]">{ev.actorName}</span>
                                <span className="text-[10px] text-[#8d90a0] font-mono">{ev.timestamp}</span>
                              </div>
                              <p className="text-[11px] text-[#8d90a0] leading-relaxed">{ev.description}</p>
                              {(ev.oldValue || ev.newValue) && ev.type === 'FIELD_CHANGED' && (
                                <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono">
                                  <span className="bg-red-900/30 text-red-300 px-1.5 py-0.5 rounded line-through">{ev.oldValue}</span>
                                  <span className="text-[#8d90a0]">→</span>
                                  <span className="bg-emerald-900/30 text-emerald-300 px-1.5 py-0.5 rounded">{ev.newValue}</span>
                                </div>
                              )}
                              {(ev.oldValue || ev.newValue) && ev.type !== 'FIELD_CHANGED' && ev.type !== 'CREATED' && (
                                <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono">
                                  <span className="bg-[#1e2430] text-[#8d90a0] px-1.5 py-0.5 rounded">{ev.oldValue}</span>
                                  <ArrowRightLeft className="w-3 h-3 text-[#8d90a0]" />
                                  <span className="bg-[#45dfa4]/10 text-[#45dfa4] px-1.5 py-0.5 rounded font-bold">{ev.newValue}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* NOTAS INTERNAS TI */}
              {isTIUser && (
                <div className="bg-[#0d1117] rounded-xl border border-[#7c3aed]/40 overflow-hidden shadow-lg shadow-purple-900/10">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#7c3aed]/30 bg-[#0a0d13]">
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-[#a78bfa]" />
                      <h4 className="text-xs font-mono font-bold text-[#a78bfa] uppercase">Notas Internas T.I.</h4>
                      <span className="bg-[#7c3aed]/20 text-[#c4b5fd] text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-[#7c3aed]/40">APENAS TI</span>
                    </div>
                    <span className="text-[10px] text-[#8d90a0]">Nao gera e-mail - Nao visivel ao cliente</span>
                  </div>
                  <div className="max-h-52 overflow-y-auto p-3 space-y-2">
                    {tiNotes.length === 0 ? (
                      <div className="text-center py-5 text-[#8d90a0]">
                        <Shield className="w-7 h-7 mx-auto mb-2 opacity-25 text-[#a78bfa]" />
                        <p className="text-xs">Nenhuma nota interna adicionada ainda.</p>
                        <p className="text-[11px] opacity-60 mt-0.5">Visivel apenas para a equipe de T.I.</p>
                      </div>
                    ) : tiNotes.map(note => (
                      <div key={note.id} className="bg-[#13102a] border border-[#7c3aed]/30 rounded-xl p-3 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#c4b5fd]">{note.authorName}</span>
                            <span className="bg-[#7c3aed]/20 text-[#a78bfa] text-[9px] px-1.5 rounded font-mono font-bold uppercase">{note.authorRole}</span>
                          </div>
                          <span className="text-[#8d90a0] font-mono text-[10px]">{note.timestamp}</span>
                        </div>
                        <p className="text-[#dfe2eb] leading-relaxed whitespace-pre-wrap">{note.text}</p>
                        {note.attachments && note.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-[#7c3aed]/20">
                            {note.attachments.map((att, ai) => (
                              <button key={ai} type="button" onClick={() => setPreviewAttachment(att)}
                                className="flex items-center gap-1.5 bg-[#1a1030] hover:bg-[#221540] border border-[#7c3aed]/40 text-[#c4b5fd] text-[11px] px-2 py-1 rounded-lg transition-colors cursor-pointer">
                                <ImageIcon className="w-3 h-3" />
                                <span className="font-mono truncate max-w-[120px]">{att.name}</span>
                                <Eye className="w-3 h-3 shrink-0" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-[#7c3aed]/20 p-3 space-y-2 bg-[#0a0d13]">
                    {internalNoteAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {internalNoteAttachments.map((att, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 bg-[#13102a] border border-[#7c3aed]/40 text-[#a78bfa] text-xs px-2 py-0.5 rounded-lg">
                            <ImageIcon className="w-3 h-3" />
                            <span className="truncate max-w-[120px] font-mono text-[11px]">{att.name}</span>
                            <button type="button" onClick={() => setInternalNoteAttachments(prev => prev.filter((_, i) => i !== idx))} className="hover:text-red-400 cursor-pointer ml-0.5">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <form onSubmit={handleSendInternalNote} className="flex gap-2 items-center">
                      <label className="p-2.5 bg-[#13102a] hover:bg-[#1a1535] text-[#a78bfa] border border-[#7c3aed]/40 rounded-lg cursor-pointer transition-colors shrink-0">
                        <Paperclip className="w-3.5 h-3.5" />
                        <input type="file" accept="image/*,.pdf,.doc,.docx,.txt" multiple onChange={handleInternalFile} className="hidden" ref={internalFileRef} />
                      </label>
                      <input type="text" value={internalNoteText} onChange={e => setInternalNoteText(e.target.value)}
                        placeholder="Nota interna (diagnostico, observacao tecnica, print...)"
                        className="flex-1 bg-[#13102a] border border-[#7c3aed]/30 focus:border-[#a78bfa] text-white text-xs rounded-lg px-3 py-2.5 focus:outline-none transition-all placeholder:text-[#6b5e8a]" />
                      <button id="btn-send-internal-note" type="submit" disabled={!internalNoteText.trim() && internalNoteAttachments.length === 0}
                        className="px-3.5 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed shrink-0">
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Salvar</span>
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Status buttons */}
              {isTIUser && (
                <div className="bg-[#111827] rounded-xl border border-[#1e2430] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-[#45dfa4]" />
                    <span className="text-xs font-mono font-bold text-[#8d90a0] uppercase">Status do Chamado</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['Novo', 'Em Atendimento', 'Pendente', 'Resolvido'] as TicketStatus[]).map(s => (
                      <button key={s} type="button" id={`btn-status-${s.toLowerCase().replace(/ /g, '-')}`} onClick={() => handleStatusChange(s)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${activeTicket.status === s
                          ? s === 'Novo' ? 'bg-[#2563eb] text-white border-[#2563eb] shadow-md shadow-blue-500/20'
                            : s === 'Em Atendimento' ? 'bg-[#ffb95f] text-gray-950 border-[#ffb95f] shadow-md shadow-amber-500/20'
                            : s === 'Pendente' ? 'bg-[#a855f7] text-white border-[#a855f7] shadow-md shadow-purple-500/20'
                            : 'bg-[#45dfa4] text-gray-950 border-[#45dfa4] shadow-md shadow-emerald-500/20'
                          : 'bg-[#181c22] text-[#c3c6d7] border-[#2A2F3A] hover:border-[#45dfa4]/60 hover:text-white'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Historico */}
              <div className="bg-[#111827] rounded-xl border border-[#1e2430] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2430] bg-[#0f1318]">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-[#45dfa4]" />
                    <h4 className="text-xs font-mono font-bold text-[#8d90a0] uppercase">Historico de Atividades ({activeTicket.messages.length})</h4>
                  </div>
                  <span className="text-[10px] text-[#8d90a0] font-mono">{activeTicket.updatedAt}</span>
                </div>
                <div className="max-h-80 overflow-y-auto p-3 space-y-2.5">
                  {activeTicket.messages.length === 0 ? (
                    <div className="text-center py-8 text-[#8d90a0]">
                      <MessageSquare className="w-7 h-7 mx-auto mb-2 opacity-25" />
                      <p className="text-xs">Nenhuma mensagem ainda.</p>
                    </div>
                  ) : activeTicket.messages.map(msg => (
                    <div key={msg.id} className={`p-3.5 rounded-xl text-xs space-y-1.5 ${msg.role === 'system'
                      ? 'bg-[#1a1e28] border border-[#2A2F3A]/60 border-dashed text-center'
                      : msg.role === 'ti'
                      ? 'bg-[#45dfa4]/5 border border-[#45dfa4]/25 ml-6'
                      : 'bg-[#151c25] border border-[#2A2F3A] mr-6'}`}>
                      {msg.role === 'system' ? (
                        <p className="text-[#8d90a0] text-[11px] font-mono">{msg.text}</p>
                      ) : (
                        <>
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${msg.role === 'ti' ? 'text-[#45dfa4]' : 'text-white'}`}>{msg.sender}</span>
                              {msg.role === 'ti'
                                ? <span className="bg-[#45dfa4]/20 text-[#45dfa4] text-[9px] px-1.5 rounded font-mono font-bold">Suporte TI</span>
                                : <span className="bg-[#2e353f] text-[#c3c6d7] text-[9px] px-1.5 rounded font-mono">Solicitante</span>
                              }
                            </div>
                            <span className="text-[#8d90a0] font-mono text-[10px]">{msg.timestamp}</span>
                          </div>
                          <p className="text-[#dfe2eb] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1.5 border-t border-[#2A2F3A]/40">
                              {msg.attachments.map((att: any, ai: number) => (
                                <button key={ai} type="button" onClick={() => setPreviewAttachment(att)}
                                  className="flex items-center gap-1.5 bg-[#181c22] hover:bg-[#252c38] border border-[#45dfa4]/30 text-[#45dfa4] text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer">
                                  <ImageIcon className="w-3.5 h-3.5" />
                                  <span className="font-mono text-[11px] font-semibold truncate max-w-[150px]">{att.name}</span>
                                  <Eye className="w-3 h-3 shrink-0" />
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

            {/* Reply Footer */}
            <div className="bg-[#111827] border-t border-[#1e2430] p-3 sm:p-4 space-y-2 shrink-0">
              {replyAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-1">
                  {replyAttachments.map((att, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-[#181c22] border border-[#45dfa4]/40 text-[#45dfa4] text-xs px-2.5 py-1 rounded-lg">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[140px] font-mono text-[11px]">{att.name}</span>
                      <button type="button" onClick={() => setReplyAttachments(prev => prev.filter((_, i) => i !== idx))} className="hover:text-red-400 cursor-pointer ml-1">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3 items-center">
                <label className="p-3 bg-[#181c22] hover:bg-[#252b36] text-[#45dfa4] border border-[#2A2F3A] rounded-xl cursor-pointer transition-colors shrink-0">
                  <Paperclip className="w-4 h-4" />
                  <input type="file" accept="image/*,.pdf,.doc,.docx,.txt" multiple onChange={handleChatFile} className="hidden" />
                </label>
                <input id="ticket-reply-input" type="text" value={replyText} onChange={e => setReplyText(e.target.value)}
                  placeholder={userSession.isAuthenticated ? 'Escreva uma resposta ou anexe um print...' : 'Escreva um comentario ou anexe um print...'}
                  className="flex-1 bg-[#181c22] border border-[#2A2F3A] focus:border-[#45dfa4] text-white text-xs rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#45dfa4]/30 transition-all placeholder:text-[#8d90a0]" />
                <button id="btn-send-ticket-reply" type="submit" disabled={!replyText.trim() && replyAttachments.length === 0}
                  className="px-4 sm:px-5 py-3 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed shadow-md shadow-[#45dfa4]/10 shrink-0">
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Enviar</span>
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="hidden lg:flex flex-col w-72 xl:w-80 border-l border-[#1e2430] bg-[#0f1318] overflow-y-auto">
            <div className="px-4 py-3 border-b border-[#1e2430] bg-[#111827]">
              <h3 className="text-xs font-mono font-bold text-[#8d90a0] uppercase flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-[#45dfa4]" /> Informacoes do Chamado
              </h3>
            </div>
            <div className="p-4 space-y-4 text-xs">
              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[#8d90a0] font-mono uppercase text-[10px]">SLA de Resposta</span>
                    <span className="text-[#45dfa4] font-mono text-[10px]">Tempo restante: 1h 11m</span>
                  </div>
                  <div className="h-1.5 bg-[#1e2430] rounded-full overflow-hidden">
                    <div className="h-full bg-[#45dfa4] rounded-full" style={{ width: '45%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[#8d90a0] font-mono uppercase text-[10px]">SLA de Solucao</span>
                    <span className="text-[#ffb95f] font-mono text-[10px]">Tempo restante: 5h 33m</span>
                  </div>
                  <div className="h-1.5 bg-[#1e2430] rounded-full overflow-hidden">
                    <div className="h-full bg-[#ffb95f] rounded-full" style={{ width: '72%' }} />
                  </div>
                </div>
              </div>
              <div className="border-t border-[#1e2430]" />
              <div>
                <p className="text-[#8d90a0] font-mono uppercase text-[10px] mb-2">Origem do Chamado</p>
                <div className="bg-[#111827] rounded-lg p-2.5 space-y-2 border border-[#1e2430]">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-[#45dfa4] shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{activeTicket.requesterName}</p>
                      <p className="text-[10px] text-[#45dfa4] font-mono truncate">{activeTicket.requesterEmail || 'E-mail nao informado'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-[#8d90a0] shrink-0" />
                    <p className="text-white truncate">{activeTicket.company}</p>
                  </div>
                  {activeTicket.machineName && (
                    <div className="flex items-center gap-2">
                      <Monitor className="w-3.5 h-3.5 text-[#8d90a0] shrink-0" />
                      <p className="text-[#c3c6d7] truncate font-mono text-[11px]">{activeTicket.machineName}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#111827] rounded-lg p-2.5 border border-[#1e2430]">
                  <p className="text-[#8d90a0] font-mono uppercase text-[10px] mb-1.5">Prioridade</p>
                  <span className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${prioBadge(activeTicket.priority)}`}>{activeTicket.priority}</span>
                </div>
                <div className="bg-[#111827] rounded-lg p-2.5 border border-[#1e2430]">
                  <p className="text-[#8d90a0] font-mono uppercase text-[10px] mb-1.5">Status</p>
                  <span className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${statusBadge(activeTicket.status)}`}>{activeTicket.status}</span>
                </div>
              </div>
              <div className="border-t border-[#1e2430]" />
              <div>
                <p className="text-[#8d90a0] font-mono uppercase text-[10px] mb-2 flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-[#45dfa4]" /> Fila / Responsavel
                </p>
                {isTIUser ? (
                  <div className="space-y-2">
                    <select value={activeTicket.queue || 'N1'} onChange={e => {
                        const newQ = e.target.value as ServiceQueue;
                        const ops = getOperatorsForQueue(managedUsers, newQ);
                        const valid = ops.some(u => u.name === activeTicket.assignedTo);
                        reassignTicket(activeTicket.id, newQ, valid ? activeTicket.assignedTo : undefined);
                      }} className="w-full bg-[#181c22] border border-[#2A2F3A] focus:border-[#45dfa4] text-white text-xs rounded-lg p-2 focus:outline-none cursor-pointer">
                      <option value="N1">Fila N1 (Triagem e Nivel 1)</option>
                      <option value="N2">Fila N2 (Nivel 2)</option>
                      <option value="N3">Fila N3 (Nivel 3 / Infra)</option>
                      <option value="ADM">Fila ADM (Administracao)</option>
                    </select>
                    <select value={activeTicket.assignedTo || ''} onChange={e => reassignTicket(activeTicket.id, activeTicket.queue || 'N1', e.target.value || undefined)}
                      className="w-full bg-[#181c22] border border-[#2A2F3A] focus:border-[#45dfa4] text-white text-xs rounded-lg p-2 focus:outline-none cursor-pointer">
                      <option value="">Sem Operador (Fila Geral)</option>
                      {getOperatorsForQueue(managedUsers, activeTicket.queue || 'N1').map(u => (
                        <option key={u.id} value={u.name}>{u.name} ({u.role.toUpperCase()})</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="bg-[#111827] rounded-lg p-2.5 space-y-1.5 border border-[#1e2430]">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${qDot(activeTicket.queue)}`} />
                      <span className="text-white font-semibold">{qLabel(activeTicket.queue)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-[#8d90a0] shrink-0" />
                      <span className="text-[#c3c6d7]">{activeTicket.assignedTo || 'Sem Operador (Fila Geral)'}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-[#111827] rounded-lg p-3 border border-[#2A2F3A]">
                <p className="text-[#8d90a0] font-mono uppercase text-[10px] mb-2 flex items-center gap-1.5">
                  <UserCheck className="w-3 h-3 text-[#45dfa4]" /> Em Posse De
                </p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#45dfa4] to-[#2563eb] flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-xs truncate">{activeTicket.assignedTo || 'Fila Geral (sem atribuicao)'}</p>
                    {activeTicket.assignedTo && (
                      <p className={`text-[10px] font-mono ${qText(activeTicket.queue)}`}>{qLabel(activeTicket.queue)}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="border-t border-[#1e2430]" />
              <div>
                <p className="text-[#8d90a0] font-mono uppercase text-[10px] mb-2">Destino do Chamado</p>
                <div className="bg-[#111827] rounded-lg p-2.5 space-y-1.5 border border-[#1e2430]">
                  <div>
                    <p className="text-[10px] text-[#8d90a0]">Departamento de Atendimento</p>
                    <p className="text-white font-semibold">Suporte Tecnico</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8d90a0]">Conexao</p>
                    <p className="text-white">E-mail</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8d90a0]">Sub Conexao</p>
                    <p className="text-white">{activeTicket.subcategory || activeTicket.category || 'CONFIGURACAO'}</p>
                  </div>
                </div>
              </div>
              <div className="border-t border-[#1e2430]" />
              <div>
                <p className="text-[#8d90a0] font-mono uppercase text-[10px] mb-1 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-[#45dfa4]" /> Registro de Tempo
                </p>
                <p className="text-[10px] text-[#8d90a0]">Total de horas: de pedido 1h 1m</p>
                <div className="mt-2 text-center py-4 text-[#8d90a0]">
                  <Clock className="w-6 h-6 mx-auto mb-1 opacity-25" />
                  <p className="text-[11px]">Nenhum registro de tempo ainda.</p>
                </div>
              </div>
              {isTIUser && (
                <div className="border-t border-[#1e2430] pt-3">
                  <button id="btn-transfer-queue-sidebar" type="button" onClick={() => setShowQueueTransferModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#7c3aed]/20 hover:bg-[#7c3aed]/40 text-[#c4b5fd] border border-[#7c3aed]/50 rounded-xl text-xs font-bold transition-all cursor-pointer">
                    <ArrowRightLeft className="w-4 h-4" />
                    Transferir Fila do Chamado
                  </button>
                  <p className="text-[10px] text-center text-[#8d90a0] mt-1.5">
                    Atual: <span className={`font-mono font-semibold ${qText(activeTicket.queue)}`}>{qLabel(activeTicket.queue)}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Transferir Fila */}
      {showQueueTransferModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="modal-ticket-submodal bg-[#181c22] border border-[#7c3aed]/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#7c3aed]/20 pb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-[#a78bfa]" />
                <h3 className="text-base font-bold text-white">Transferir Fila</h3>
              </div>
              <button onClick={() => setShowQueueTransferModal(false)} className="text-[#8d90a0] hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-[#111827] rounded-xl p-3 border border-[#1e2430]">
              <p className="text-[10px] text-[#8d90a0] uppercase font-mono mb-1">Chamado</p>
              <p className="text-sm font-bold text-white">{activeTicket.ticketNumber} - {activeTicket.title}</p>
              <p className="text-[11px] text-[#8d90a0] mt-1">Fila atual: <span className={`font-semibold ${qText(activeTicket.queue)}`}>{qLabel(activeTicket.queue)}</span></p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-mono font-bold text-[#8d90a0] uppercase block mb-1.5">Transferir Para Fila</label>
                <select value={targetQueue} onChange={e => { setTargetQueue(e.target.value as ServiceQueue); setTargetOperator(''); }}
                  className="w-full bg-[#111827] border border-[#7c3aed]/40 focus:border-[#a78bfa] text-white text-xs rounded-xl p-3 focus:outline-none cursor-pointer">
                  <option value="N1">Fila N1 - Triagem / Nivel 1</option>
                  <option value="N2">Fila N2 - Nivel 2</option>
                  <option value="N3">Fila N3 - Nivel 3 / Infra</option>
                  <option value="ADM">Fila ADM - Administracao</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-mono font-bold text-[#8d90a0] uppercase block mb-1.5">Atribuir Operador (opcional)</label>
                <select value={targetOperator} onChange={e => setTargetOperator(e.target.value)}
                  className="w-full bg-[#111827] border border-[#7c3aed]/40 focus:border-[#a78bfa] text-white text-xs rounded-xl p-3 focus:outline-none cursor-pointer">
                  <option value="">Sem Operador (Fila Geral)</option>
                  {getOperatorsForQueue(managedUsers, targetQueue).map(u => (
                    <option key={u.id} value={u.name}>{u.name} ({u.role.toUpperCase()})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-mono font-bold text-[#8d90a0] uppercase block mb-1.5">Motivo da Transferencia (opcional)</label>
                <textarea value={transferNote} onChange={e => setTransferNote(e.target.value)} rows={3}
                  placeholder="Ex: Necessario escalamento para N3 por ser problema de infraestrutura..."
                  className="w-full bg-[#111827] border border-[#7c3aed]/40 focus:border-[#a78bfa] text-white text-xs rounded-xl p-3 focus:outline-none placeholder:text-[#6b5e8a] resize-none" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#7c3aed]/20">
              <button type="button" onClick={() => setShowQueueTransferModal(false)} className="px-4 py-2 bg-[#2a2f3a] hover:bg-[#383d4a] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer">Cancelar</button>
              <button type="button" onClick={handleConfirmTransfer} className="px-5 py-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5" /> Confirmar Transferencia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Mensagem de Resolucao */}
      {showResolvePrompt && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="modal-ticket-submodal bg-[#181c22] border border-[#45dfa4]/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-[#45dfa4]/20 pb-3">
              <CheckCircle2 className="w-5 h-5 text-[#45dfa4]" />
              <h3 className="text-base font-bold text-white">Resolver Chamado</h3>
            </div>
            <p className="text-sm text-[#8d90a0]">Informe a mensagem de resolucao que sera enviada ao solicitante:</p>
            <form onSubmit={handleConfirmResolve} className="space-y-3">
              <textarea value={resolveMessage} onChange={e => setResolveMessage(e.target.value)} rows={4}
                placeholder="Descreva a solucao aplicada ao problema..."
                className="w-full bg-[#111827] border border-[#45dfa4]/30 focus:border-[#45dfa4] text-white text-sm rounded-xl p-3 focus:outline-none placeholder:text-[#6b7280] resize-none" />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowResolvePrompt(false)} className="px-4 py-2 bg-[#2a2f3a] hover:bg-[#383d4a] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer">Cancelar</button>
                <button type="submit" disabled={!resolveMessage.trim()} className="px-5 py-2 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-xs rounded-lg transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar Resolucao
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Confirmacao */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="modal-ticket-submodal bg-[#181c22] border border-[#45dfa4]/30 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#45dfa4]/10 border border-[#45dfa4]/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-[#45dfa4]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Chamado Resolvido!</h3>
              <p className="text-sm text-[#8d90a0] mt-1">A mensagem de resolucao foi enviada ao solicitante.</p>
            </div>
            <button type="button" onClick={() => { setShowConfirmModal(false); setSelectedTicket(null); }}
              className="w-full px-5 py-2.5 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-sm rounded-xl transition-colors cursor-pointer">
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Preview Anexo */}
      {previewAttachment && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[70] flex items-center justify-center p-4" onClick={() => setPreviewAttachment(null)}>
          <div className="bg-[#181c22] border border-[#1e2430] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2430]">
              <div className="flex items-center gap-2">
                <File className="w-4 h-4 text-[#45dfa4]" />
                <span className="text-sm font-semibold text-white truncate max-w-[400px]">{previewAttachment.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {previewAttachment.url && (
                  <a href={previewAttachment.url} download={previewAttachment.name}
                    className="p-1.5 text-[#8d90a0] hover:text-[#45dfa4] hover:bg-[#1f2630] rounded-lg transition-colors cursor-pointer">
                    <Download className="w-4 h-4" />
                  </a>
                )}
                <button onClick={() => setPreviewAttachment(null)} className="p-1.5 text-[#8d90a0] hover:text-white hover:bg-[#1f2630] rounded-lg transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 flex items-center justify-center min-h-[300px] max-h-[75vh] overflow-auto">
              {previewAttachment.type?.startsWith('image/') && previewAttachment.url ? (
                <img src={previewAttachment.url} alt={previewAttachment.name} className="max-w-full max-h-[65vh] object-contain rounded-lg" />
              ) : (
                <div className="text-center text-[#8d90a0]">
                  <File className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-semibold">{previewAttachment.name}</p>
                  <p className="text-xs mt-1 opacity-60">Visualizacao nao disponivel para este tipo de arquivo.</p>
                  {previewAttachment.url && (
                    <a href={previewAttachment.url} download={previewAttachment.name}
                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-[#45dfa4]/10 hover:bg-[#45dfa4]/20 text-[#45dfa4] text-xs font-semibold rounded-lg border border-[#45dfa4]/30 transition-colors cursor-pointer">
                      <Download className="w-3.5 h-3.5" /> Baixar Arquivo
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
