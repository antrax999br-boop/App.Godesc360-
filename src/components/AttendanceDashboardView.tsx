import React from 'react';
import { useApp } from '../context/AppContext';
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  Users,
  Star,
  TrendingUp,
  AlertCircle,
  BarChart3,
  Bot,
  ArrowLeft
} from 'lucide-react';

export const AttendanceDashboardView: React.FC = () => {
  const { attendanceConversations, setCurrentScreen } = useApp();

  const totalToday = attendanceConversations.length;
  const waitingCount = attendanceConversations.filter(c => c.status === 'WAITING').length;
  const inProgressCount = attendanceConversations.filter(c => c.status === 'IN_PROGRESS').length;
  const closedCount = attendanceConversations.filter(c => c.status === 'CLOSED').length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header with Voltar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#18181b] p-6 rounded-2xl border border-[#27272a]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentScreen('ti_dashboard')}
            className="p-2.5 bg-[#27272a] hover:bg-[#323238] text-white rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4 text-[#45dfa4]" />
            <span>Voltar</span>
          </button>
          <div className="w-10 h-10 rounded-xl bg-[#45dfa4]/10 border border-[#45dfa4]/30 flex items-center justify-center text-[#45dfa4]">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Dashboard de Atendimento WhatsApp</h1>
            <p className="text-xs text-[#8d90a0]">
              Métricas em tempo real de conversas, tempo de resposta e avaliação dos clientes.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#18181b] p-5 rounded-2xl border border-[#27272a] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#8d90a0]">Atendimentos Hoje</span>
            <MessageSquare className="w-4 h-4 text-[#45dfa4]" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">{totalToday}</p>
          <p className="text-[11px] text-[#45dfa4] font-mono flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +14% vs ontem
          </p>
        </div>

        <div className="bg-[#18181b] p-5 rounded-2xl border border-[#27272a] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#8d90a0]">Aguardando Fila</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 font-mono">{waitingCount}</p>
          <p className="text-[11px] text-[#8d90a0]">Tempo médio de espera: 2min</p>
        </div>

        <div className="bg-[#18181b] p-5 rounded-2xl border border-[#27272a] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#8d90a0]">Em Atendimento</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">{inProgressCount}</p>
          <p className="text-[11px] text-[#8d90a0]">Analistas ativos: 3</p>
        </div>

        <div className="bg-[#18181b] p-5 rounded-2xl border border-[#27272a] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#8d90a0]">Satisfação Média</span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">4.8 ⭐</p>
          <p className="text-[11px] text-emerald-400 font-mono">98% de avaliação positiva</p>
        </div>
      </div>

      {/* Distribution Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#18181b] p-6 rounded-2xl border border-[#27272a] space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#45dfa4]" />
            Atendimentos por Setor / Fila
          </h3>

          <div className="space-y-3">
            {[
              { name: 'Suporte Técnico', count: 12, percent: 50, color: '#45dfa4' },
              { name: 'Comercial', count: 7, percent: 30, color: '#3b82f6' },
              { name: 'Financeiro', count: 5, percent: 20, color: '#a855f7' }
            ].map(item => (
              <div key={item.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-white">{item.name}</span>
                  <span className="text-[#8d90a0]">{item.count} ({item.percent}%)</span>
                </div>
                <div className="w-full h-2 bg-[#27272a] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#18181b] p-6 rounded-2xl border border-[#27272a] space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Bot className="w-4 h-4 text-purple-400" />
            Desempenho do Chatbot Automático
          </h3>

          <div className="p-4 bg-[#141416] rounded-xl border border-[#27272a] space-y-2">
            <p className="text-xs text-[#8d90a0]">Taxa de Resolução sem intervenção humana:</p>
            <p className="text-xl font-bold text-purple-400 font-mono">35% dos contatos</p>
            <p className="text-[11px] text-[#8d90a0]">
              O Chatbot triou e encaminhou 100% das mensagens iniciais com sucesso.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
