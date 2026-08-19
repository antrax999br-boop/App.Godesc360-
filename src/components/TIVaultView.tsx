import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { VaultCredential } from '../types';
import {
  Key,
  Plus,
  Search,
  Copy,
  Check,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Lock,
  ArrowLeft,
  Filter,
  ShieldCheck,
  Building,
  User,
  FileText,
  Clock,
  Sparkles,
  X
} from 'lucide-react';

export const TIVaultView: React.FC = () => {
  const {
    setCurrentScreen,
    vaultCredentials,
    addVaultCredential,
    updateVaultCredential,
    deleteVaultCredential,
    companies,
    userSession
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedCompany, setSelectedCompany] = useState<string>('Todas as empresas');

  // Password visibility state per credential ID
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  // Copied state per key string (e.g., 'user-id' or 'pass-id')
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<VaultCredential | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    title: string;
    company: string;
    category: 'E-mail' | 'VPN' | 'Servidor' | 'Rede' | 'Acesso' | 'Outros';
    username: string;
    password?: string;
    notes?: string;
    accessLevel: 'Todos' | 'Apenas N2/N3' | 'Apenas Gestores';
  }>({
    title: '',
    company: 'Empresa ABC',
    category: 'E-mail',
    username: '',
    password: '',
    notes: '',
    accessLevel: 'Todos'
  });

  const categoriesList = ['Todas', 'E-mail', 'VPN', 'Servidor', 'Rede', 'Acesso', 'Outros'];

  // Toggle password visibility
  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Copy helper
  const handleCopy = (text: string, keyId: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Password strength calculator
  const calculateStrength = (pwd: string): 'Fraca' | 'Média' | 'Forte' => {
    if (!pwd || pwd.length < 6) return 'Fraca';
    const hasNumbers = /\d/.test(pwd);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    if (pwd.length >= 10 && hasNumbers && hasSpecial && hasUpper) return 'Forte';
    if (pwd.length >= 8 && (hasNumbers || hasSpecial)) return 'Média';
    return 'Fraca';
  };

  // Generate random strong password
  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    let newPass = '';
    for (let i = 0; i < 14; i++) {
      newPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: newPass }));
  };

  // Open modal for new
  const handleOpenNewModal = () => {
    setEditingCredential(null);
    setFormData({
      title: '',
      company: companies?.[0]?.name || 'Empresa ABC',
      category: 'E-mail',
      username: '',
      password: '',
      notes: '',
      accessLevel: 'Todos'
    });
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEditModal = (cred: VaultCredential) => {
    setEditingCredential(cred);
    setFormData({
      title: cred.title,
      company: cred.company,
      category: cred.category,
      username: cred.username,
      password: cred.password || '',
      notes: cred.notes || '',
      accessLevel: cred.accessLevel
    });
    setIsModalOpen(true);
  };

  // Handle Save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const strength = calculateStrength(formData.password || '');

    if (editingCredential) {
      updateVaultCredential(editingCredential.id, {
        ...formData,
        strength,
        updatedAt: new Date().toLocaleString('pt-BR'),
        updatedBy: userSession.name || 'T.I.'
      });
    } else {
      addVaultCredential({
        ...formData,
        strength,
        updatedAt: new Date().toLocaleString('pt-BR'),
        updatedBy: userSession.name || 'T.I.'
      });
    }
    setIsModalOpen(false);
  };

  // Filtered List
  const filteredCredentials = vaultCredentials.filter((cred) => {
    // Category filter
    if (selectedCategory !== 'Todas' && cred.category !== selectedCategory) {
      return false;
    }
    // Company filter
    if (selectedCompany !== 'Todas as empresas' && cred.company !== selectedCompany) {
      return false;
    }
    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTitle = cred.title.toLowerCase().includes(term);
      const matchUser = cred.username.toLowerCase().includes(term);
      const matchNotes = (cred.notes || '').toLowerCase().includes(term);
      const matchCompany = cred.company.toLowerCase().includes(term);
      return matchTitle || matchUser || matchNotes || matchCompany;
    }
    return true;
  });

  return (
    <div className="bg-[#1e1e24] min-h-screen text-[#dfe2eb] font-sans flex flex-col selection:bg-[#45dfa4]/30 selection:text-[#45dfa4]">
      {/* Top Header matching Screenshots */}
      <header className="bg-[#18181b] border-b border-[#27272a] px-4 sm:px-6 md:px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentScreen('ti_dashboard')}
            className="text-xs font-mono text-[#c3c6d7] hover:text-[#45dfa4] flex items-center gap-1.5 transition-all cursor-pointer bg-[#1e1e24] px-3 py-1.5 rounded-lg border border-[#45dfa4]/50 hover:border-[#45dfa4] shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-[#45dfa4]" />
            <span>Voltar ao Dashboard</span>
          </button>
          <span className="text-[#434655]">|</span>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Key className="w-5 h-5 text-[#45dfa4]" />
              <span>Cofre de Senhas</span>
            </h1>
            <p className="text-xs text-[#8d90a0]">Gerenciamento seguro de credenciais</p>
          </div>
        </div>

        {/* Right Action: + Nova Credencial in Standard System Green! */}
        <button
          onClick={handleOpenNewModal}
          className="px-4 py-2 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-[#45dfa4]/20 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-gray-950" />
          <span>+ Nova Credencial</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 space-y-6 max-w-[1700px] mx-auto w-full">
        {/* Filters Toolbar matching Screenshot */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-4 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[280px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8d90a0]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar credenciais..."
                className="w-full bg-[#1e1e24] border border-[#27272a] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-[#8d90a0] focus:outline-none focus:border-[#45dfa4] transition-all font-mono"
              />
            </div>

            {/* Filter by Company Dropdown */}
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-[#8d90a0]" />
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="bg-[#1e1e24] border border-[#27272a] text-white text-xs rounded-xl px-3.5 py-2 focus:outline-none focus:border-[#45dfa4] cursor-pointer font-mono"
              >
                <option value="Todas as empresas">Filtrar por empresa...</option>
                {companies?.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-[#27272a]/60">
            <span className="text-xs font-mono text-[#8d90a0] mr-1">Categorias:</span>
            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#45dfa4] text-gray-950 font-bold shadow-md shadow-[#45dfa4]/20'
                    : 'bg-[#1e1e24] text-[#c3c6d7] hover:text-white border border-[#27272a]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Credentials Cards List */}
        <div className="space-y-4">
          {filteredCredentials.length > 0 ? (
            filteredCredentials.map((cred) => {
              const isPasswordVisible = !!visiblePasswords[cred.id];
              const isUserCopied = copiedKey === `user-${cred.id}`;
              const isPassCopied = copiedKey === `pass-${cred.id}`;

              return (
                <div
                  key={cred.id}
                  className="bg-[#18181b] border border-[#27272a] rounded-2xl p-5 shadow-xl hover:border-[#45dfa4]/40 transition-all space-y-4"
                >
                  {/* Card Title & Company */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#27272a] pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#45dfa4]/10 border border-[#45dfa4]/30 flex items-center justify-center text-[#45dfa4]">
                        <Key className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white tracking-wide">
                          {cred.title}
                        </h3>
                        <p className="text-xs text-[#8d90a0] font-mono flex items-center gap-1.5">
                          <Building className="w-3 h-3 text-[#45dfa4]" />
                          <span>{cred.company}</span>
                        </p>
                      </div>
                    </div>

                    {/* Card Actions (View / Edit / Delete) */}
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        onClick={() => togglePasswordVisibility(cred.id)}
                        className="p-2 bg-[#1e1e24] hover:bg-[#27272a] border border-[#27272a] rounded-lg text-[#c3c6d7] hover:text-white transition-colors cursor-pointer"
                        title={isPasswordVisible ? 'Ocultar Senha' : 'Mostrar Senha'}
                      >
                        {isPasswordVisible ? (
                          <EyeOff className="w-4 h-4 text-[#ffb4ab]" />
                        ) : (
                          <Eye className="w-4 h-4 text-[#45dfa4]" />
                        )}
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(cred)}
                        className="p-2 bg-[#1e1e24] hover:bg-[#27272a] border border-[#27272a] rounded-lg text-[#c3c6d7] hover:text-white transition-colors cursor-pointer"
                        title="Editar Credencial"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => deleteVaultCredential(cred.id)}
                        className="p-2 bg-[#1e1e24] hover:bg-[#93000a]/20 border border-[#27272a] hover:border-[#ffb4ab]/50 rounded-lg text-[#8d90a0] hover:text-[#ffb4ab] transition-colors cursor-pointer"
                        title="Excluir Credencial"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Fields Grid (Usuário, Senha, Notas) */}
                  <div className="space-y-3">
                    {/* Field 1: Usuário */}
                    <div>
                      <label className="block text-[11px] font-mono text-[#8d90a0] mb-1">
                        Usuário
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[#1e1e24] border border-[#27272a] rounded-xl px-3.5 py-2 text-xs font-mono text-white flex items-center justify-between">
                          <span>{cred.username || '-'}</span>
                        </div>
                        <button
                          onClick={() => handleCopy(cred.username, `user-${cred.id}`)}
                          className="p-2 bg-[#1e1e24] hover:bg-[#27272a] border border-[#27272a] rounded-xl text-[#c3c6d7] hover:text-white transition-colors cursor-pointer"
                          title="Copiar Usuário"
                        >
                          {isUserCopied ? (
                            <Check className="w-4 h-4 text-[#45dfa4]" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Field 2: Senha */}
                    <div>
                      <label className="block text-[11px] font-mono text-[#8d90a0] mb-1">
                        Senha
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[#1e1e24] border border-[#27272a] rounded-xl px-3.5 py-2 text-xs font-mono text-white flex items-center justify-between">
                          <span className={isPasswordVisible ? 'text-[#45dfa4] font-bold' : 'tracking-widest text-[#8d90a0]'}>
                            {isPasswordVisible ? (cred.password || '(sem senha)') : '••••••••••••'}
                          </span>
                        </div>

                        <button
                          onClick={() => togglePasswordVisibility(cred.id)}
                          className="p-2 bg-[#1e1e24] hover:bg-[#27272a] border border-[#27272a] rounded-xl text-[#c3c6d7] hover:text-white transition-colors cursor-pointer"
                          title={isPasswordVisible ? 'Ocultar' : 'Visualizar'}
                        >
                          {isPasswordVisible ? (
                            <EyeOff className="w-4 h-4 text-[#ffb4ab]" />
                          ) : (
                            <Eye className="w-4 h-4 text-[#45dfa4]" />
                          )}
                        </button>

                        <button
                          onClick={() => handleCopy(cred.password || '', `pass-${cred.id}`)}
                          className="p-2 bg-[#1e1e24] hover:bg-[#27272a] border border-[#27272a] rounded-xl text-[#c3c6d7] hover:text-white transition-colors cursor-pointer"
                          title="Copiar Senha"
                        >
                          {isPassCopied ? (
                            <Check className="w-4 h-4 text-[#45dfa4]" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Field 3: Notas */}
                    {cred.notes && (
                      <div>
                        <label className="block text-[11px] font-mono text-[#8d90a0] mb-1">
                          Notas / Detalhes de Acesso
                        </label>
                        <div className="bg-[#1e1e24] border border-[#27272a] rounded-xl p-3 text-xs font-mono text-[#c3c6d7] whitespace-pre-wrap leading-relaxed">
                          {cred.notes}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#27272a]/60 text-[11px] font-mono">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[#8d90a0]">Categoria:</span>
                      <span className="px-2 py-0.5 rounded bg-[#2563eb]/20 text-[#b4c5ff] border border-[#2563eb]/30 font-bold">
                        {cred.category}
                      </span>

                      <span className="text-[#8d90a0] ml-2">Acesso:</span>
                      <span className="px-2 py-0.5 rounded bg-[#27272a] text-white">
                        {cred.accessLevel}
                      </span>

                      <span className="text-[#8d90a0] ml-2">Força:</span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold border ${
                          cred.strength === 'Fraca'
                            ? 'bg-[#ffb4ab]/20 text-[#ffb4ab] border-[#ffb4ab]/30'
                            : cred.strength === 'Média'
                            ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30'
                            : 'bg-[#45dfa4]/20 text-[#45dfa4] border-[#45dfa4]/30'
                        }`}
                      >
                        {cred.strength}
                      </span>
                    </div>

                    <div className="text-[10px] text-[#8d90a0] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Atualizado em: {cred.updatedAt}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-12 text-center space-y-3">
              <Lock className="w-12 h-12 text-[#8d90a0] mx-auto opacity-40" />
              <h3 className="text-base font-bold text-white">Nenhuma credencial encontrada</h3>
              <p className="text-xs text-[#8d90a0] max-w-sm mx-auto">
                Utilize o botão acima para adicionar senhas de e-mail, VPN, servidores e acessos corporativos dos seus clientes.
              </p>
              <button
                onClick={handleOpenNewModal}
                className="mt-2 px-4 py-2 bg-[#45dfa4] text-gray-950 font-bold text-xs rounded-xl inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Primeira Credencial</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modal Overlay for Add/Edit Credential */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#27272a]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#45dfa4]/10 border border-[#45dfa4]/40 flex items-center justify-center text-[#45dfa4]">
                  <Key className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white">
                  {editingCredential ? 'Editar Credencial' : 'Nova Credencial de Acesso'}
                </h2>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#8d90a0] hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Título */}
                <div>
                  <label className="block text-xs font-mono text-[#8d90a0] mb-1">
                    Título / Identificador *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Henrique Leal ou VPN Matriz"
                    className="w-full bg-[#1e1e24] border border-[#27272a] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-[#8d90a0] focus:outline-none focus:border-[#45dfa4]"
                  />
                </div>

                {/* Cliente / Empresa */}
                <div>
                  <label className="block text-xs font-mono text-[#8d90a0] mb-1">
                    Empresa / Cliente *
                  </label>
                  <select
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full bg-[#1e1e24] border border-[#27272a] text-white text-xs rounded-xl px-3.5 py-2 focus:outline-none focus:border-[#45dfa4]"
                  >
                    {companies?.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Categoria */}
                <div>
                  <label className="block text-xs font-mono text-[#8d90a0] mb-1">
                    Categoria *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as any
                      })
                    }
                    className="w-full bg-[#1e1e24] border border-[#27272a] text-white text-xs rounded-xl px-3.5 py-2 focus:outline-none focus:border-[#45dfa4]"
                  >
                    <option value="E-mail">E-mail</option>
                    <option value="VPN">VPN</option>
                    <option value="Servidor">Servidor</option>
                    <option value="Rede">Rede</option>
                    <option value="Acesso">Acesso</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                {/* Nível de Acesso */}
                <div>
                  <label className="block text-xs font-mono text-[#8d90a0] mb-1">
                    Permissão de Acesso
                  </label>
                  <select
                    value={formData.accessLevel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        accessLevel: e.target.value as any
                      })
                    }
                    className="w-full bg-[#1e1e24] border border-[#27272a] text-white text-xs rounded-xl px-3.5 py-2 focus:outline-none focus:border-[#45dfa4]"
                  >
                    <option value="Todos">Todos da Equipe T.I.</option>
                    <option value="Apenas N2/N3">Apenas N2/N3 (Infra)</option>
                    <option value="Apenas Gestores">Apenas Gestores / CEO</option>
                  </select>
                </div>
              </div>

              {/* Usuário */}
              <div>
                <label className="block text-xs font-mono text-[#8d90a0] mb-1">
                  Usuário / E-mail / Login
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Ex: henrique.leal@empresa.com.br"
                  className="w-full bg-[#1e1e24] border border-[#27272a] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-[#8d90a0] focus:outline-none focus:border-[#45dfa4] font-mono"
                />
              </div>

              {/* Senha + Generator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono text-[#8d90a0]">
                    Senha de Acesso
                  </label>
                  <button
                    type="button"
                    onClick={generateStrongPassword}
                    className="text-[11px] font-mono text-[#45dfa4] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Gerar Senha Forte</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Digite a senha ou clique em gerar..."
                  className="w-full bg-[#1e1e24] border border-[#27272a] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-[#8d90a0] focus:outline-none focus:border-[#45dfa4] font-mono"
                />
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-mono text-[#8d90a0] mb-1">
                  Notas Complementares / Instruções (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ex: Windows/REDE: User: henrique.leal Password: Lev@2024! Skype: comercial.plcom@outlook.com..."
                  className="w-full bg-[#1e1e24] border border-[#27272a] rounded-xl p-3 text-xs text-white placeholder:text-[#8d90a0] focus:outline-none focus:border-[#45dfa4] font-mono"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-[#27272a] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#1e1e24] border border-[#27272a] text-[#c3c6d7] hover:text-white rounded-xl text-xs font-mono cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-[#45dfa4]/20"
                >
                  <Check className="w-4 h-4 text-gray-950" />
                  <span>Salvar Credencial</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
