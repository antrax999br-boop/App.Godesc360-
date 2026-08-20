import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BusinessHoursConfig } from '../types';
import {
  Clock,
  Save,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Moon,
  ArrowLeft
} from 'lucide-react';

export const AttendanceSettingsView: React.FC = () => {
  const { businessHours, updateBusinessHours, setCurrentScreen } = useApp();
  const [config, setConfig] = useState<BusinessHoursConfig>(businessHours);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleToggleDay = (index: number) => {
    const newSchedules = [...config.schedules];
    newSchedules[index].enabled = !newSchedules[index].enabled;
    setConfig({ ...config, schedules: newSchedules });
  };

  const handleTimeChange = (index: number, field: 'openTime' | 'closeTime' | 'lunchStart' | 'lunchEnd', value: string) => {
    const newSchedules = [...config.schedules];
    newSchedules[index] = { ...newSchedules[index], [field]: value };
    setConfig({ ...config, schedules: newSchedules });
  };

  const handleSave = () => {
    updateBusinessHours(config);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
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
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Horário de Atendimento & Ausência</h1>
            <p className="text-xs text-[#8d90a0]">
              Configure o expediente comercial da empresa para ativação de respostas automáticas de ausência.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#45dfa4]/20 text-xs"
        >
          <Save className="w-4 h-4 text-gray-950" />
          Salvar Horários
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Configurações de horário salvas com sucesso!
        </div>
      )}

      {/* Out of Hours Message Config */}
      <div className="bg-[#18181b] p-6 rounded-2xl border border-[#27272a] space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-[#8d90a0] flex items-center gap-2">
          <Moon className="w-4 h-4 text-[#45dfa4]" />
          Mensagem Automática Fora do Expediente
        </h3>

        <textarea
          rows={3}
          value={config.outOfHoursMessage}
          onChange={e => setConfig({ ...config, outOfHoursMessage: e.target.value })}
          className="w-full bg-[#1e1e24] border border-[#27272a] rounded-xl p-3 text-xs text-white placeholder-[#8d90a0] focus:outline-none focus:border-[#45dfa4] leading-relaxed"
        />
      </div>

      {/* Schedule per Day */}
      <div className="bg-[#18181b] p-6 rounded-2xl border border-[#27272a] space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-[#8d90a0]">
          Grade Horária Semanal
        </h3>

        <div className="space-y-3">
          {config.schedules.map((sch, idx) => (
            <div
              key={sch.day}
              className="p-4 bg-[#141416] border border-[#27272a] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 w-44">
                <input
                  type="checkbox"
                  checked={sch.enabled}
                  onChange={() => handleToggleDay(idx)}
                  className="w-4 h-4 accent-[#45dfa4] rounded cursor-pointer"
                />
                <span className={`text-xs font-bold ${sch.enabled ? 'text-white' : 'text-[#8d90a0] line-through'}`}>
                  {sch.day}
                </span>
              </div>

              {sch.enabled ? (
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-[#8d90a0]">Abertura:</span>
                    <input
                      type="time"
                      value={sch.openTime}
                      onChange={e => handleTimeChange(idx, 'openTime', e.target.value)}
                      className="bg-[#1e1e24] border border-[#27272a] px-2 py-1 rounded text-white focus:border-[#45dfa4]"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[#8d90a0]">Fechamento:</span>
                    <input
                      type="time"
                      value={sch.closeTime}
                      onChange={e => handleTimeChange(idx, 'closeTime', e.target.value)}
                      className="bg-[#1e1e24] border border-[#27272a] px-2 py-1 rounded text-white focus:border-[#45dfa4]"
                    />
                  </div>
                </div>
              ) : (
                <span className="text-xs font-mono text-amber-400 bg-amber-400/10 px-3 py-1 rounded-md">
                  Fechado / Sem Expediente
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
