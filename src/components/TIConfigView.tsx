import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserAccount, ScreenView, TicketPriority } from '../types';
import { 
  ArrowLeft, 
  Settings, 
  UserPlus, 
  Plus, 
  Save, 
  Edit2, 
  Trash2, 
  Building2, 
  ShieldCheck, 
  FolderTree, 
  Check, 
  X, 
  Kanban,
  Key,
  Mail,
  User as UserIcon,
  Tag,
  Lock,
  Unlock,
  ShieldAlert,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const AVAILABLE_MODULES: { id: ScreenView; label: string }[] = [
  { id: 'ti_dashboard', label: 'Painel TI Dashboard' },
  { id: 'ti_tickets', label: 'Chamados & Tickets' },
  { id: 'ti_queue', label: 'Kanban de Tarefas' },
  { id: 'ti_database', label: 'Base de Dados & Notas' },
  { id: 'ti_calendar', label: 'Calendário & Eventos' },
  { id: 'knowledge_base', label: 'Base de Conhecimento' },
  { id: 'system_status', label: 'Status do Sistema' },
  { id: 'ti_config', label: 'Configurações Administrativas' },
  { id: 'ti_audit_logs', label: 'Logs de Segurança TI' }
];

export const TIConfigView: React.FC = () => {
  const { 
    userSession,
    tiSession,
    setCurrentScreen, 
    triggerSystemNotification, 
    managedUsers,
    addManagedUser,
    updateManagedUser,
    deleteManagedUser,
    unlockUserAccount,
    auditLogs,
    ticketCategories, 
    addTicketCategory, 
    editTicketCategory,
    addSubCategory,
    deleteSubCategory,
    deleteTicketCategory,
    companies,
    addCompany,
    deleteCompany
  } = useApp();

  const [activeTab, setActiveTab] = useState<'users' | 'security' | 'categories' | 'companies'>('users');

  // New User Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'n1' | 'n2' | 'n3' | 'gestor' | 'ceo'>('n1');
  const [selectedModules, setSelectedModules] = useState<ScreenView[]>([
    'ti_dashboard', 'ti_tickets', 'ti_queue', 'knowledge_base'
  ]);
  const [permConfig, setPermConfig] = useState(false);
  const [permEditTickets, setPermEditTickets] = useState(true);
  const [permDeleteTickets, setPermDeleteTickets] = useState(false);
  const [permManageUsers, setPermManageUsers] = useState(false);
  const [permManageCategories, setPermManageCategories] = useState(false);
  const [permViewAllKanbans, setPermViewAllKanbans] = useState(false);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Category Form State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [initialSubcategoriesText, setInitialSubcategoriesText] = useState('');
  const [defaultPriority, setDefaultPriority] = useState<TicketPriority>('Média');
  
  // Inline Subcategory adding per category
  const [subCategoryInputs, setSubCategoryInputs] = useState<{ [categoryId: number]: string }>({});

  // Editing Category State
  const [editingCategory, setEditingCategory] = useState<{ id: number; name: string; subcategories: string[] } | null>(null);

  // Companies State
  const [companyName, setCompanyName] = useState('');
  const [companyCnpj, setCompanyCnpj] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');

  // Handle role selection presets for module permissions
  const handleRolePreset = (selectedRole: 'n1' | 'n2' | 'n3' | 'gestor' | 'ceo') => {
    setRole(selectedRole);
    if (selectedRole === 'ceo' || selectedRole === 'gestor') {
      setSelectedModules(['ti_dashboard', 'ti_tickets', 'ti_queue', 'ti_database', 'ti_calendar', 'knowledge_base', 'system_status', 'ti_config']);
      setPermConfig(true);
      setPermEditTickets(true);
      setPermDeleteTickets(true);
      setPermManageUsers(true);
      setPermManageCategories(true);
      setPermViewAllKanbans(true);
    } else if (selectedRole === 'n3') {
      setSelectedModules(['ti_dashboard', 'ti_tickets', 'ti_queue', 'ti_database', 'ti_calendar', 'knowledge_base', 'system_status']);
      setPermConfig(false);
      setPermEditTickets(true);
      setPermDeleteTickets(false);
      setPermManageUsers(false);
      setPermManageCategories(false);
      setPermViewAllKanbans(false);
    } else if (selectedRole === 'n2') {
      setSelectedModules(['ti_dashboard', 'ti_tickets', 'ti_queue', 'ti_database', 'ti_calendar', 'knowledge_base']);
      setPermConfig(false);
      setPermEditTickets(true);
      setPermDeleteTickets(false);
      setPermManageUsers(false);
      setPermManageCategories(false);
      setPermViewAllKanbans(false);
    } else {
      // N1
      setSelectedModules(['ti_dashboard', 'ti_tickets', 'ti_queue', 'knowledge_base']);
      setPermConfig(false);
      setPermEditTickets(false);
      setPermDeleteTickets(false);
      setPermManageUsers(false);
      setPermManageCategories(false);
      setPermViewAllKanbans(false);
    }
  };

  const toggleModuleSelection = (modId: ScreenView) => {
    if (selectedModules.includes(modId)) {
      setSelectedModules(selectedModules.filter(m => m !== modId));
    } else {
      setSelectedModules([...selectedModules, modId]);
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    const userEmail = email.trim() || `${username.trim().toLowerCase()}@godesc.com.br`;
    const userFullName = name.trim() || username.trim();

    const created = addManagedUser({
      name: userFullName,
      username: username.trim().toLowerCase(),
      password: password.trim(),
      email: userEmail,
      role: role,
      allowedModules: selectedModules,
      permissions: {
        canAccessConfig: permConfig,
        canEditTickets: permEditTickets,
        canDeleteTickets: permDeleteTickets,
        canManageUsers: permManageUsers,
        canManageCategories: permManageCategories,
        canViewAllKanbans: permViewAllKanbans
      }
    });

    // Reset Form
    setName('');
    setUsername('');
    setEmail('');
    setPassword('');

    triggerSystemNotification(
      'Usuário e Kanban Criados',
      `O usuário @${created.username} foi cadastrado e seu Kanban individual foi inicializado!`,
      'Configurações',
      'Baixa'
    );
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    updateManagedUser(editingUser.id, {
      name: editingUser.name.trim(),
      username: editingUser.username.trim().toLowerCase(),
      email: editingUser.email.trim(),
      role: editingUser.role,
      password: editingUser.password,
      allowedModules: editingUser.allowedModules || [],
      permissions: editingUser.permissions || {}
    });

    setEditingUser(null);
    triggerSystemNotification('Usuário Atualizado', `As permissões de ${editingUser.name} foram atualizadas com sucesso.`, 'Configurações', 'Baixa');
  };

  const handleEditUserRolePreset = (selectedRole: 'n1' | 'n2' | 'n3' | 'gestor' | 'ceo') => {
    if (!editingUser) return;
    let newMods: ScreenView[] = [];
    let newPerms = { ...editingUser.permissions };

    if (selectedRole === 'ceo' || selectedRole === 'gestor') {
      newMods = ['ti_dashboard', 'ti_tickets', 'ti_queue', 'ti_database', 'ti_calendar', 'knowledge_base', 'system_status', 'ti_config'];
      newPerms = {
        canAccessConfig: true,
        canEditTickets: true,
        canDeleteTickets: true,
        canManageUsers: true,
        canManageCategories: true,
        canViewAllKanbans: true
      };
    } else if (selectedRole === 'n3') {
      newMods = ['ti_dashboard', 'ti_tickets', 'ti_queue', 'ti_database', 'ti_calendar', 'knowledge_base', 'system_status'];
      newPerms = {
        canAccessConfig: false,
        canEditTickets: true,
        canDeleteTickets: false,
        canManageUsers: false,
        canManageCategories: false,
        canViewAllKanbans: false
      };
    } else if (selectedRole === 'n2') {
      newMods = ['ti_dashboard', 'ti_tickets', 'ti_queue', 'ti_database', 'ti_calendar', 'knowledge_base'];
      newPerms = {
        canAccessConfig: false,
        canEditTickets: true,
        canDeleteTickets: false,
        canManageUsers: false,
        canManageCategories: false,
        canViewAllKanbans: false
      };
    } else {
      newMods = ['ti_dashboard', 'ti_tickets', 'ti_queue', 'knowledge_base'];
      newPerms = {
        canAccessConfig: false,
        canEditTickets: false,
        canDeleteTickets: false,
        canManageUsers: false,
        canManageCategories: false,
        canViewAllKanbans: false
      };
    }

    setEditingUser({
      ...editingUser,
      role: selectedRole,
      allowedModules: newMods,
      permissions: newPerms
    });
  };

  const toggleEditUserModule = (modId: ScreenView) => {
    if (!editingUser) return;
    const currentMods = editingUser.allowedModules || [];
    const updatedMods = currentMods.includes(modId)
      ? currentMods.filter(m => m !== modId)
      : [...currentMods, modId];
    setEditingUser({ ...editingUser, allowedModules: updatedMods });
  };

  const toggleEditUserPermission = (permKey: keyof NonNullable<UserAccount['permissions']>) => {
    if (!editingUser) return;
    setEditingUser({
      ...editingUser,
      permissions: {
        ...editingUser.permissions,
        [permKey]: !editingUser.permissions?.[permKey]
      }
    });
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    const parsedSubs = initialSubcategoriesText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    addTicketCategory(newCategoryName, parsedSubs, defaultPriority);
    setNewCategoryName('');
    setInitialSubcategoriesText('');
    triggerSystemNotification('Categoria Criada', `A categoria "${newCategoryName}" foi adicionada com subcategorias.`, 'Configurações', 'Baixa');
  };

  const handleAddSubCategoryInline = (categoryId: number) => {
    const val = subCategoryInputs[categoryId]?.trim();
    if (!val) return;
    addSubCategory(categoryId, val);
    setSubCategoryInputs(prev => ({ ...prev, [categoryId]: '' }));
  };

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !companyCnpj.trim() || !companyAddress.trim()) return;
    addCompany({ name: companyName, cnpj: companyCnpj, address: companyAddress });
    setCompanyName('');
    setCompanyCnpj('');
    setCompanyAddress('');
    triggerSystemNotification('Empresa Cadastrada', `A empresa ${companyName} foi cadastrada com sucesso.`, 'Configurações', 'Baixa');
  };

  return (
    <div className="min-h-screen bg-[#0d141d] text-[#dfe2eb] flex flex-col font-sans selection:bg-[#45dfa4]/30 selection:text-[#45dfa4]">
      {/* Top Header */}
      <header className="bg-[#181c22] border-b border-[#2A2F3A] px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentScreen('ti_dashboard')}
            className="text-xs font-mono text-[#c3c6d7] hover:text-[#45dfa4] flex items-center gap-1.5 transition-all cursor-pointer bg-[#111827] px-3 py-1.5 rounded-lg border border-[#45dfa4]/50 hover:border-[#45dfa4] shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-[#45dfa4]" />
            <span>Voltar ao Dashboard</span>
          </button>
          <span className="text-[#434655]">|</span>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#45dfa4]" />
            <span>Gestão do Sistema &amp; Controle de Acesso</span>
          </h1>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 flex flex-col md:flex-row gap-6">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 space-y-2 shrink-0">
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between border ${
              activeTab === 'users'
                ? 'bg-[#45dfa4]/10 text-[#45dfa4] border-[#45dfa4]/40 shadow-lg shadow-[#45dfa4]/5'
                : 'bg-[#151c25] text-[#8d90a0] hover:text-white border-[#2A2F3A] hover:bg-[#181c22]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <UserPlus className="w-4 h-4 text-[#45dfa4]" />
              <span>Usuários &amp; Permissões</span>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-[#111827] text-[#c3c6d7]">
              {(managedUsers || []).length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between border ${
              activeTab === 'security'
                ? 'bg-[#ffb4ab]/10 text-[#ffb4ab] border-[#ffb4ab]/40 shadow-lg'
                : 'bg-[#151c25] text-[#8d90a0] hover:text-white border-[#2A2F3A] hover:bg-[#181c22]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-[#ffb4ab]" />
              <span>Segurança &amp; Contas T.I.</span>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-[#93000a]/40 text-[#ffb4ab] font-bold">
              {(managedUsers || []).filter(u => u.locked).length} Bloqueada(s)
            </span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between border ${
              activeTab === 'categories'
                ? 'bg-[#45dfa4]/10 text-[#45dfa4] border-[#45dfa4]/40 shadow-lg shadow-[#45dfa4]/5'
                : 'bg-[#151c25] text-[#8d90a0] hover:text-white border-[#2A2F3A] hover:bg-[#181c22]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FolderTree className="w-4 h-4 text-[#45dfa4]" />
              <span>Categorias e Subcategorias</span>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-[#111827] text-[#c3c6d7]">
              {(ticketCategories || []).length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('companies')}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between border ${
              activeTab === 'companies'
                ? 'bg-[#45dfa4]/10 text-[#45dfa4] border-[#45dfa4]/40 shadow-lg shadow-[#45dfa4]/5'
                : 'bg-[#151c25] text-[#8d90a0] hover:text-white border-[#2A2F3A] hover:bg-[#181c22]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-[#45dfa4]" />
              <span>Empresas Cadastradas</span>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-[#111827] text-[#c3c6d7]">
              {(companies || []).length}
            </span>
          </button>

          <div className="pt-4 border-t border-[#2A2F3A] p-3 rounded-xl bg-[#111827]/50 text-xs text-[#8d90a0] space-y-1">
            <p className="font-bold text-white flex items-center gap-1.5">
              <Kanban className="w-3.5 h-3.5 text-[#45dfa4]" />
              <span>Kanban Automático</span>
            </p>
            <p className="text-[11px] leading-relaxed">
              Cada usuário criado ganha automaticamente seu próprio Kanban isolado. Somente CEO, Gestor e T.I podem visualizar quadros de outros usuários.
            </p>
          </div>
        </div>

        {/* Dynamic Content Panel */}
        <div className="flex-1 bg-[#151c25] border border-[#2A2F3A] rounded-2xl p-6 shadow-2xl overflow-hidden">
          {/* TAB 1: USERS & ROLES MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#45dfa4]" />
                  <span>Cadastrar Novo Usuário e Atribuir Sistemas</span>
                </h2>
                <p className="text-xs text-[#8d90a0]">
                  Crie usuários para acessar o GoDesc Service Desk, defina os módulos liberados e seu perfil de autorização.
                </p>
              </div>

              {/* Add User Form */}
              <form onSubmit={handleAddUser} className="bg-[#111827] border border-[#2A2F3A] p-5 sm:p-6 rounded-xl space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-white flex items-center gap-1">
                      <UserIcon className="w-3.5 h-3.5 text-[#45dfa4]" />
                      <span>Nome Completo</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Carlos Silva"
                      className="w-full bg-[#151c25] border border-[#2A2F3A] focus:border-[#45dfa4] text-white rounded-lg p-2.5 text-xs focus:outline-none placeholder:text-[#8d90a0]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-white flex items-center gap-1">
                      <Key className="w-3.5 h-3.5 text-[#45dfa4]" />
                      <span>Usuário (Login) *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Ex: carlos.silva"
                      className="w-full bg-[#151c25] border border-[#2A2F3A] focus:border-[#45dfa4] text-white rounded-lg p-2.5 text-xs focus:outline-none placeholder:text-[#8d90a0]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-white flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-[#45dfa4]" />
                      <span>E-mail Corporativo</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="carlos@empresa.com"
                      className="w-full bg-[#151c25] border border-[#2A2F3A] focus:border-[#45dfa4] text-white rounded-lg p-2.5 text-xs focus:outline-none placeholder:text-[#8d90a0]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-white flex items-center gap-1">
                      <Key className="w-3.5 h-3.5 text-[#45dfa4]" />
                      <span>Senha de Acesso *</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#151c25] border border-[#2A2F3A] focus:border-[#45dfa4] text-white rounded-lg p-2.5 text-xs focus:outline-none placeholder:text-[#8d90a0]"
                    />
                  </div>
                </div>

                {/* Role selection & Preset */}
                <div className="pt-2 border-t border-[#2A2F3A]">
                  <label className="text-xs font-semibold text-white block mb-2">
                    Perfil / Função no Sistema (Role)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { id: 'n1', label: 'Analista N1', desc: 'Atendimento e Triagem' },
                      { id: 'n2', label: 'Analista N2', desc: 'Sistemas e Suporte' },
                      { id: 'n3', label: 'Analista N3', desc: 'Infraestrutura Avançada' },
                      { id: 'gestor', label: 'Gestor de TI', desc: 'Gerenciamento Total' },
                      { id: 'ceo', label: 'CEO / Diretoria', desc: 'Acesso Executivo Total' }
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => handleRolePreset(item.id as any)}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          role === item.id
                            ? 'bg-[#45dfa4]/15 border-[#45dfa4] text-white'
                            : 'bg-[#151c25] border-[#2A2F3A] text-[#8d90a0] hover:text-white hover:border-[#434655]'
                        }`}
                      >
                        <div className="text-xs font-bold flex items-center justify-between">
                          <span>{item.label}</span>
                          {role === item.id && <Check className="w-3.5 h-3.5 text-[#45dfa4]" />}
                        </div>
                        <p className="text-[10px] opacity-75 mt-0.5">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modules access checklist */}
                <div className="pt-2 border-t border-[#2A2F3A]">
                  <label className="text-xs font-semibold text-white block mb-2">
                    Módulos &amp; Telas que o Usuário Pode Acessar
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {AVAILABLE_MODULES.map((mod) => {
                      const isChecked = selectedModules.includes(mod.id);
                      return (
                        <label
                          key={mod.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                            isChecked
                              ? 'bg-[#181c22] border-[#45dfa4]/50 text-white'
                              : 'bg-[#151c25] border-[#2A2F3A] text-[#8d90a0]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleModuleSelection(mod.id)}
                            className="w-3.5 h-3.5 accent-[#45dfa4] rounded"
                          />
                          <span className="truncate">{mod.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Permissions toggles */}
                <div className="pt-2 border-t border-[#2A2F3A]">
                  <label className="text-xs font-semibold text-white block mb-2">
                    Permissões Especiais de Controle
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <label className="flex items-center gap-2 text-[#c3c6d7]">
                      <input
                        type="checkbox"
                        checked={permConfig}
                        onChange={e => setPermConfig(e.target.checked)}
                        className="accent-[#45dfa4]"
                      />
                      <span>Acessar Painel de Configurações</span>
                    </label>

                    <label className="flex items-center gap-2 text-[#c3c6d7]">
                      <input
                        type="checkbox"
                        checked={permEditTickets}
                        onChange={e => setPermEditTickets(e.target.checked)}
                        className="accent-[#45dfa4]"
                      />
                      <span>Editar Status de Chamados</span>
                    </label>

                    <label className="flex items-center gap-2 text-[#c3c6d7]">
                      <input
                        type="checkbox"
                        checked={permDeleteTickets}
                        onChange={e => setPermDeleteTickets(e.target.checked)}
                        className="accent-[#45dfa4]"
                      />
                      <span>Excluir Registros de Tickets</span>
                    </label>

                    <label className="flex items-center gap-2 text-[#c3c6d7]">
                      <input
                        type="checkbox"
                        checked={permManageUsers}
                        onChange={e => setPermManageUsers(e.target.checked)}
                        className="accent-[#45dfa4]"
                      />
                      <span>Criar e Alterar Usuários</span>
                    </label>

                    <label className="flex items-center gap-2 text-[#c3c6d7]">
                      <input
                        type="checkbox"
                        checked={permManageCategories}
                        onChange={e => setPermManageCategories(e.target.checked)}
                        className="accent-[#45dfa4]"
                      />
                      <span>Gerenciar Categorias &amp; Subcategorias</span>
                    </label>

                    <label className="flex items-center gap-2 text-[#45dfa4] font-semibold">
                      <input
                        type="checkbox"
                        checked={permViewAllKanbans}
                        onChange={e => setPermViewAllKanbans(e.target.checked)}
                        className="accent-[#45dfa4]"
                      />
                      <span>Visualizar Kanban de Todos Usuários</span>
                    </label>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-3 flex justify-end">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-3 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#45dfa4]/10"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Criar Usuário &amp; Gerar Kanban Isolado</span>
                  </button>
                </div>
              </form>

              {/* Users Table */}
              <div>
                <h3 className="text-sm font-bold text-white mb-3">Usuários Cadastrados no Sistema</h3>
                <div className="overflow-x-auto border border-[#2A2F3A] rounded-xl">
                  <table className="w-full text-left text-xs text-[#c3c6d7]">
                    <thead className="bg-[#111827] text-[#8d90a0] font-mono border-b border-[#2A2F3A]">
                      <tr>
                        <th className="p-3">Nome / E-mail</th>
                        <th className="p-3">Usuário</th>
                        <th className="p-3">Perfil / Função</th>
                        <th className="p-3">Status Segurança</th>
                        <th className="p-3">Ver Kanban Geral</th>
                        <th className="p-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A2F3A] bg-[#111827]/40">
                      {(managedUsers || []).map((u) => (
                        <tr key={u.id} className="hover:bg-[#181c22] transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-white">{u.name}</div>
                            <div className="text-[10px] text-[#8d90a0] font-mono">{u.email}</div>
                          </td>
                          <td className="p-3 font-mono text-[#45dfa4]">@{u.username}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                                u.role === 'ceo' || u.role === 'gestor'
                                  ? 'bg-[#ffb4ab]/15 text-[#ffb4ab] border-[#ffb4ab]/30'
                                  : u.role === 'n3'
                                  ? 'bg-[#ffb95f]/15 text-[#ffb95f] border-[#ffb95f]/30'
                                  : 'bg-[#45dfa4]/15 text-[#45dfa4] border-[#45dfa4]/30'
                              }`}
                            >
                              {u.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3">
                            {u.locked ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#93000a]/30 text-[#ffb4ab] border border-[#ffb4ab]/40 flex items-center gap-1 w-max">
                                <Lock className="w-3 h-3" />
                                <span>BLOQUEADO ({u.failed_login_attempts || 3}/3)</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#45dfa4]/15 text-[#45dfa4] border border-[#45dfa4]/30 flex items-center gap-1 w-max">
                                <ShieldCheck className="w-3 h-3" />
                                <span>ATIVA</span>
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {u.role === 'ceo' || u.role === 'gestor' || u.role === 'admin' || u.permissions?.canViewAllKanbans ? (
                              <span className="text-[#45dfa4] text-[10px] font-mono bg-[#45dfa4]/10 border border-[#45dfa4]/30 px-2 py-0.5 rounded-full">
                                Sim (Acesso Geral)
                              </span>
                            ) : (
                              <span className="text-[#8d90a0] text-[10px] font-mono bg-[#151c25] border border-[#2A2F3A] px-2 py-0.5 rounded-full">
                                Não (Apenas o Seu)
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right space-x-2">
                            {u.locked && (
                              <button
                                onClick={() => {
                                  const res = unlockUserAccount(u.id);
                                  alert(res.message);
                                }}
                                className="p-1.5 bg-[#45dfa4]/20 hover:bg-[#45dfa4]/40 text-[#45dfa4] border border-[#45dfa4]/40 rounded-lg transition-colors inline-flex items-center gap-1"
                                title="Desbloquear Conta T.I."
                              >
                                <Unlock className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold">Desbloquear</span>
                              </button>
                            )}

                            <button
                              onClick={() => setEditingUser(u)}
                              className="p-1.5 bg-[#181c22] hover:bg-[#283240] text-[#c3c6d7] hover:text-white border border-[#2A2F3A] rounded-lg transition-colors"
                              title="Editar Usuário & Permissões"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {u.username !== userSession.username &&
                              (userSession.role === 'admin' ||
                                userSession.role === 'ceo' ||
                                userSession.role === 'gestor' ||
                                userSession.permissions?.canManageUsers ||
                                !userSession.isAuthenticated) && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Deseja excluir permanentemente o usuário @${u.username} (${u.name})?`)) {
                                      deleteManagedUser(u.id);
                                      triggerSystemNotification(
                                        'Usuário Excluído',
                                        `O usuário @${u.username} foi removido com sucesso.`,
                                        'Configurações',
                                        'Baixa'
                                      );
                                    }
                                  }}
                                  className="p-1.5 bg-[#181c22] hover:bg-[#283240] text-[#8d90a0] hover:text-[#ffb4ab] border border-[#2A2F3A] rounded-lg transition-colors"
                                  title="Excluir Usuário"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SECURITY & TI ACCOUNTS AUDITING */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-[#ffb4ab]" />
                  <span>Painel de Segurança &amp; Auditoria de Contas T.I.</span>
                </h2>
                <p className="text-xs text-[#8d90a0]">
                  Monitore contas bloqueadas por brute-force (3 tentativas incorretas) e efetue o desbloqueio manual de acordo com suas permissões.
                </p>
              </div>

              {/* Security Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#111827] border border-[#2A2F3A] p-4 rounded-xl space-y-1">
                  <span className="text-[11px] font-mono text-[#8d90a0] block">Contas Cadastradas</span>
                  <div className="text-xl font-bold text-white">{managedUsers.length}</div>
                </div>

                <div className="bg-[#111827] border border-[#93000a]/40 p-4 rounded-xl space-y-1">
                  <span className="text-[11px] font-mono text-[#ffb4ab] block">Contas Bloqueadas</span>
                  <div className="text-xl font-bold text-[#ffb4ab]">
                    {managedUsers.filter(u => u.locked).length}
                  </div>
                </div>

                <div className="bg-[#111827] border border-[#2A2F3A] p-4 rounded-xl space-y-1">
                  <span className="text-[11px] font-mono text-[#45dfa4] block">Eventos Auditados</span>
                  <div className="text-xl font-bold text-[#45dfa4]">{auditLogs.length}</div>
                </div>
              </div>

              {/* Accounts Status Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Status de Segurança por Conta</h3>
                  <button
                    onClick={() => setCurrentScreen('ti_audit_logs')}
                    className="text-xs font-mono text-[#45dfa4] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Ver Logs Completos de Auditoria →</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-[#2A2F3A] rounded-xl">
                  <table className="w-full text-left text-xs text-[#c3c6d7]">
                    <thead className="bg-[#111827] text-[#8d90a0] font-mono border-b border-[#2A2F3A]">
                      <tr>
                        <th className="p-3">Usuário</th>
                        <th className="p-3">Nome / Perfil</th>
                        <th className="p-3">Erros de Login</th>
                        <th className="p-3">Estado da Conta</th>
                        <th className="p-3">Última Falha</th>
                        <th className="p-3 text-right">Desbloqueio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A2F3A] bg-[#111827]/40">
                      {managedUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-[#181c22] transition-colors">
                          <td className="p-3 font-mono font-bold text-[#45dfa4]">@{u.username}</td>
                          <td className="p-3">
                            <div className="text-white font-semibold">{u.name}</div>
                            <div className="text-[10px] text-[#8d90a0] uppercase">{u.role}</div>
                          </td>
                          <td className="p-3 font-mono font-bold">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] ${
                                (u.failed_login_attempts || 0) >= 3
                                  ? 'bg-[#93000a]/40 text-[#ffb4ab] border border-[#ffb4ab]/40'
                                  : (u.failed_login_attempts || 0) > 0
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-gray-500/10 text-[#8d90a0]'
                              }`}
                            >
                              {u.failed_login_attempts || 0} / 3 tentativas
                            </span>
                          </td>
                          <td className="p-3">
                            {u.locked ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#93000a]/40 text-[#ffb4ab] border border-[#ffb4ab]/50 flex items-center gap-1.5 w-max animate-pulse">
                                <Lock className="w-3 h-3" />
                                <span>BLOQUEADA</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#45dfa4]/15 text-[#45dfa4] border border-[#45dfa4]/30 flex items-center gap-1.5 w-max">
                                <ShieldCheck className="w-3 h-3" />
                                <span>REGULAR</span>
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-[10px] text-[#8d90a0]">
                            {u.last_failed_login_at || u.locked_at || '-'}
                          </td>
                          <td className="p-3 text-right">
                            {u.locked ? (
                              <button
                                onClick={() => {
                                  const res = unlockUserAccount(u.id);
                                  alert(res.message);
                                }}
                                className="px-3 py-1.5 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 ml-auto shadow-md"
                              >
                                <Unlock className="w-3.5 h-3.5" />
                                <span>Desbloquear Conta</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-[#8d90a0] font-mono">Não Bloqueada</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CATEGORIES & SUBCATEGORIES CRUD */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-[#45dfa4]" />
                  <span>Gerenciamento de Categorias &amp; Subcategorias</span>
                </h2>
                <p className="text-xs text-[#8d90a0]">
                  Adicione, edite ou remova categorias e subcategorias disponíveis no formulário de abertura de chamados dos clientes.
                </p>
              </div>

              {/* Add Category Form */}
              <form onSubmit={handleAddCategory} className="bg-[#111827] border border-[#2A2F3A] p-5 rounded-xl space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-white">Nome da Nova Categoria *</label>
                    <input
                      type="text"
                      required
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Ex: Sistemas Fiscais / Nota Fiscal"
                      className="w-full bg-[#151c25] border border-[#2A2F3A] focus:border-[#45dfa4] text-white rounded-lg p-2.5 text-xs focus:outline-none placeholder:text-[#8d90a0]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-white">Subcategorias Iniciais (Separadas por vírgula)</label>
                    <input
                      type="text"
                      value={initialSubcategoriesText}
                      onChange={(e) => setInitialSubcategoriesText(e.target.value)}
                      placeholder="Ex: Emissão NFe, Certificado Digital, Erro de Transmissão"
                      className="w-full bg-[#151c25] border border-[#2A2F3A] focus:border-[#45dfa4] text-white rounded-lg p-2.5 text-xs focus:outline-none placeholder:text-[#8d90a0]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-white">Prioridade Padrão</label>
                    <select
                      value={defaultPriority}
                      onChange={(e) => setDefaultPriority(e.target.value as TicketPriority)}
                      className="w-full bg-[#151c25] border border-[#2A2F3A] focus:border-[#45dfa4] text-white rounded-lg p-2.5 text-xs focus:outline-none"
                    >
                      <option value="Baixa">Baixa</option>
                      <option value="Média">Média</option>
                      <option value="Alta">Alta</option>
                      <option value="Crítica">Crítica</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold rounded-lg text-xs flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Criar Categoria</span>
                  </button>
                </div>
              </form>

              {/* Category Cards with Subcategories badges & inline addition */}
              <div className="space-y-4">
                {(ticketCategories || []).map((cat) => (
                  <div
                    key={cat.id}
                    className="bg-[#111827] border border-[#2A2F3A] hover:border-[#434655] rounded-xl p-5 transition-colors space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-[#45dfa4]" />
                        <h3 className="text-sm font-bold text-white">{cat.name}</h3>
                        <span className="text-[10px] font-mono bg-[#151c25] border border-[#2A2F3A] px-2 py-0.5 rounded text-[#8d90a0]">
                          Prioridade Padrão: {cat.defaultPriority || 'Média'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingCategory({ id: cat.id, name: cat.name, subcategories: cat.subcategories })}
                          className="p-1.5 text-[#8d90a0] hover:text-[#45dfa4] transition-colors"
                          title="Editar Categoria"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Deseja excluir a categoria "${cat.name}"?`)) {
                              deleteTicketCategory(cat.id);
                            }
                          }}
                          className="p-1.5 text-[#8d90a0] hover:text-[#ffb4ab] transition-colors"
                          title="Excluir Categoria"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Subcategory Badges list */}
                    <div className="pt-2 border-t border-[#2A2F3A]/60">
                      <label className="text-[11px] font-mono text-[#8d90a0] uppercase block mb-2">
                        Subcategorias ({cat.subcategories?.length || 0}):
                      </label>
                      <div className="flex flex-wrap gap-2 items-center">
                        {(cat.subcategories || []).map((sub, sIdx) => (
                          <span
                            key={sIdx}
                            className="bg-[#151c25] border border-[#2A2F3A] text-white px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 group hover:border-[#45dfa4]/50 transition-colors"
                          >
                            <Tag className="w-3 h-3 text-[#45dfa4]" />
                            <span>{sub}</span>
                            <button
                              onClick={() => deleteSubCategory(cat.id, sub)}
                              className="text-[#8d90a0] hover:text-[#ffb4ab] opacity-60 group-hover:opacity-100 transition-opacity ml-0.5"
                              title="Remover subcategoria"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}

                        {/* Inline input to add subcategory */}
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={subCategoryInputs[cat.id] || ''}
                            onChange={(e) => setSubCategoryInputs({ ...subCategoryInputs, [cat.id]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddSubCategoryInline(cat.id);
                              }
                            }}
                            placeholder="+ Nova subcategoria..."
                            className="bg-[#151c25] border border-[#2A2F3A] focus:border-[#45dfa4] text-white text-xs px-2.5 py-1 rounded-lg focus:outline-none w-44 placeholder:text-[#8d90a0]"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddSubCategoryInline(cat.id)}
                            className="p-1 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 rounded-lg text-xs transition-colors"
                            title="Adicionar Subcategoria"
                          >
                            <Plus className="w-3.5 h-3.5 font-bold" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: COMPANIES REGISTRATION */}
          {activeTab === 'companies' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#45dfa4]" />
                  <span>Cadastro de Empresas Clientes</span>
                </h2>
                <p className="text-xs text-[#8d90a0]">
                  Gerencie as organizações que possuem contrato ativo de Service Desk.
                </p>
              </div>

              <form onSubmit={handleAddCompany} className="bg-[#111827] border border-[#2A2F3A] p-5 rounded-xl space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-white">Razão Social / Nome da Empresa *</label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Ex: Empresa Alpha Tecnologia Ltda"
                      className="w-full bg-[#151c25] border border-[#2A2F3A] focus:border-[#45dfa4] text-white rounded-lg p-2.5 text-xs focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-white">CNPJ *</label>
                    <input
                      type="text"
                      required
                      value={companyCnpj}
                      onChange={(e) => setCompanyCnpj(e.target.value)}
                      placeholder="11.222.333/0001-99"
                      className="w-full bg-[#151c25] border border-[#2A2F3A] focus:border-[#45dfa4] text-white rounded-lg p-2.5 text-xs focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-white">Endereço Principal *</label>
                    <input
                      type="text"
                      required
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      placeholder="Av. Paulista, 1000 - São Paulo/SP"
                      className="w-full bg-[#151c25] border border-[#2A2F3A] focus:border-[#45dfa4] text-white rounded-lg p-2.5 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold rounded-lg text-xs flex items-center gap-2 transition-colors"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Cadastrar Empresa</span>
                  </button>
                </div>
              </form>

              <div className="overflow-hidden border border-[#2A2F3A] rounded-xl">
                <table className="w-full text-left text-xs text-[#c3c6d7]">
                  <thead className="bg-[#111827] text-[#8d90a0] font-mono border-b border-[#2A2F3A]">
                    <tr>
                      <th className="p-3">Razão Social</th>
                      <th className="p-3">CNPJ</th>
                      <th className="p-3">Endereço</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2F3A] bg-[#111827]/40">
                    {(companies || []).map((c) => (
                      <tr key={c.id} className="hover:bg-[#181c22] transition-colors">
                        <td className="p-3 text-white font-bold">{c.name}</td>
                        <td className="p-3 font-mono text-[#45dfa4]">{c.cnpj}</td>
                        <td className="p-3">{c.address}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              if (confirm(`Deseja remover a empresa "${c.name}"?`)) {
                                deleteCompany(c.id);
                              }
                            }}
                            className="p-1.5 bg-[#181c22] hover:bg-[#283240] text-[#8d90a0] hover:text-[#ffb4ab] border border-[#2A2F3A] rounded-lg transition-colors"
                            title="Remover Empresa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal: Edit User */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181c22] border border-[#2A2F3A] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2F3A]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#45dfa4]" />
                <span>Editar Usuário: @{editingUser.username}</span>
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-[#8d90a0] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#8d90a0] mb-1 font-semibold">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={editingUser.name}
                    onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full bg-[#111827] border border-[#2A2F3A] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#45dfa4]"
                  />
                </div>

                <div>
                  <label className="block text-[#8d90a0] mb-1 font-semibold">Usuário (Login)</label>
                  <input
                    type="text"
                    required
                    value={editingUser.username}
                    onChange={e => setEditingUser({ ...editingUser, username: e.target.value })}
                    className="w-full bg-[#111827] border border-[#2A2F3A] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#45dfa4]"
                  />
                </div>

                <div>
                  <label className="block text-[#8d90a0] mb-1 font-semibold">E-mail Corporativo</label>
                  <input
                    type="email"
                    required
                    value={editingUser.email}
                    onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full bg-[#111827] border border-[#2A2F3A] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#45dfa4]"
                  />
                </div>

                <div>
                  <label className="block text-[#8d90a0] mb-1 font-semibold">Alterar Senha</label>
                  <input
                    type="password"
                    value={editingUser.password || ''}
                    onChange={e => setEditingUser({ ...editingUser, password: e.target.value })}
                    placeholder="Deixe em branco para não alterar"
                    className="w-full bg-[#111827] border border-[#2A2F3A] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#45dfa4]"
                  />
                </div>
              </div>

              {/* Perfil / Role Presets */}
              <div className="pt-2 border-t border-[#2A2F3A]">
                <label className="block text-white font-semibold mb-2">Perfil / Função no Sistema (Role)</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'n1', label: 'Analista N1', desc: 'Atendimento e Triagem' },
                    { id: 'n2', label: 'Analista N2', desc: 'Sistemas e Suporte' },
                    { id: 'n3', label: 'Analista N3', desc: 'Infraestrutura' },
                    { id: 'gestor', label: 'Gestor TI', desc: 'Gerenciamento' },
                    { id: 'ceo', label: 'CEO / Diretoria', desc: 'Acesso Total' }
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => handleEditUserRolePreset(item.id as any)}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        editingUser.role === item.id
                          ? 'bg-[#45dfa4]/15 border-[#45dfa4] text-white'
                          : 'bg-[#111827] border-[#2A2F3A] text-[#8d90a0] hover:text-white'
                      }`}
                    >
                      <div className="text-[11px] font-bold flex items-center justify-between">
                        <span>{item.label}</span>
                        {editingUser.role === item.id && <Check className="w-3 h-3 text-[#45dfa4]" />}
                      </div>
                      <p className="text-[9px] opacity-75 mt-0.5">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Módulos Liberados */}
              <div className="pt-2 border-t border-[#2A2F3A]">
                <label className="block text-white font-semibold mb-2">Módulos &amp; Telas Liberadas</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {AVAILABLE_MODULES.map((mod) => {
                    const isChecked = (editingUser.allowedModules || []).includes(mod.id);
                    return (
                      <label
                        key={mod.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-[11px] cursor-pointer select-none transition-colors ${
                          isChecked
                            ? 'bg-[#111827] border-[#45dfa4]/50 text-white'
                            : 'bg-[#111827]/50 border-[#2A2F3A] text-[#8d90a0]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleEditUserModule(mod.id)}
                          className="w-3.5 h-3.5 accent-[#45dfa4] rounded"
                        />
                        <span className="truncate">{mod.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Permissões Especiais */}
              <div className="pt-2 border-t border-[#2A2F3A]">
                <label className="block text-white font-semibold mb-2">Permissões Especiais de Controle</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <label className="flex items-center gap-2 text-[#c3c6d7]">
                    <input
                      type="checkbox"
                      checked={!!editingUser.permissions?.canAccessConfig}
                      onChange={() => toggleEditUserPermission('canAccessConfig')}
                      className="accent-[#45dfa4]"
                    />
                    <span>Acessar Configurações</span>
                  </label>

                  <label className="flex items-center gap-2 text-[#c3c6d7]">
                    <input
                      type="checkbox"
                      checked={!!editingUser.permissions?.canEditTickets}
                      onChange={() => toggleEditUserPermission('canEditTickets')}
                      className="accent-[#45dfa4]"
                    />
                    <span>Editar Status</span>
                  </label>

                  <label className="flex items-center gap-2 text-[#c3c6d7]">
                    <input
                      type="checkbox"
                      checked={!!editingUser.permissions?.canDeleteTickets}
                      onChange={() => toggleEditUserPermission('canDeleteTickets')}
                      className="accent-[#45dfa4]"
                    />
                    <span>Excluir Tickets</span>
                  </label>

                  <label className="flex items-center gap-2 text-[#c3c6d7]">
                    <input
                      type="checkbox"
                      checked={!!editingUser.permissions?.canManageUsers}
                      onChange={() => toggleEditUserPermission('canManageUsers')}
                      className="accent-[#45dfa4]"
                    />
                    <span>Criar / Alterar Usuários</span>
                  </label>

                  <label className="flex items-center gap-2 text-[#c3c6d7]">
                    <input
                      type="checkbox"
                      checked={!!editingUser.permissions?.canManageCategories}
                      onChange={() => toggleEditUserPermission('canManageCategories')}
                      className="accent-[#45dfa4]"
                    />
                    <span>Gerenciar Categorias</span>
                  </label>

                  <label className="flex items-center gap-2 text-[#45dfa4] font-semibold">
                    <input
                      type="checkbox"
                      checked={!!editingUser.permissions?.canViewAllKanbans}
                      onChange={() => toggleEditUserPermission('canViewAllKanbans')}
                      className="accent-[#45dfa4]"
                    />
                    <span>Ver Kanban Geral</span>
                  </label>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-[#2A2F3A] flex items-center justify-between gap-3">
                {editingUser.username !== userSession.username &&
                  (userSession.role === 'admin' ||
                    userSession.role === 'ceo' ||
                    userSession.role === 'gestor' ||
                    userSession.permissions?.canManageUsers ||
                    !userSession.isAuthenticated) ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Deseja excluir permanentemente o usuário @${editingUser.username}?`)) {
                        deleteManagedUser(editingUser.id);
                        setEditingUser(null);
                        triggerSystemNotification('Usuário Excluído', `O usuário @${editingUser.username} foi removido.`, 'Configurações', 'Baixa');
                      }
                    }}
                    className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Usuário</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2.5 bg-[#1f2630] hover:bg-[#283240] text-[#c3c6d7] rounded-xl font-semibold text-xs transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-[#45dfa4]/10"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Alterações</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Category */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181c22] border border-[#2A2F3A] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2F3A]">
              <h3 className="text-base font-bold text-white">Editar Categoria</h3>
              <button onClick={() => setEditingCategory(null)} className="text-[#8d90a0] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                editTicketCategory(editingCategory.id, editingCategory.name, editingCategory.subcategories);
                setEditingCategory(null);
                triggerSystemNotification('Categoria Editada', 'Nome da categoria atualizado com sucesso.', 'Configurações', 'Baixa');
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-[#8d90a0] mb-1">Nome da Categoria</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full bg-[#111827] border border-[#2A2F3A] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#45dfa4]"
                />
              </div>

              <div className="pt-3 border-t border-[#2A2F3A] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 bg-[#1f2630] text-[#c3c6d7] rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#45dfa4] text-gray-950 font-bold rounded-lg"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
