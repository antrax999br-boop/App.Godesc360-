import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  User,
  FolderTree,
  FileText,
  Paperclip,
  Send,
  CheckCircle2,
  AlertCircle,
  Cloud,
  X,
  File as FileIcon,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { APP_LOGO } from '../data/mockData';
import { TicketPriority, TicketAttachment } from '../types';
import { motion, AnimatePresence } from 'motion/react';

// CATEGORY_MAP was removed and replaced by ticketCategories from AppContext

export const NewTicketForm: React.FC = () => {
  const {
    setCurrentScreen,
    addTicket,
    selectedCategoryFilter,
    setSelectedCategoryFilter,
    tickets,
    ticketCategories,
    userSession
  } = useApp();

  // Machine detection
  const [machineName, setMachineName] = useState('DESKTOP-Q2LCPBP');
  const [onlyMe, setOnlyMe] = useState(true);

  // Form Fields
  const [name, setName] = useState(() => localStorage.getItem('godesc_saved_name') || '');
  const [email, setEmail] = useState(() => localStorage.getItem('godesc_saved_email') || '');
  const [company, setCompany] = useState(() => localStorage.getItem('godesc_saved_company') || 'Empresa ABC');
  const [category, setCategory] = useState(selectedCategoryFilter || '');
  const [subcategory, setSubcategory] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('Média');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Synchronize category if passed from home quick categories
  useEffect(() => {
    if (selectedCategoryFilter) {
      const catObj = (ticketCategories || []).find(c => c.name === selectedCategoryFilter);
      if (catObj) {
        setCategory(selectedCategoryFilter);
        setSubcategory(catObj.subcategories?.[0] || 'Geral');
        if (catObj.defaultPriority) setPriority(catObj.defaultPriority);
      }
    }
  }, [selectedCategoryFilter, ticketCategories]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setCategory(selected);
    const catObj = (ticketCategories || []).find(c => c.name === selected);
    if (catObj) {
      setSubcategory(catObj.subcategories?.[0] || 'Geral');
      if (catObj.defaultPriority) setPriority(catObj.defaultPriority);
    } else {
      setSubcategory('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > 3) {
      alert('Limite máximo de 3 anexos por chamado.');
      return;
    }

    Array.from(files).forEach((file: File) => {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const reader = new FileReader();
      reader.onload = (event) => {
        const urlData = event.target?.result as string;
        setAttachments(prev => [
          ...prev,
          {
            name: file.name,
            size: `${sizeMB} MB`,
            type: file.type || 'application/octet-stream',
            url: urlData
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Por favor, informe seu nome completo.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Por favor, informe um endereço de e-mail corporativo válido.');
      return;
    }
    if (!category) {
      setErrorMsg('Selecione uma categoria para o chamado.');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Por favor, digite um título claro para o chamado.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Por favor, descreva o problema detalhadamente.');
      return;
    }

    setIsSubmitting(true);

    // If "only me" checked, remember credentials
    if (onlyMe) {
      localStorage.setItem('godesc_saved_name', name);
      localStorage.setItem('godesc_saved_email', email);
      localStorage.setItem('godesc_saved_company', company);
    }

    setTimeout(() => {
      const created = addTicket({
        requesterName: name,
        requesterEmail: email,
        company: company || 'Empresa Corporativa',
        machineName: machineName,
        onlyMeOnComputer: onlyMe,
        category: category,
        subcategory: subcategory || 'Geral',
        priority: priority,
        status: 'Novo',
        queue: 'N1',
        assignedTo: undefined,
        title: title,
        description: description,
        attachments: attachments
      });

      setCreatedTicketId(created.id);
      setIsSubmitting(false);
      setShowSuccessToast(true);

      // Clean form for next
      setTitle('');
      setDescription('');
      setAttachments([]);
      setSelectedCategoryFilter(null);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#1e1e24] text-[#dfe2eb] flex flex-col font-sans selection:bg-[#45dfa4]/30 selection:text-[#45dfa4]">
      {/* Top Header */}
      <header className="bg-[#18181b] border-b border-[#27272a] sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-6 md:px-12 py-3 max-w-7xl mx-auto">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setCurrentScreen(userSession.isAuthenticated ? 'ti_dashboard' : 'portal_landing')}
          >
            <img
              src={APP_LOGO}
              alt="Logo Geral"
              className="h-10 w-auto object-contain"
            />
          </div>

          <nav className="hidden md:flex gap-6 items-center">
            <button
              id="tab-abrir-chamado"
              onClick={() => setCurrentScreen('new_ticket')}
              className="text-[#45dfa4] font-bold border-b-2 border-[#45dfa4] pb-1 text-sm transition-colors px-2"
            >
              Abrir Chamado
            </button>
            <button
              id="tab-status"
              onClick={() => setCurrentScreen('system_status')}
              className="text-[#c3c6d7] hover:text-white text-sm transition-colors px-2 flex items-center gap-1"
            >
              <span>Status</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#45dfa4] animate-pulse"></span>
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentScreen('system_status')}
              className="text-[#45dfa4] hover:bg-[#2e353f] p-2 rounded-full transition-colors flex items-center justify-center"
              title="Status da Nuvem"
            >
              <Cloud className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex gap-2">
              <button
                id="btn-nav-abrir-ticket-active"
                onClick={() => setCurrentScreen('new_ticket')}
                className="px-3.5 py-1.5 text-xs font-bold text-gray-900 bg-[#45dfa4] rounded-lg hover:bg-[#00bd85] transition-colors"
              >
                Abrir Chamado
              </button>
            </div>

            <button
              onClick={() => setCurrentScreen(userSession.isAuthenticated ? 'ti_dashboard' : 'client_home')}
              className="sm:hidden text-sm text-[#45dfa4]"
            >
              Início
            </button>
          </div>
        </div>
      </header>

      {/* Main Form Canvas */}
      <main className="flex-grow w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12">
        {/* Breadcrumb / Back button */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => setCurrentScreen(userSession.isAuthenticated ? 'ti_dashboard' : 'client_home')}
            className="text-xs font-mono text-[#c3c6d7] hover:text-[#45dfa4] flex items-center gap-1.5 transition-all cursor-pointer bg-[#111827] px-3 py-1.5 rounded-lg border border-[#45dfa4]/50 hover:border-[#45dfa4] shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-[#45dfa4]" />
            <span>{userSession.isAuthenticated ? 'Voltar ao Dashboard' : 'Voltar ao Portal'}</span>
          </button>
          <span className="text-xs font-mono text-[#45dfa4] bg-[#45dfa4]/10 border border-[#45dfa4]/30 px-2.5 py-0.5 rounded-full">
            Atendimento Rápido TI
          </span>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
            Abrir Ticket
          </h1>
          <p className="text-sm text-[#c3c6d7]">
            Preencha o formulário abaixo para solicitar suporte técnico.
          </p>
        </div>

        {/* Error notice if any */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 text-[#ffb4ab] text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Container */}
        <div className="bg-[#1B1F27] border border-[#2A2F3A] rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl">
          <p className="text-sm text-[#c3c6d7] mb-6">
            Descreva o problema para criar um novo chamado de suporte.
          </p>

          {/* Anchor Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 border-b border-[#2A2F3A]">
            <a
              href="#section-solicitante"
              className="flex items-center gap-2 px-3.5 py-1.5 bg-[#2e353f] text-white rounded-full text-xs font-semibold border border-[#434655] whitespace-nowrap"
            >
              <User className="w-3.5 h-3.5 text-[#45dfa4]" />
              <span>Dados do Solicitante</span>
            </a>
            <a
              href="#section-classificacao"
              className="flex items-center gap-2 px-3.5 py-1.5 bg-[#0D1117] text-[#c3c6d7] hover:text-white rounded-full text-xs font-semibold border border-[#2A2F3A] hover:border-[#434655] whitespace-nowrap transition-colors"
            >
              <FolderTree className="w-3.5 h-3.5 text-[#45dfa4]" />
              <span>Classificação</span>
            </a>
            <a
              href="#section-detalhes"
              className="flex items-center gap-2 px-3.5 py-1.5 bg-[#0D1117] text-[#c3c6d7] hover:text-white rounded-full text-xs font-semibold border border-[#2A2F3A] hover:border-[#434655] whitespace-nowrap transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-[#45dfa4]" />
              <span>Detalhes do Chamado</span>
            </a>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Requester Data */}
            <fieldset
              id="section-solicitante"
              className="border border-[#2A2F3A] rounded-xl p-5 sm:p-6 bg-[#1B1F27] relative pt-7 mt-2"
            >
              <legend className="flex items-center gap-2 px-3 text-white font-bold text-sm sm:text-base bg-[#1B1F27] absolute -top-3.5 left-4 border border-[#2A2F3A] rounded-md">
                <User className="w-4 h-4 text-[#45dfa4]" />
                <span>Dados do Solicitante</span>
              </legend>

              <div className="space-y-4">
                {/* Machine name banner */}
                <div className="w-full bg-[#0D1117] border border-[#2A2F3A] text-[#45dfa4] p-3 rounded-lg text-xs sm:text-sm font-mono flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[#8d90a0]">Nome da máquina:</span>
                    <span className="font-bold">{machineName}</span>
                  </div>
                  <span className="text-[10px] text-[#8d90a0] uppercase tracking-wider hidden sm:inline">
                    Detectado via rede
                  </span>
                </div>

                {/* Only me checkbox */}
                <div className="flex items-start sm:items-center gap-3 bg-[#0D1117] border border-[#2A2F3A] p-3.5 rounded-lg">
                  <input
                    id="only_me"
                    type="checkbox"
                    checked={onlyMe}
                    onChange={(e) => setOnlyMe(e.target.checked)}
                    className="w-4 h-4 mt-0.5 sm:mt-0 text-[#45dfa4] bg-[#2e353f] border-[#434655] rounded focus:ring-[#45dfa4] focus:ring-1 cursor-pointer accent-[#45dfa4]"
                  />
                  <label
                    htmlFor="only_me"
                    className="text-xs sm:text-sm text-[#c3c6d7] cursor-pointer select-none leading-relaxed"
                  >
                    <strong className="text-white">Somente eu utilizo este computador.</strong>{' '}
                    Ao marcar, vinculamos seus dados a esta máquina para preencher automaticamente os próximos chamados, sem precisar digitar de novo.
                  </label>
                </div>

                {/* Name & Email inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="requester_name" className="text-xs font-semibold text-white">
                      Nome do solicitante <span className="text-[#ffb4ab]">*</span>
                    </label>
                    <input
                      id="requester_name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Digite seu nome"
                      className="w-full bg-[#0D1117] border border-[#2A2F3A] focus:border-[#45dfa4] text-white rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#45dfa4]/30 transition-all placeholder:text-[#8d90a0]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="requester_email" className="text-xs font-semibold text-white">
                      E-mail <span className="text-[#ffb4ab]">*</span>
                    </label>
                    <input
                      id="requester_email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Digite seu e-mail"
                      className="w-full bg-[#0D1117] border border-[#2A2F3A] focus:border-[#45dfa4] text-white rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#45dfa4]/30 transition-all placeholder:text-[#8d90a0]"
                    />
                  </div>
                </div>

                {/* Company optional field */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="requester_company" className="text-xs font-semibold text-white">
                    Empresa / Departamento
                  </label>
                  <input
                    id="requester_company"
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Ex: Empresa ABC - Financeiro"
                    className="w-full bg-[#0D1117] border border-[#2A2F3A] focus:border-[#45dfa4] text-white rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#45dfa4]/30 transition-all placeholder:text-[#8d90a0]"
                  />
                </div>
              </div>
            </fieldset>

            {/* Section 2: Classification */}
            <fieldset
              id="section-classificacao"
              className="border border-[#2A2F3A] rounded-xl p-5 sm:p-6 bg-[#1B1F27] relative pt-7 mt-6"
            >
              <legend className="flex items-center gap-2 px-3 text-white font-bold text-sm sm:text-base bg-[#1B1F27] absolute -top-3.5 left-4 border border-[#2A2F3A] rounded-md">
                <FolderTree className="w-4 h-4 text-[#45dfa4]" />
                <span>Classificação</span>
              </legend>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {/* Category Select */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="ticket_category" className="text-xs font-semibold text-white">
                    Categoria <span className="text-[#ffb4ab]">*</span>
                  </label>
                  <select
                    id="ticket_category"
                    required
                    value={category}
                    onChange={handleCategoryChange}
                    className="w-full bg-[#0D1117] border border-[#2A2F3A] focus:border-[#45dfa4] text-white rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#45dfa4]/30 transition-all cursor-pointer"
                  >
                    <option value="" disabled hidden>
                      Selecione a categoria
                    </option>
                    {(ticketCategories || []).map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Subcategory Select */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="ticket_subcategory" className="text-xs font-semibold text-white">
                    Subcategoria
                  </label>
                  <select
                    id="ticket_subcategory"
                    disabled={!category}
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="w-full bg-[#0D1117] border border-[#2A2F3A] focus:border-[#45dfa4] text-white rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#45dfa4]/30 transition-all cursor-pointer disabled:opacity-40"
                  >
                    {!category && <option value="">Selecione a categoria primeiro</option>}
                    {category &&
                      (ticketCategories || []).find(c => c.name === category)?.subcategories?.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Priority Display (Defined by TI) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#8d90a0]">
                    Prioridade
                  </label>
                  <div className="w-full bg-[#0D1117]/60 border border-[#2A2F3A] text-[#c3c6d7] rounded-lg p-3 text-xs flex items-center justify-between font-mono">
                    <span className="flex items-center gap-1.5 text-[#45dfa4] font-bold">
                      <span className="w-2 h-2 rounded-full bg-[#45dfa4] inline-block"></span>
                      Triagem T.I. (Padrão)
                    </span>
                    <span className="text-[10px] text-[#8d90a0] font-sans">Definida pelo Suporte</span>
                  </div>
                </div>
              </div>


            </fieldset>

            {/* Section 3: Ticket Details */}
            <fieldset
              id="section-detalhes"
              className="border border-[#2A2F3A] rounded-xl p-5 sm:p-6 bg-[#1B1F27] relative pt-7 mt-6"
            >
              <legend className="flex items-center gap-2 px-3 text-white font-bold text-sm sm:text-base bg-[#1B1F27] absolute -top-3.5 left-4 border border-[#2A2F3A] rounded-md">
                <FileText className="w-4 h-4 text-[#45dfa4]" />
                <span>Detalhes do Chamado</span>
              </legend>

              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="ticket_title" className="text-xs font-semibold text-white">
                    Título <span className="text-[#ffb4ab]">*</span>
                  </label>
                  <input
                    id="ticket_title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Digite um título claro e objetivo (ex: Falha ao abrir Outlook)"
                    className="w-full bg-[#0D1117] border border-[#2A2F3A] focus:border-[#45dfa4] text-white rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#45dfa4]/30 transition-all placeholder:text-[#8d90a0]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="ticket_description" className="text-xs font-semibold text-white">
                    Descrição Detalhada <span className="text-[#ffb4ab]">*</span>
                  </label>
                  <textarea
                    id="ticket_description"
                    required
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o problema detalhadamente..."
                    className="w-full bg-[#0D1117] border border-[#2A2F3A] focus:border-[#45dfa4] text-white rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#45dfa4]/30 transition-all placeholder:text-[#8d90a0] resize-y"
                  />
                  <span className="text-xs text-[#8d90a0]">
                    Inclua detalhes sobre o que aconteceu, quando começou e passos já tentados.
                  </span>
                </div>

                {/* Attachments Section */}
                <div className="flex flex-col gap-1.5 pt-2">
                  <label className="text-xs font-semibold text-white">Anexos (opcional)</label>

                  <div className="border border-dashed border-[#434655] hover:border-[#45dfa4] bg-[#0D1117] rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors relative group">
                    <input
                      id="file_upload"
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex items-center gap-2 text-[#c3c6d7] group-hover:text-[#45dfa4] transition-colors">
                      <Paperclip className="w-5 h-5" />
                      <span className="text-xs font-semibold">Selecionar arquivos ou arraste aqui</span>
                    </div>
                  </div>

                  {/* Upload limits warning banner */}
                  <div className="w-full bg-[#ffeedd]/10 border border-[#ffb95f]/30 text-[#ffb95f] text-xs p-3 rounded-lg mt-1 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-[#ffb95f]" />
                    <span>
                      <strong>Limites:</strong> Max 3 arquivos, 10MB cada. Tipos suportados: imagens, documentos, PDFs, vídeos, etc.
                    </span>
                  </div>

                  {/* Render attached files */}
                  {attachments.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {attachments.map((att, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 bg-[#0D1117] border border-[#2A2F3A] rounded-lg text-xs"
                        >
                          <div className="flex items-center gap-2 text-white truncate max-w-md">
                            <FileIcon className="w-4 h-4 text-[#45dfa4] shrink-0" />
                            <span className="truncate">{att.name}</span>
                            <span className="text-[#8d90a0] font-mono">({att.size})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(idx)}
                            className="text-[#8d90a0] hover:text-[#ffb4ab] p-1 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </fieldset>

            {/* Form Actions */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setCurrentScreen(userSession.isAuthenticated ? 'ti_dashboard' : 'client_home')}
                className="w-full sm:w-auto px-6 py-3 border border-[#434655] hover:bg-[#2e353f] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                id="btn-submit-ticket"
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-[#45dfa4]/10 hover:shadow-[#45dfa4]/25 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Enviando...' : 'Abrir Chamado'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Success Toast Modal */}
      <AnimatePresence>
        {showSuccessToast && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1B1F27] border border-[#45dfa4]/40 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl relative"
            >
              <div className="w-16 h-16 rounded-full bg-[#45dfa4]/10 border border-[#45dfa4]/30 text-[#45dfa4] flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h3 className="text-xl font-bold text-white mb-2">Chamado Criado com Sucesso!</h3>
              <p className="text-sm text-[#c3c6d7] mb-4">
                O sistema de TI foi notificado em tempo real. Nossa equipe técnica analisará sua solicitação.
              </p>

              <div className="bg-[#0D1117] border border-[#2A2F3A] rounded-xl p-3 mb-6 text-xs font-mono text-[#8d90a0]">
                <span>Número do Chamado: </span>
                <span className="text-[#45dfa4] font-bold">#{String((tickets || []).length).padStart(6, '0')}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  id="btn-toast-view-my-tickets"
                  onClick={() => {
                    setShowSuccessToast(false);
                    setCurrentScreen('client_my_tickets');
                  }}
                  className="px-4 py-2.5 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-xs rounded-lg transition-colors"
                >
                  Ver Meus Chamados
                </button>
                <button
                  id="btn-toast-ti-view"
                  onClick={() => {
                    setShowSuccessToast(false);
                    setCurrentScreen('ti_dashboard');
                  }}
                  className="px-4 py-2.5 bg-[#232a34] hover:bg-[#2e353f] border border-[#434655] text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Acessar Painel TI
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-[#2A2F3A] py-6 text-center text-xs font-mono text-[#8d90a0]">
        <p>© 2024 GoDesc. Todos os direitos reservados. Ambiente Seguro.</p>
      </footer>
    </div>
  );
};
