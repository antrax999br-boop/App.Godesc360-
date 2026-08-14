import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  ShieldCheck,
  Server
} from 'lucide-react';

export const SystemStatusView: React.FC = () => {
  const { services, toggleServiceStatus, setCurrentScreen, userSession } = useApp();

  const isTIMember = userSession.isAuthenticated && userSession.role !== 'client';
  const operationalCount = services.filter((s) => s.status === 'Operacional').length;
  const instabilityCount = services.filter((s) => s.status === 'Instabilidade').length;
  const errorCount = services.filter((s) => s.status === 'Erro').length;

  const isAllGood = errorCount === 0 && instabilityCount === 0;

  return (
    <div className="min-h-screen bg-[#0d141d] text-[#dfe2eb] flex flex-col font-sans selection:bg-[#45dfa4]/30 selection:text-[#45dfa4]">
      {/* Top Header */}
      <header className="bg-[#181c22] border-b border-[#2A2F3A] px-6 md:px-12 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentScreen('portal_landing')}
            className="text-xs font-mono text-[#8d90a0] hover:text-[#45dfa4] flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Portal</span>
          </button>
          <span className="text-[#434655]">|</span>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#45dfa4]" />
            <span>Status dos Serviços &amp; Infraestrutura</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#8d90a0]">
            Atualizado a cada 60s
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
        {/* Big Overall Status Banner */}
        <div
          className={`p-6 rounded-2xl border mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 ${
            isAllGood
              ? 'bg-[#45dfa4]/10 border-[#45dfa4]/30 text-white'
              : errorCount > 0
              ? 'bg-[#93000a]/20 border-[#ffb4ab]/40 text-white'
              : 'bg-[#ffb95f]/10 border-[#ffb95f]/30 text-white'
          }`}
        >
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                isAllGood
                  ? 'bg-[#45dfa4]/20 text-[#45dfa4]'
                  : errorCount > 0
                  ? 'bg-[#ffb4ab]/20 text-[#ffb4ab]'
                  : 'bg-[#ffb95f]/20 text-[#ffb95f]'
              }`}
            >
              {isAllGood ? (
                <CheckCircle2 className="w-7 h-7" />
              ) : errorCount > 0 ? (
                <XCircle className="w-7 h-7" />
              ) : (
                <AlertTriangle className="w-7 h-7" />
              )}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">
                {isAllGood
                  ? 'Todos os Serviços Operando Normalmente'
                  : errorCount > 0
                  ? 'Incidente em Andamento em Alguns Serviços'
                  : 'Instabilidade Parcial Detectada'}
              </h2>
              <p className="text-xs text-[#c3c6d7] mt-0.5 font-mono">
                {operationalCount} de {services.length} nós em operação contínua • Uptime global: 99.85%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-[#181c22] px-3 py-1.5 rounded-lg border border-[#2A2F3A]">
              SLA Contratual: 99.9%
            </span>
          </div>
        </div>

        {/* Services List */}
        <div className="space-y-4 mb-10">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Serviços Críticos Monitorados</h3>
            <span className="text-[11px] font-mono text-[#8d90a0]">
              {isTIMember ? 'Clique em um nó para alterar o status' : 'Monitoramento em tempo real (T.I.)'}
            </span>
          </div>

          <div className="divide-y divide-[#2A2F3A] bg-[#151c25] border border-[#2A2F3A] rounded-2xl overflow-hidden">
            {services.map((srv) => (
              <div
                key={srv.id}
                onClick={() => isTIMember && toggleServiceStatus(srv.id)}
                title={isTIMember ? 'Clique para alterar o status deste serviço' : 'Status em tempo real'}
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  isTIMember ? 'hover:bg-[#192029] cursor-pointer' : 'cursor-default'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{srv.name}</span>
                    {srv.endpoint && (
                      <span className="text-xs text-[#8d90a0] font-mono">({srv.endpoint})</span>
                    )}
                  </div>
                  <p className="text-xs text-[#c3c6d7]">{srv.description}</p>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto shrink-0">
                  <div className="text-right text-xs font-mono hidden sm:block">
                    <div className="text-white font-bold">{srv.uptime}</div>
                    <div className="text-[#8d90a0] text-[10px]">{srv.latency}</div>
                  </div>

                  <span
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-bold uppercase ${
                      srv.status === 'Operacional'
                        ? 'bg-[#45dfa4]/10 text-[#45dfa4] border-[#45dfa4]/30'
                        : srv.status === 'Instabilidade'
                        ? 'bg-[#ffb95f]/10 text-[#ffb95f] border-[#ffb95f]/30'
                        : 'bg-[#ffb4ab]/10 text-[#ffb4ab] border-[#ffb4ab]/30'
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        srv.status === 'Operacional'
                          ? 'bg-[#45dfa4] animate-pulse'
                          : srv.status === 'Instabilidade'
                          ? 'bg-[#ffb95f]'
                          : 'bg-[#ffb4ab]'
                      }`}
                    ></div>
                    <span>{srv.status}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Incidents History */}
        <div className="bg-[#151c25] border border-[#2A2F3A] rounded-2xl p-6">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#45dfa4]" />
            <span>Histórico de Manutenções &amp; Incidentes Recentes</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-[#111827] rounded-xl border border-[#2A2F3A] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Manutenção Programada - Cluster Kubernetes</span>
                <span className="text-[10px] text-[#8d90a0] font-mono">Concluído ontem às 23:40</span>
              </div>
              <p className="text-[#c3c6d7]">
                Atualização de patches de segurança no nó mestre. Sem impacto perceptível nos clientes.
              </p>
            </div>

            <div className="p-3.5 bg-[#111827] rounded-xl border border-[#2A2F3A] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Oscilação de Rota DNS Anycast</span>
                <span className="text-[10px] text-[#8d90a0] font-mono">Resolvido há 3 dias</span>
              </div>
              <p className="text-[#c3c6d7]">
                Operadora de trânsito IP normalizou rotas no backbone de São Paulo.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
