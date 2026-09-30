import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ExpenseItem, ExpenseCategory, ExpenseStatus } from '../types';
import { AppLogo } from './LogoSistema';
import { ThemeToggle } from './AlternadorTema';
import {
  DollarSign,
  Plus,
  Trash2,
  Calendar,
  User,
  Mail,
  CheckCircle,
  Clock,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowLeft
} from 'lucide-react';

export const parseCurrency = (val: string | number | undefined): number => {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim();
  if (!str) return 0;

  // Remove currency symbol and spaces
  let clean = str.replace(/[R$\s]/g, '');

  if (clean.includes(',') && clean.includes('.')) {
    if (clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      clean = clean.replace(/,/g, '');
    }
  } else if (clean.includes(',')) {
    clean = clean.replace(',', '.');
  }

  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
};

export const formatBRL = (val: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(val || 0);
};

export const FinanceiroView: React.FC = () => {
  const {
    userSession,
    managedUsers,
    expenses,
    addExpenseItem,
    updateExpenseItem,
    updateExpensesBatch,
    deleteExpenseItem,
    setCurrentScreen,
    theme
  } = useApp();

  const isLight = theme === 'light';

  // Regra de Permissão: Configuração em "Configurações de Usuário" onde se pode editar quem consegue ver o financeiro de outras pessoas
  // Se canViewAllExpenses estiver definido no usuário, respeita essa permissão; caso contrário, padrão por cargo (Gestor, CEO, Admin)
  const isGestorOrCeo = userSession.permissions?.canViewAllExpenses !== undefined
    ? Boolean(userSession.permissions.canViewAllExpenses)
    : ['gestor', 'ceo', 'admin'].includes((userSession.role || '').toLowerCase());

  // Current selected month: defaults to current month (YYYY-MM)
  const currentMonthDefault = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthDefault);

  // Current viewing analyst ID: defaults to logged in user's id/username
  const [selectedAnalystId, setSelectedAnalystId] = useState<string>(() => {
    return userSession.id || userSession.username || 'usr-ti';
  });

  // Search filter inside month table
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Active analyst object:
  // QUEM NÃO FOR GESTOR E NEM CEO NUNCA CONSEGUE VER O FINANCEIRO DE OUTRA PESSOA
  const activeAnalyst = useMemo(() => {
    if (!isGestorOrCeo) {
      const found = managedUsers.find(
        u => u.username?.toLowerCase() === userSession.username?.toLowerCase() || u.id === userSession.id
      );
      return found || {
        id: userSession.id || userSession.username || 'usr-current',
        name: userSession.name || 'Analista GoDesc',
        username: userSession.username || 'analista',
        email: userSession.email || 'analista@godesc.com.br',
        role: userSession.role || 'n1'
      };
    }

    // Gestor ou CEO selecionando outro analista
    const found = managedUsers.find(
      u => u.id === selectedAnalystId || u.username === selectedAnalystId
    );
    if (found) return found;

    return {
      id: userSession.id || 'usr-current',
      name: userSession.name || 'Analista GoDesc',
      username: userSession.username || 'analista',
      email: userSession.email || 'analista@godesc.com.br',
      role: userSession.role || 'gestor'
    };
  }, [isGestorOrCeo, managedUsers, selectedAnalystId, userSession]);

  // Filtered expenses for this analyst and month
  const analystExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchUser =
        exp.userId === activeAnalyst.id ||
        exp.userEmail.toLowerCase() === activeAnalyst.email.toLowerCase() ||
        exp.userId === activeAnalyst.username;
      const matchMonth = exp.monthYear === selectedMonth;
      return matchUser && matchMonth;
    });
  }, [expenses, activeAnalyst, selectedMonth]);

  // Expenses with search filter applied
  const displayedExpenses = useMemo(() => {
    if (!searchTerm.trim()) return analystExpenses;
    const term = searchTerm.toLowerCase();
    return analystExpenses.filter(
      exp =>
        exp.description.toLowerCase().includes(term) ||
        exp.category.toLowerCase().includes(term)
    );
  }, [analystExpenses, searchTerm]);

  // Compute grand total
  const totalAmount = useMemo(() => {
    return analystExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [analystExpenses]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    setSelectedMonth(prevDate.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(year, month, 1);
    setSelectedMonth(nextDate.toISOString().slice(0, 7));
  };

  const monthLabel = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  // Add new row to the table
  const handleAddNewRow = () => {
    const today = new Date().toISOString().slice(0, 10);
    addExpenseItem({
      userId: activeAnalyst.id,
      userEmail: activeAnalyst.email,
      userName: activeAnalyst.name,
      date: today.startsWith(selectedMonth) ? today : `${selectedMonth}-01`,
      category: 'Alimentação / Refeição',
      description: '',
      receiptNumber: '',
      amount: 0,
      amountRaw: '',
      monthYear: selectedMonth,
      status: 'Pendente'
    });
  };

  // Handle amount change accepting , and .
  const handleAmountChange = (id: string, rawValue: string) => {
    const numericValue = parseCurrency(rawValue);
    updateExpenseItem(id, {
      amountRaw: rawValue,
      amount: numericValue
    });
  };

  // Handle field change
  const handleFieldChange = (id: string, field: keyof ExpenseItem, value: any) => {
    updateExpenseItem(id, { [field]: value });
  };

  // Status unificado do mês selecionado
  const monthStatus: ExpenseStatus = useMemo(() => {
    if (analystExpenses.length === 0) return 'Pendente';
    const allPaid = analystExpenses.every(e => e.status === 'Pago');
    if (allPaid) return 'Pago';
    const allApproved = analystExpenses.every(e => e.status === 'Aprovado' || e.status === 'Pago');
    if (allApproved) return 'Aprovado';
    return 'Pendente';
  }, [analystExpenses]);

  // Alterar status de todas as despesas do mês em lote
  const handleBatchChangeStatus = (newStatus: ExpenseStatus) => {
    if (analystExpenses.length === 0) return;
    const ids = analystExpenses.map(e => e.id);
    updateExpensesBatch(ids, { status: newStatus });
  };

  return (
    <div className={`min-h-screen ${isLight ? 'bg-[#f8fafc] text-gray-900' : 'bg-[#1e1e24] text-[#dfe2eb]'} flex flex-col font-sans transition-colors duration-200`}>
      {/* Top Header Bar */}
      <header className={`${isLight ? 'bg-white border-gray-200 shadow-xs' : 'bg-[#18181b] border-[#27272a] shadow-md'} border-b px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30`}>
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setCurrentScreen('ti_dashboard')}
            className={`text-xs font-mono flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg border cursor-pointer ${
              isLight
                ? 'text-gray-700 hover:text-emerald-700 bg-gray-100 hover:bg-gray-200 border-gray-200'
                : 'text-[#8d90a0] hover:text-[#45dfa4] bg-[#181c22] hover:bg-[#222730] border-[#2A2F3A]'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard TI</span>
          </button>
          <span className={isLight ? 'text-gray-300' : 'text-[#434655]'}>|</span>
          <div className="flex items-center gap-2">
            <DollarSign className={`w-5 h-5 ${isLight ? 'text-emerald-600' : 'text-[#45dfa4]'}`} />
            <h1 className={`text-sm sm:text-base font-bold tracking-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>
              Financeiro &amp; Reembolsos
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle compact buttonId="btn-financeiro-theme-toggle" />
        </div>
      </header>

      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-6">
        {/* Top Header Card */}
        <div className={`${isLight ? 'bg-white border-gray-200 shadow-xs' : 'bg-[#18181b] border-[#27272a] shadow-sm'} border rounded-2xl p-6`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Title & Badge */}
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                isLight
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-[#45dfa4]/10 text-[#45dfa4] border-[#45dfa4]/20'
              }`}>
                <DollarSign className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className={`text-2xl font-bold tracking-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>
                    Módulo Financeiro &amp; Reembolsos
                  </h1>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                    isLight
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-[#45dfa4]/15 text-[#45dfa4] border-[#45dfa4]/30'
                  }`}>
                    {isGestorOrCeo ? 'Visão da Gestão / Reembolsos' : 'Planilha Individual do Analista'}
                  </span>
                </div>
                <p className={`text-sm mt-1 ${isLight ? 'text-gray-600' : 'text-[#8d90a0]'}`}>
                  Controle de despesas com alimentação, viagens e combustível com cálculo automático e aprovação unificada.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleAddNewRow}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Adicionar Despesa
              </button>

              {/* Botão de Status Único Mensal */}
              <div className="relative inline-flex items-center">
                <div
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-semibold transition-all shadow-sm ${
                    monthStatus === 'Aprovado'
                      ? isLight
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                      : monthStatus === 'Pago'
                      ? isLight
                        ? 'bg-blue-50 text-blue-800 border-blue-300'
                        : 'bg-blue-950/40 text-blue-300 border-blue-500/40'
                      : isLight
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {monthStatus === 'Aprovado' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : monthStatus === 'Pago' ? (
                    <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  )}

                  <span className="text-xs uppercase tracking-wider opacity-75 font-medium">Status:</span>

                  <select
                    value={monthStatus}
                    onChange={e => handleBatchChangeStatus(e.target.value as ExpenseStatus)}
                    disabled={analystExpenses.length === 0}
                    title="Alterar o status de todas as despesas deste mês"
                    className="bg-transparent font-bold text-sm focus:outline-none cursor-pointer pr-1"
                  >
                    <option value="Pendente" className={isLight ? 'bg-white text-gray-900' : 'bg-[#18181b] text-white'}>
                      Pendente
                    </option>
                    <option value="Aprovado" className={isLight ? 'bg-white text-gray-900' : 'bg-[#18181b] text-white'}>
                      Aprovado (Aprovar Todos)
                    </option>
                    <option value="Pago" className={isLight ? 'bg-white text-gray-900' : 'bg-[#18181b] text-white'}>
                      Pago (Reembolso Efetuado)
                    </option>
                  </select>
                </div>
              </div>

              {/* Botão de Ação Rápida: Aprovar todas se estiver pendente */}
              {monthStatus === 'Pendente' && analystExpenses.length > 0 && (
                <button
                  onClick={() => handleBatchChangeStatus('Aprovado')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
                  title="Aprovar todas as despesas lançadas neste mês"
                >
                  <CheckCircle className="w-4 h-4" />
                  Aprovar Todas
                </button>
              )}

              {/* Botão de Ação Rápida: Marcar como pago se estiver aprovado */}
              {monthStatus === 'Aprovado' && analystExpenses.length > 0 && (
                <button
                  onClick={() => handleBatchChangeStatus('Pago')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
                  title="Marcar todas as despesas deste mês como pagas"
                >
                  <DollarSign className="w-4 h-4" />
                  Marcar como Pago
                </button>
              )}
            </div>
          </div>

          {/* Analyst Info Bar & Month Selector */}
          <div className={`mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 ${
            isLight ? 'border-gray-100' : 'border-[#27272a]'
          }`}>
            {/* Analyst Card */}
            <div className={`flex items-center gap-3.5 p-3.5 rounded-xl border ${
              isLight ? 'bg-gray-50 border-gray-200' : 'bg-[#151c25] border-[#27272a]'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-500/30">
                {activeAnalyst.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${isLight ? 'text-gray-500' : 'text-[#8d90a0]'}`}>
                    Analista / Funcionário:
                  </span>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                    isLight
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {String(activeAnalyst.role).toUpperCase()}
                  </span>
                </div>
                <p className={`text-sm font-bold truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  {activeAnalyst.name}
                </p>
                <p className={`text-xs truncate ${isLight ? 'text-gray-500' : 'text-[#8d90a0]'}`}>
                  {activeAnalyst.email}
                </p>
              </div>
            </div>

            {/* Month Navigator */}
            <div className={`flex items-center justify-between p-3.5 rounded-xl border ${
              isLight ? 'bg-gray-50 border-gray-200' : 'bg-[#151c25] border-[#27272a]'
            }`}>
              <div className="flex items-center gap-2">
                <Calendar className={`w-5 h-5 ${isLight ? 'text-emerald-600' : 'text-[#45dfa4]'}`} />
                <div>
                  <span className={`text-xs font-medium block ${isLight ? 'text-gray-500' : 'text-[#8d90a0]'}`}>
                    Mês de Referência:
                  </span>
                  <span className={`text-sm font-bold capitalize ${isLight ? 'text-gray-900' : 'text-white'}`}>
                    {monthLabel}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  title="Mês Anterior"
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isLight ? 'hover:bg-gray-200 text-gray-600' : 'hover:bg-[#252f40] text-gray-300'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={e => e.target.value && setSelectedMonth(e.target.value)}
                  className={`text-xs border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isLight
                      ? 'bg-white border-gray-300 text-gray-900'
                      : 'bg-[#1e1e24] border-[#27272a] text-white'
                  }`}
                />
                <button
                  onClick={handleNextMonth}
                  title="Próximo Mês"
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isLight ? 'hover:bg-gray-200 text-gray-600' : 'hover:bg-[#252f40] text-gray-300'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Seletor de Analista: EXCLUSIVO PARA GESTOR OU CEO */}
            {isGestorOrCeo ? (
              <div className={`flex items-center gap-3 p-3.5 rounded-xl border ${
                isLight ? 'bg-gray-50 border-gray-200' : 'bg-[#151c25] border-[#27272a]'
              }`}>
                <User className="w-5 h-5 text-purple-500 shrink-0" />
                <div className="flex-1">
                  <label className={`text-xs font-medium block ${isLight ? 'text-gray-500' : 'text-[#8d90a0]'}`}>
                    Painel da Gestão (Filtrar Analista):
                  </label>
                  <select
                    value={selectedAnalystId}
                    onChange={e => setSelectedAnalystId(e.target.value)}
                    className={`w-full mt-1 text-xs border rounded-lg px-2 py-1.5 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      isLight
                        ? 'bg-white border-gray-300 text-gray-900'
                        : 'bg-[#1e1e24] border-[#27272a] text-white'
                    }`}
                  >
                    {managedUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email}) - {user.role.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className={`flex items-center gap-3 p-3.5 rounded-xl border ${
                isLight
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : 'bg-emerald-950/20 border-emerald-900/40'
              }`}>
                <CheckCircle className={`w-5 h-5 shrink-0 ${isLight ? 'text-emerald-600' : 'text-[#45dfa4]'}`} />
                <div>
                  <span className={`text-xs font-semibold block ${isLight ? 'text-emerald-800' : 'text-[#45dfa4]'}`}>
                    Ambiente Individual e Seguro
                  </span>
                  <span className={`text-xs ${isLight ? 'text-emerald-700' : 'text-[#8d90a0]'}`}>
                    Você visualiza e gerencia exclusivamente as suas próprias despesas.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Sum Card */}
          <div className={`${isLight ? 'bg-white border-gray-200 shadow-xs' : 'bg-[#18181b] border-[#27272a] shadow-sm'} border rounded-2xl p-5`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-gray-500' : 'text-[#8d90a0]'}`}>
                Total a Reembolsar
              </span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-[#45dfa4]/15 text-[#45dfa4]'
              }`}>
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                isLight ? 'text-emerald-600' : 'text-[#45dfa4]'
              }`}>
                {formatBRL(totalAmount)}
              </h3>
              <p className={`text-xs mt-1 ${isLight ? 'text-gray-500' : 'text-[#8d90a0]'}`}>
                Soma automática de {analystExpenses.length} despesas em {monthLabel}
              </p>
            </div>
          </div>

          {/* Total Items */}
          <div className={`${isLight ? 'bg-white border-gray-200 shadow-xs' : 'bg-[#18181b] border-[#27272a] shadow-sm'} border rounded-2xl p-5`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-gray-500' : 'text-[#8d90a0]'}`}>
                Quantidade de Itens
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>
                {analystExpenses.length}
              </h3>
              <p className={`text-xs mt-1 ${isLight ? 'text-gray-500' : 'text-[#8d90a0]'}`}>
                Linhas lançadas neste mês
              </p>
            </div>
          </div>

          {/* Status do Mês Unificado */}
          <div className={`${isLight ? 'bg-white border-gray-200 shadow-xs' : 'bg-[#18181b] border-[#27272a] shadow-sm'} border rounded-2xl p-5`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-gray-500' : 'text-[#8d90a0]'}`}>
                Status do Mês
              </span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                monthStatus === 'Aprovado'
                  ? 'bg-emerald-500/15 text-emerald-500'
                  : monthStatus === 'Pago'
                  ? 'bg-blue-500/15 text-blue-500'
                  : 'bg-amber-500/15 text-amber-500'
              }`}>
                {monthStatus === 'Aprovado' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : monthStatus === 'Pago' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
              </div>
            </div>
            <div className="mt-3">
              <h3 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                monthStatus === 'Aprovado'
                  ? 'text-emerald-500'
                  : monthStatus === 'Pago'
                  ? 'text-blue-500'
                  : 'text-amber-500'
              }`}>
                {analystExpenses.length === 0 ? 'Sem Itens' : monthStatus.toUpperCase()}
              </h3>
              <p className={`text-xs mt-1 ${isLight ? 'text-gray-500' : 'text-[#8d90a0]'}`}>
                {monthStatus === 'Aprovado'
                  ? 'Todas as despesas aprovadas'
                  : monthStatus === 'Pago'
                  ? 'Reembolso do mês efetuado'
                  : 'Aguardando aprovação no final do mês'}
              </p>
            </div>
          </div>

          {/* Situação Geral */}
          <div className={`${isLight ? 'bg-white border-gray-200 shadow-xs' : 'bg-[#18181b] border-[#27272a] shadow-sm'} border rounded-2xl p-5`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-gray-500' : 'text-[#8d90a0]'}`}>
                Situação Geral
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-500 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-xl sm:text-2xl font-extrabold text-purple-500 tracking-tight">
                {analystExpenses.length === 0
                  ? 'Sem Lançamentos'
                  : monthStatus === 'Pago'
                  ? 'Pago / Quitado'
                  : monthStatus === 'Aprovado'
                  ? 'Pronto p/ Pagamento'
                  : 'Pendente Fechamento'}
              </h3>
              <p className={`text-xs mt-1 ${isLight ? 'text-gray-500' : 'text-[#8d90a0]'}`}>
                {monthStatus === 'Pago'
                  ? 'Reembolso liquidado com sucesso'
                  : monthStatus === 'Aprovado'
                  ? 'Liberado pela gestão para pagamento'
                  : 'Aguardando conferência no fim do mês'}
              </p>
            </div>
          </div>
        </div>

        {/* Excel-like Interactive Spreadsheet */}
        <div className={`${isLight ? 'bg-white border-gray-200 shadow-xs' : 'bg-[#18181b] border-[#27272a] shadow-sm'} border rounded-2xl overflow-hidden`}>
          {/* Table Toolbar */}
          <div className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isLight ? 'bg-gray-50/80 border-gray-200' : 'bg-[#151c25] border-[#27272a]'
          }`}>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className={`w-5 h-5 ${isLight ? 'text-emerald-600' : 'text-[#45dfa4]'}`} />
              <h2 className={`text-base font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                Planilha de Despesas de {monthLabel}
              </h2>
              <span className={`text-xs ${isLight ? 'text-gray-500' : 'text-[#8d90a0]'}`}>
                (Aceita vírgula ou ponto: ex: 25,50 ou 25.50)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Filtrar despesas..."
                  className={`pl-9 pr-3 py-1.5 text-xs border rounded-xl placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isLight
                      ? 'bg-white border-gray-300 text-gray-900'
                      : 'bg-[#1e1e24] border-[#27272a] text-white'
                  }`}
                />
              </div>

              <button
                onClick={handleAddNewRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Nova Linha
              </button>
            </div>
          </div>

          {/* Interactive Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                  isLight
                    ? 'bg-gray-100 text-gray-700 border-gray-200'
                    : 'bg-[#131822] text-gray-300 border-[#27272a]'
                }`}>
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-3 w-36">Data</th>
                  <th className="py-3 px-3 w-64">Finalidade / Categoria</th>
                  <th className="py-3 px-3">Nome / Descrição da Despesa</th>
                  <th className="py-3 px-3 w-44 text-right">Valor (R$)</th>
                  <th className="py-3 px-3 w-16 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-sm ${isLight ? 'divide-gray-200' : 'divide-[#27272a]'}`}>
                {displayedExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="max-w-sm mx-auto flex flex-col items-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                          isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-[#45dfa4]/10 text-[#45dfa4]'
                        }`}>
                          <FileSpreadsheet className="w-6 h-6" />
                        </div>
                        <p className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                          Nenhuma despesa lançada para {monthLabel}
                        </p>
                        <p className={`text-xs mt-1 mb-4 ${isLight ? 'text-gray-500' : 'text-[#8d90a0]'}`}>
                          Clique no botão abaixo para adicionar a primeira despesa e iniciar a planilha de reembolso.
                        </p>
                        <button
                          onClick={handleAddNewRow}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar Linha de Despesa
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedExpenses.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`transition-colors group ${
                        isLight ? 'hover:bg-emerald-50/40' : 'hover:bg-[#1f2630]/60'
                      }`}
                    >
                      {/* Index */}
                      <td className={`py-2.5 px-3 text-center text-xs font-bold ${
                        isLight ? 'text-gray-400 bg-gray-50/60' : 'text-[#8d90a0] bg-[#151c25]/40'
                      }`}>
                        {index + 1}
                      </td>

                      {/* Date */}
                      <td className="py-2.5 px-3">
                        <input
                          type="date"
                          value={item.date}
                          onChange={e => handleFieldChange(item.id, 'date', e.target.value)}
                          className={`w-full text-xs border rounded-lg px-2 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                            isLight
                              ? 'bg-white border-gray-200 text-gray-900'
                              : 'bg-[#151c25] border-[#27272a] text-white'
                          }`}
                        />
                      </td>

                      {/* Finalidade / Categoria */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          list="finalidades-sugestoes"
                          value={item.category}
                          onChange={e => handleFieldChange(item.id, 'category', e.target.value)}
                          placeholder="Escreva a finalidade..."
                          className={`w-full text-xs border rounded-lg px-2.5 py-1.5 font-medium placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                            isLight
                              ? 'bg-white border-gray-200 text-gray-900'
                              : 'bg-[#151c25] border-[#27272a] text-white'
                          }`}
                        />
                      </td>

                      {/* Description / Name */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={item.description}
                          onChange={e => handleFieldChange(item.id, 'description', e.target.value)}
                          placeholder="Ex: Almoço visita técnica, Gasolina km 45, etc."
                          className={`w-full text-xs border rounded-lg px-2.5 py-1.5 font-medium placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                            isLight
                              ? 'bg-white border-gray-200 text-gray-900'
                              : 'bg-[#151c25] border-[#27272a] text-white'
                          }`}
                        />
                      </td>

                      {/* Amount Input (supports , or .) */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="relative inline-block w-full">
                          <span className={`absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold pointer-events-none ${
                            isLight ? 'text-gray-400' : 'text-[#8d90a0]'
                          }`}>
                            R$
                          </span>
                          <input
                            type="text"
                            value={item.amountRaw !== undefined ? item.amountRaw : item.amount > 0 ? String(item.amount).replace('.', ',') : ''}
                            onChange={e => handleAmountChange(item.id, e.target.value)}
                            placeholder="0,00"
                            className={`w-full text-right text-xs font-bold font-mono border rounded-lg pl-8 pr-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                              isLight
                                ? 'bg-white border-emerald-300 text-emerald-700'
                                : 'bg-[#151c25] border-emerald-500/50 text-[#45dfa4]'
                            }`}
                          />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => deleteExpenseItem(item.id)}
                          title="Excluir Linha"
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {/* Grand Total Footer */}
              <tfoot>
                <tr className={`border-t-2 font-bold ${
                  isLight
                    ? 'bg-gray-100 border-emerald-500 text-gray-900'
                    : 'bg-[#151c25] border-[#45dfa4] text-white'
                }`}>
                  <td colSpan={4} className={`py-3 px-4 text-right text-xs uppercase tracking-wider ${
                    isLight ? 'text-gray-600' : 'text-[#8d90a0]'
                  }`}>
                    Total Geral a Reembolsar ({monthLabel}):
                  </td>
                  <td className={`py-3 px-3 text-right font-mono text-base font-extrabold ${
                    isLight ? 'text-emerald-600' : 'text-[#45dfa4]'
                  }`}>
                    {formatBRL(totalAmount)}
                  </td>
                  <td colSpan={1} className={`py-3 px-3 text-center text-xs font-normal ${
                    isLight ? 'text-gray-500' : 'text-[#8d90a0]'
                  }`}>
                    {analystExpenses.length} itens calculados
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Bottom Add Row Bar */}
          <div className={`p-3 border-t flex items-center justify-between ${
            isLight ? 'bg-gray-50 border-gray-200' : 'bg-[#151c25] border-[#27272a]'
          }`}>
            <button
              onClick={handleAddNewRow}
              className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                isLight
                  ? 'text-emerald-700 hover:bg-emerald-50'
                  : 'text-[#45dfa4] hover:bg-[#45dfa4]/10'
              }`}
            >
              <Plus className="w-4 h-4" />
              Adicionar Outra Linha de Despesa
            </button>

            <span className={`text-xs ${isLight ? 'text-gray-500' : 'text-[#8d90a0]'}`}>
              {isGestorOrCeo
                ? 'Modo Gestão: Todas as despesas do mês são aprovadas em conjunto pelo botão de status único.'
                : 'Dica: Digite o valor com vírgula ou ponto. As despesas são aprovadas em conjunto no final do mês ou quando o reembolso for pago.'}
            </span>
          </div>

          {/* Sugestões de Finalidades para autocomplete rápido */}
          <datalist id="finalidades-sugestoes">
            <option value="Alimentação / Refeição" />
            <option value="Transporte / Combustível" />
            <option value="Visita Técnica Externa" />
            <option value="Atendimento em Cliente" />
            <option value="Hospedagem / Hotel" />
            <option value="Material / Peças TI" />
            <option value="Pedágio / Estacionamento" />
            <option value="Passagem / Viagem Aérea/Ônibus" />
            <option value="Aplicativo (Uber / 99 / Táxi)" />
            <option value="Outros" />
          </datalist>
        </div>
      </div>
    </div>
  );
};
