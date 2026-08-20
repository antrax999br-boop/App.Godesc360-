import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AttendanceQueue, QueueDistributionStrategy } from '../types';
import {
  Layers,
  Plus,
  Users,
  CheckCircle2,
  Trash2,
  Edit2,
  Save,
  MessageSquare,
  ArrowLeft
} from 'lucide-react';

export const AttendanceQueuesView: React.FC = () => {
  const { attendanceQueues, saveAttendanceQueue, userAccounts, setCurrentScreen } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#45dfa4');
  const [strategy, setStrategy] = useState<QueueDistributionStrategy>('ROUND_ROBIN');

  const handleCreateQueue = () => {
    if (!name.trim()) return;
    saveAttendanceQueue({
      id: `queue-${Date.now()}`,
      companyId: 'default-company',
      name: name.trim(),
      description: description.trim(),
      color,
      assignedUsers: userAccounts.map(u => u.username),
      priority: 'Média',
      distributionStrategy: strategy
    });
    setName('');
    setDescription('');
    setShowAddModal(false);
  };

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
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Filas & Departamentos de Atendimento</h1>
            <p className="text-xs text-[#8d90a0]">
              Configure setores de direcionamento (Comercial, Suporte, Financeiro) e estratégias de distribuição aos atendentes.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#45dfa4]/20 text-xs"
        >
          <Plus className="w-4 h-4 text-gray-950" />
          Nova Fila de Atendimento
        </button>
      </div>

      {/* Grid of Queues */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {attendanceQueues.map(q => (
          <div
            key={q.id}
            className="bg-[#18181b] p-5 rounded-2xl border border-[#27272a] space-y-4 relative overflow-hidden"
          >
            <div className="w-2 h-full absolute left-0 top-0" style={{ backgroundColor: q.color }} />

            <div className="pl-2 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base">{q.name}</h3>
                <span className="text-[10px] font-mono bg-[#27272a] text-[#45dfa4] px-2.5 py-0.5 rounded-full border border-[#45dfa4]/30">
                  {q.distributionStrategy}
                </span>
              </div>
              <p className="text-xs text-[#8d90a0]">{q.description || 'Fila geral de atendimento ao cliente.'}</p>
            </div>

            <div className="pl-2 pt-3 border-t border-[#27272a] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#8d90a0]">
                <Users className="w-4 h-4 text-[#45dfa4]" />
                <span>{q.assignedUsers.length} Atendentes</span>
              </div>
              <span className="text-[#45dfa4] font-mono font-bold">Ativa</span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Queue Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#45dfa4]" />
              Criar Nova Fila
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#8d90a0] block mb-1">Nome da Fila:</label>
                <input
                  type="text"
                  placeholder="Ex: Comercial, Suporte N2..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-[#1e1e24] border border-[#27272a] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#45dfa4]"
                />
              </div>

              <div>
                <label className="text-xs text-[#8d90a0] block mb-1">Descrição:</label>
                <textarea
                  rows={2}
                  placeholder="Finalidade desta fila..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-[#1e1e24] border border-[#27272a] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#45dfa4]"
                />
              </div>

              <div>
                <label className="text-xs text-[#8d90a0] block mb-1">Estratégia de Distribuição:</label>
                <select
                  value={strategy}
                  onChange={e => setStrategy(e.target.value as QueueDistributionStrategy)}
                  className="w-full bg-[#1e1e24] border border-[#27272a] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#45dfa4]"
                >
                  <option value="ROUND_ROBIN">Round Robin (Alternado)</option>
                  <option value="LEAST_BUSY">Menos Ocupado</option>
                  <option value="MANUAL">Atribuição Manual</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#27272a]">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-[#27272a] hover:bg-[#323238] text-white text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateQueue}
                className="px-4 py-2 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-xs rounded-xl cursor-pointer"
              >
                Salvar Fila
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
