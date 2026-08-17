import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { processFileAttachment } from '../utils/fileUtils';
import {
  User,
  FolderTree,
  FileText,
  Paperclip,
  Send,
  CheckCircle2,
  AlertCircle,
  X,
  File as FileIcon,
  ArrowLeft,
  Users,
  Building2,
  Phone,
  Layers,
  UserCheck,
  Tag,
  Monitor,
  XCircle
} from 'lucide-react';
import { TicketPriority, TicketAttachment, ServiceQueue } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export const TINewTicketView: React.FC = () => {
  const {
    setCurrentScreen,
    addTicket,
    tickets,
    ticketCategories,
    managedUsers,
    tiSession
  } = useApp();

  // Mock list of clients / departments
  const clientsList = [
    { id: 'cli-1', name: 'Empresa GoDesc 360', departments: ['Tecnologia', 'Financeiro', 'Recursos Humanos', 'Comercial'] },
    { id: 'cli-2', name: 'Tech Solutions Ltda', departments: ['Infraestrutura', 'Desenvolvimento', 'Suporte'] },
    { id: 'cli-3', name: 'Inovações Globais S.A.', departments: ['Vendas', 'Operações', 'Administrativo'] },
  ];

  const operatorsList = (managedUsers || []).length > 0
    ? managedUsers
    : [
        { id: 'op-1', name: 'Técnico N1 - Suporte', email: 'n1@godesc.com.br', role: 'n1' },
        { id: 'op-2', name: 'Analista N2 - Infra', email: 'n2@godesc.com.br', role: 'n2' },
        { id: 'op-3', name: 'Especialista N3 - SysAdmin', email: 'n3@godesc.com.br', role: 'n3' },
      ];

  // Section 1: Informações do Solicitante
  const [requesterName, setRequesterName] = useState('Laércio Schumacher');
  const [requesterEmail, setRequesterEmail] = useState('laercio.schumacher@godesc.com.br');
  const [selectedClient, setSelectedClient] = useState('Empresa GoDesc 360');
  const [selectedDepartment, setSelectedDepartment] = useState('Tecnologia');
  const [requesterPhone, setRequesterPhone] = useState('(11) 98765-4321');

  // Section 2: Destino e Atendimento
  const [serviceDepartment, setServiceDepartment] = useState('Service Desk IT');
  const [serviceTeam, setServiceTeam] = useState('Todas as equipes');
  const [assignedQueue, setAssignedQueue] = useState<ServiceQueue>('N1');
  const [assignedOperator, setAssignedOperator] = useState<string>('');
  const [serviceType, setServiceType] = useState('Incidente Técnico');

  // Section 3: Detalhes do Chamado
  const [title, setTitle] = useState('');
  const [requestType, setRequestType] = useState('Solicitação de Serviço');
  const [priority, setPriority] = useState<TicketPriority>('Média');
  const [equipment, setEquipment] = useState('DESKTOP-Q2LCPBP');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [createdTicketNumber, setCreatedTicketNumber] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Available subcategories based on category
  const activeCategoryObj = (ticketCategories || []).find(c => c.name === category);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const catName = e.target.value;
    setCategory(catName);
    const catObj = (ticketCategories || []).find(c => c.name === catName);
    if (catObj) {
      setSubcategory(catObj.subcategories?.[0] || 'Geral');
      if (catObj.defaultPriority) setPriority(catObj.defaultPriority);
    } else {
      setSubcategory('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > 5) {
      alert('Limite máximo de 5 anexos por chamado interno.');
      return;
    }

    try {
      const processed = await Promise.all(
        Array.from(files).map((file: File) => processFileAttachment(file))
      );
      setAttachments(prev => [...prev, ...processed]);
    } catch (err) {
      console.error('Error processing attachments in TI New Ticket:', err);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!requesterName.trim()) {
      setErrorMsg('Informe o nome do solicitante.');
      return;
    }
    if (!requesterEmail.trim() || !requesterEmail.includes('@')) {
      setErrorMsg('Informe um e-mail válido para o solicitante.');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Digite um título claro para o chamado.');
      return;
    }
    if (!category) {
      setErrorMsg('Selecione uma categoria.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Por favor, detalhe a solicitação.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const created = addTicket({
        requesterName: requesterName.trim(),
        requesterEmail: requesterEmail.trim(),
        company: selectedClient || 'Empresa GoDesc 360',
        machineName: equipment || 'DESKTOP-Q2LCPBP',
        onlyMeOnComputer: true,
        category: category,
        subcategory: subcategory || 'Geral',
        priority: priority,
        status: 'Novo',
        queue: assignedQueue,
        assignedTo: assignedOperator || (tiSession.name || 'Técnico de Suporte'),
        title: title.trim(),
        description: description.trim(),
        attachments: attachments
      });

      setCreatedTicketNumber(created.ticketNumber);
      setIsSubmitting(false);
      setShowSuccessToast(true);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#111827] text-[#dfe2eb] flex flex-col font-sans selection:bg-[#45dfa4]/30 selection:text-[#45dfa4]">
      {/* Top Professional Sub-header */}
      <header className="bg-[#111827] border-b border-[#2A2F3A] sticky top-0 z-40 px-6 md:px-12 py-3.5 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentScreen('ti_dashboard')}
            className="text-xs font-mono text-[#c3c6d7] hover:text-[#45dfa4] flex items-center gap-1.5 transition-all cursor-pointer bg-[#182030] px-3 py-1.5 rounded-lg border border-[#45dfa4]/50 hover:border-[#45dfa4] shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-[#45dfa4]" />
            <span>Voltar ao Dashboard</span>
          </button>
          <span className="text-[#2a364f]">|</span>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white tracking-tight">
              Abertura de Chamado (T.I. Operacional)
            </h1>
            <span className="text-[10px] font-mono font-bold bg-[#45dfa4]/10 text-[#45dfa4] border border-[#45dfa4]/40 px-2 py-0.5 rounded-full">
              INTERNO T.I.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[#8d90a0] font-mono hidden md:inline">
            Operador: <strong className="text-white">{tiSession.name || 'Suporte T.I.'}</strong>
          </span>
          <button
            onClick={() => setCurrentScreen('ti_dashboard')}
            className="text-[#8d90a0] hover:text-white p-1.5 rounded-lg hover:bg-[#182030] transition-colors"
            title="Fechar"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-8 py-6">
        <p className="text-xs text-[#8d90a0] mb-6">
          Preencha os campos abaixo para abrir um novo chamado de suporte técnico em tempo real para a fila da equipe.
        </p>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 text-[#ffb4ab] text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECTION 1: Informações do Solicitante */}
          <fieldset className="border border-[#1e2638] rounded-xl p-5 sm:p-6 bg-[#0f141f] relative pt-7 shadow-lg">
            <legend className="flex items-center gap-2 px-3 text-white font-bold text-xs sm:text-sm bg-[#0f141f] absolute -top-3 left-4 border border-[#1e2638] rounded-md tracking-wider uppercase">
              <User className="w-3.5 h-3.5 text-[#45dfa4]" />
              <span>Informações do Solicitante</span>
            </legend>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Nome Solicitante */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#c3c6d7] flex items-center gap-1">
                  Nome do Solicitante <span className="text-[#ffb4ab]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  placeholder="Nome do colaborador"
                  className="w-full bg-[#070b11] border border-[#1e2638] focus:border-[#45dfa4] text-white rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#45dfa4]/30 transition-all"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#c3c6d7] flex items-center gap-1">
                  E-mail <span className="text-[#ffb4ab]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={requesterEmail}
                  onChange={(e) => setRequesterEmail(e.target.value)}
                  placeholder="email@empresa.com.br"
                  className="w-full bg-[#070b11] border border-[#1e2638] focus:border-[#45dfa4] text-white rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#45dfa4]/30 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Cliente */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#c3c6d7]">Cliente *</label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full bg-[#070b11] border border-[#1e2638] focus:border-[#45dfa4] text-white rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#45dfa4]/30 transition-all cursor-pointer"
                >
                  {clientsList.map((cli) => (
                    <option key={cli.id} value={cli.name}>{cli.name}</option>
                  ))}
                </select>
              </div>

              {/* Departamento do Solicitante */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#c3c6d7]">Departamento do Solicitante</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full bg-[#070b11] border border-[#1e2638] focus:border-[#45dfa4] text-white rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#45dfa4]/30 transition-all cursor-pointer"
                >
                  {clientsList
                    .find(c => c.name === selectedClient)
                    ?.departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    )) || <option value="Geral">Geral</option>}
                </select>
              </div>

              {/* Telefone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#c3c6d7]">Telefone</label>
                <input
                  type="text"
                  value={requesterPhone}
                  onChange={(e) => setRequesterPhone(e.target.value)}
                  placeholder="Telefone do colaborador"
                  className="w-full bg-[#070b11] border border-[#1e2638] focus:border-[#45dfa4] text-white rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#45dfa4]/30 transition-all"
                />
              </div>
            </div>
          </fieldset>

          {/* SECTION 2: Destino e Atendimento */}
          <fieldset className="border border-[#1e2638] rounded-xl p-5 sm:p-6 bg-[#0f141f] relative pt-7 shadow-lg">
            <legend className="flex items-center gap-2 px-3 text-white font-bold text-xs sm:text-sm bg-[#0f141f] absolute -top-3 left-4 border border-[#1e2638] rounded-md tracking-wider uppercase">
              <Building2 className="w-3.5 h-3.5 text-[#45dfa4]" />
              <span>Destino e Atendimento</span>
            </legend>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Departamento de Atendimento */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#c3c6d7]">Departamento de Atendimento</label>
                <select
                  value={serviceDepartment}
                  onChange={(e) => setServiceDepartment(e.target.value)}
                  className="w-full bg-[#070b11] border border-[#1e2638] focus:border-[#45dfa4] text-white rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#45dfa4]/30 transition-all cursor-pointer"
                >
                  <option value="Service Desk IT">Service Desk IT</option>
                  <option value="Infraestrutura & Redes">Infraestrutura & Redes</option>
                  <option value="Sistemas & Banco de Dados">Sistemas & Banco de Dados</option>
                  <option value="Segurança da Informação">Segurança da Informação</option>
                </select>
              </div>

              {/* Fila / Mesa de Trabalho */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#c3c6d7]">Nível / Fila Atribuída</label>
                <select
                  value={assignedQueue}
                  onChange={(e) => setAssignedQueue(e.target.value as ServiceQueue)}
                  className="w-full bg-[#070b11] border border-[#1e2638] focus:border-[#45dfa4] text-[#45dfa4] font-bold rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#45dfa4]/30 transition-all cursor-pointer"
                >
                  <option value="N1">Fila N1 (Primeiro Nível)</option>
                  <option value="N2">Fila N2 (Suporte Avançado)</option>
                  <option value="N3">Fila N3 (Infraestrutura / Especialista)</option>
                  <option value="ADM">Fila ADM (Gestão de TI)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Operador Responsável */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#c3c6d7]">Operador Responsável</label>
                <select
                  value={assignedOperator}
                  onChange={(e) => setAssignedOperator(e.target.value)}
                  className="w-full bg-[#070b11] border border-[#1e2638] focus:border-[#45dfa4] text-white rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#45dfa4]/30 transition-all cursor-pointer"
                >
                  <option value="">Nenhum operador (Aguardando Fila)</option>
                  {operatorsList.map(op => (
                    <option key={op.id} value={op.name}>
                      {op.name} ({op.role.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo de Atendimento */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#c3c6d7]">Tipo de Atendimento</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full bg-[#070b11] border border-[#1e2638] focus:border-[#45dfa4] text-white rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#45dfa4]/30 transition-all cursor-pointer"
                >
                  <option value="Incidente Técnico">Incidente Técnico</option>
                  <option value="Requisição de Acesso">Requisição de Acesso</option>
                  <option value="Manutenção Preventiva">Manutenção Preventiva</option>
                  <option value="Projeto Especial">Projeto Especial</option>
                </select>
              </div>
            </div>
          </fieldset>

          {/* SECTION 3: Detalhes do Chamado */}
          <fieldset className="border border-[#1e2638] rounded-xl p-5 sm:p-6 bg-[#0f141f] relative pt-7 shadow-lg">
            <legend className="flex items-center gap-2 px-3 text-white font-bold text-xs sm:text-sm bg-[#0f141f] absolute -top-3 left-4 border border-[#1e2638] rounded-md tracking-wider uppercase">
              <FileText className="w-3.5 h-3.5 text-[#45dfa4]" />
              <span>Detalhes do Chamado</span>
            </legend>

            {/* Título */}
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-xs font-semibold text-[#c3c6d7]">
                Título do Chamado <span className="text-[#ffb4ab]">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Problema ao conectar na VPN / Troca de mouse"
                className="w-full bg-[#070b11] border border-[#1e2638] focus:border-[#45dfa4] text-white rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#45dfa4]/30 transition-all placeholder:text-[#435069]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Prioridade */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#c3c6d7]">Prioridade</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TicketPriority)}
                  className="w-full bg-[#070b11] border border-[#1e2638] focus:border-[#45dfa4] text-white rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#45dfa4]/30 transition-all cursor-pointer"
                >
                  <option value="Baixa">Baixa (Dúvidas/Melhorias)</option>
                  <option value="Média">Média (Rotina de trabalho)</option>
                  <option value="Alta">Alta (Impacto no setor)</option>
                  <option value="Crítica">Crítica (Operação parada)</option>
                </select>
              </div>

              {/* Equipamento */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#c3c6d7]">Equipamento / Hostname</label>
                <input
                  type="text"
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                  placeholder="Ex: DESKTOP-Q2LCPBP ou IP"
                  className="w-full bg-[#070b11] border border-[#1e2638] focus:border-[#45dfa4] text-white rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#45dfa4]/30 transition-all font-mono"
                />
              </div>

              {/* Tipo Solicitação */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#c3c6d7]">Tipo de Solicitação</label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  className="w-full bg-[#070b11] border border-[#1e2638] focus:border-[#45dfa4] text-white rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#45dfa4]/30 transition-all cursor-pointer"
                >
                  <option value="Solicitação de Serviço">Solicitação de Serviço</option>
                  <option value="Incidente">Incidente</option>
                  <option value="Mudança">Mudança (RFC)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Categoria */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#c3c6d7]">
                  Categoria <span className="text-[#ffb4ab]">*</span>
                </label>
                <select
                  required
                  value={category}
                  onChange={handleCategoryChange}
                  className="w-full bg-[#070b11] border border-[#1e2638] focus:border-[#45dfa4] text-white rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#45dfa4]/30 transition-all cursor-pointer"
                >
                  <option value="" disabled hidden>Selecione a categoria</option>
                  {(ticketCategories || []).map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Subcategoria */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#c3c6d7]">Subcategoria</label>
                <select
                  disabled={!category}
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full bg-[#070b11] border border-[#1e2638] focus:border-[#45dfa4] text-white rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#45dfa4]/30 transition-all cursor-pointer disabled:opacity-40"
                >
                  {!category && <option value="">Selecione a categoria primeiro</option>}
                  {category &&
                    activeCategoryObj?.subcategories?.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                </select>
              </div>
            </div>

            {/* Descrição Detalhada */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#c3c6d7]">
                Descrição Detalhada <span className="text-[#ffb4ab]">*</span>
              </label>
              <textarea
                required
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o problema em detalhes, incluindo quando começou e quais passos já tentou para resolver..."
                className="w-full bg-[#070b11] border border-[#1e2638] focus:border-[#45dfa4] text-white rounded-lg p-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#45dfa4]/30 transition-all resize-y placeholder:text-[#435069]"
              />
            </div>

            {/* Anexos */}
            <div className="flex flex-col gap-1.5 pt-4">
              <label className="text-xs font-semibold text-[#c3c6d7]">Anexos Técnicos (Opcional)</label>
              <div className="border border-dashed border-[#1e2638] hover:border-[#45dfa4] bg-[#070b11] rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors relative group">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex items-center gap-2 text-[#8d90a0] group-hover:text-[#45dfa4] transition-colors text-xs">
                  <Paperclip className="w-4 h-4" />
                  <span>Anexar prints ou relatórios (máx 5 arquivos)</span>
                </div>
              </div>

              {attachments.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  {attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-[#070b11] border border-[#1e2638] rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2 text-white truncate">
                        <FileIcon className="w-3.5 h-3.5 text-[#45dfa4] shrink-0" />
                        <span className="truncate">{att.name}</span>
                        <span className="text-[#8d90a0] font-mono">({att.size})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="text-[#8d90a0] hover:text-[#ffb4ab] p-1 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </fieldset>

          {/* Form Submit Bar */}
          <div className="flex items-center justify-end gap-3 pt-2 pb-8">
            <button
              type="button"
              onClick={() => setCurrentScreen('ti_dashboard')}
              className="px-5 py-2.5 bg-[#182030] hover:bg-[#202b40] text-white text-xs font-semibold rounded-lg border border-[#2a364f] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-7 py-2.5 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-xs rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-[#45dfa4]/10 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Registrando Chamado...' : 'Criar Chamado Técnico'}</span>
            </button>
          </div>
        </form>
      </main>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessToast && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0f141f] border border-[#45dfa4]/50 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl relative"
            >
              <div className="w-14 h-14 rounded-full bg-[#45dfa4]/10 border border-[#45dfa4]/40 text-[#45dfa4] flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <h3 className="text-lg font-bold text-white mb-2">Chamado Aberto com Sucesso!</h3>
              <p className="text-xs text-[#c3c6d7] mb-4">
                O ticket foi registrado na fila <strong className="text-[#45dfa4]">{assignedQueue}</strong>. O cliente ({requesterEmail}) também poderá acompanhar o chamado em tempo real no portal do cliente.
              </p>

              <div className="bg-[#070b11] border border-[#1e2638] rounded-xl p-3 mb-6 text-xs font-mono text-[#8d90a0]">
                <span>Ticket Gerado: </span>
                <span className="text-[#45dfa4] font-bold">{createdTicketNumber}</span>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setShowSuccessToast(false);
                    setCurrentScreen('ti_tickets');
                  }}
                  className="px-5 py-2 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Ver Lista de Tickets
                </button>
                <button
                  onClick={() => {
                    setShowSuccessToast(false);
                    setCurrentScreen('ti_dashboard');
                  }}
                  className="px-5 py-2 bg-[#182030] hover:bg-[#202b40] text-white font-semibold text-xs rounded-lg border border-[#2a364f] transition-colors cursor-pointer"
                >
                  Voltar ao Dashboard
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
