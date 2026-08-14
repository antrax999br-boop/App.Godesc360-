import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, ShieldCheck, Search, Filter, RefreshCw, FileText, Lock, CheckCircle2, AlertTriangle, XCircle, LogOut } from 'lucide-react';
import { TISecurityEventType } from '../types';

export const TIAuditLogsView: React.FC = () => {
  const { auditLogs, setCurrentScreen, userSession } = useApp();

  const [search, setSearch] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<string>('Todos');
  const [selectedResult, setSelectedResult] = useState<string>('Todos');

  const filteredLogs = auditLogs.filter((log) => {
    const matchSearch =
      !search.trim() ||
      log.username.toLowerCase().includes(search.toLowerCase()) ||
      log.ip.toLowerCase().includes(search.toLowerCase()) ||
      log.eventType.toLowerCase().includes(search.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(search.toLowerCase()));

    const matchType = selectedEventType === 'Todos' || log.eventType === selectedEventType;
    const matchResult = selectedResult === 'Todos' || log.result === selectedResult;

    return matchSearch && matchType && matchResult;
  });

  const getEventTypeBadge = (type: TISecurityEventType) => {
    switch (type) {
      case 'TI_LOGIN_SUCCESS':
        return <span className="bg-emerald-500/15 text-[#45dfa4] border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold">TI_LOGIN_SUCCESS</span>;
      case 'TI_LOGIN_FAILED':
        return <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold">TI_LOGIN_FAILED</span>;
      case 'TI_ACCOUNT_LOCKED':
        return <span className="bg-[#93000a]/40 text-[#ffb4ab] border border-[#ffb4ab]/40 px-2 py-0.5 rounded text-[10px] font-mono font-bold animate-pulse">TI_ACCOUNT_LOCKED</span>;
      case 'TI_ACCOUNT_UNLOCKED':
        return <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold">TI_ACCOUNT_UNLOCKED</span>;
      case 'TI_LOGOUT':
        return <span className="bg-gray-500/15 text-[#8d90a0] border border-gray-500/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold">TI_LOGOUT</span>;
      case 'TI_SESSION_EXPIRED':
        return <span className="bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold">TI_SESSION_EXPIRED</span>;
      case 'TI_UNAUTHORIZED_ACCESS':
      case 'TI_UNLOCK_PERMISSION_DENIED':
        return <span className="bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.5 rounded text-[10px] font-mono font-bold">NEGADO / RESTRITO</span>;
      default:
        return <span className="bg-gray-500/15 text-[#8d90a0] px-2 py-0.5 rounded text-[10px] font-mono">{type}</span>;
    }
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
            <ShieldCheck className="w-5 h-5 text-[#45dfa4]" />
            <span>Administração → Segurança → Logs do T.I.</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentScreen('ti_config')}
            className="text-xs font-mono text-[#45dfa4] hover:underline bg-[#111827] px-3 py-1.5 rounded-lg border border-[#2A2F3A]"
          >
            Ir para Contas T.I.
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Registros de Auditoria &amp; Segurança T.I.</h2>
          <p className="text-xs text-[#8d90a0]">
            Histórico imutável de todas as autenticações, erros, bloqueios, desbloqueios e encerramentos de sessão.
          </p>
        </div>

        {/* Toolbar Filters */}
        <div className="bg-[#151c25] border border-[#2A2F3A] rounded-xl p-4 shadow-xl flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8d90a0]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar por usuário, IP ou detalhes..."
              className="w-full bg-[#111827] border border-[#2A2F3A] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-[#8d90a0] focus:outline-none focus:border-[#45dfa4]"
            />
          </div>

          <select
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value)}
            className="bg-[#111827] border border-[#2A2F3A] text-white text-xs rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
          >
            <option value="Todos">Todos os Eventos</option>
            <option value="TI_LOGIN_SUCCESS">Login Sucesso (TI_LOGIN_SUCCESS)</option>
            <option value="TI_LOGIN_FAILED">Login Falhou (TI_LOGIN_FAILED)</option>
            <option value="TI_ACCOUNT_LOCKED">Conta Bloqueada (TI_ACCOUNT_LOCKED)</option>
            <option value="TI_ACCOUNT_UNLOCKED">Conta Desbloqueada (TI_ACCOUNT_UNLOCKED)</option>
            <option value="TI_LOGOUT">Logout Encerrado (TI_LOGOUT)</option>
            <option value="TI_SESSION_EXPIRED">Sessão Expirada (TI_SESSION_EXPIRED)</option>
            <option value="TI_UNAUTHORIZED_ACCESS">Acesso Não Autorizado</option>
            <option value="TI_UNLOCK_PERMISSION_DENIED">Desbloqueio Negado (403)</option>
          </select>

          <select
            value={selectedResult}
            onChange={(e) => setSelectedResult(e.target.value)}
            className="bg-[#111827] border border-[#2A2F3A] text-white text-xs rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
          >
            <option value="Todos">Todos os Resultados</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
            <option value="ACCOUNT_LOCKED">ACCOUNT_LOCKED</option>
            <option value="ACCOUNT_UNLOCKED">ACCOUNT_UNLOCKED</option>
            <option value="DENIED">DENIED (403)</option>
          </select>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-[#151c25] border border-[#2A2F3A] rounded-xl shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#c3c6d7]">
              <thead className="bg-[#111827] text-[#8d90a0] font-mono border-b border-[#2A2F3A]">
                <tr>
                  <th className="p-3.5">Data / Hora</th>
                  <th className="p-3.5">Usuário Afetado</th>
                  <th className="p-3.5">Tipo de Evento</th>
                  <th className="p-3.5">Endereço IP</th>
                  <th className="p-3.5">Dispositivo / User-Agent</th>
                  <th className="p-3.5">Detalhes / Autor</th>
                  <th className="p-3.5 text-right">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2F3A] bg-[#111827]/40">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#181c22] transition-colors font-mono">
                    <td className="p-3.5 text-[#8d90a0] whitespace-nowrap">{log.timestamp}</td>
                    <td className="p-3.5 font-bold text-white">@{log.username}</td>
                    <td className="p-3.5">{getEventTypeBadge(log.eventType)}</td>
                    <td className="p-3.5 text-[#45dfa4]">{log.ip}</td>
                    <td className="p-3.5 text-[#8d90a0] max-w-[200px] truncate" title={log.userAgent}>
                      {log.userAgent}
                    </td>
                    <td className="p-3.5 text-white max-w-[250px]">
                      {log.details || '-'}
                      {log.unlockedBy && <span className="block text-[10px] text-[#45dfa4]">Por: {log.unlockedBy}</span>}
                    </td>
                    <td className="p-3.5 text-right font-bold">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          log.result === 'SUCCESS' || log.result === 'ACCOUNT_UNLOCKED'
                            ? 'bg-[#45dfa4]/20 text-[#45dfa4]'
                            : log.result === 'ACCOUNT_LOCKED'
                            ? 'bg-[#93000a]/40 text-[#ffb4ab]'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {log.result}
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#8d90a0]">
                      Nenhum log de auditoria encontrado para os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
