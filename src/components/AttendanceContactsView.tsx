import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Building,
  Tag,
  Clock,
  MessageSquare,
  ArrowLeft
} from 'lucide-react';

export const AttendanceContactsView: React.FC = () => {
  const { attendanceContacts, setCurrentScreen } = useApp();
  const [search, setSearch] = useState('');

  const filtered = attendanceContacts.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q);
  });

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
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Contatos do WhatsApp</h1>
            <p className="text-xs text-[#8d90a0]">
              Base consolidada de clientes, prospects e contatos vinculados aos atendimentos da empresa.
            </p>
          </div>
        </div>

        <div className="relative w-64">
          <Search className="w-4 h-4 text-[#8d90a0] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar contato por nome/tel..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#1e1e24] border border-[#27272a] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#8d90a0] focus:outline-none focus:border-[#45dfa4]"
          />
        </div>
      </div>

      {/* Grid of Contacts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filtered.map(contact => (
          <div
            key={contact.id}
            className="bg-[#18181b] p-5 rounded-2xl border border-[#27272a] space-y-3 hover:border-[#45dfa4]/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#45dfa4]/20 border border-[#45dfa4] flex items-center justify-center font-bold text-sm text-[#45dfa4]">
                {contact.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-white text-sm truncate">{contact.name}</h3>
                <p className="text-xs font-mono text-[#8d90a0]">{contact.phone}</p>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 text-xs text-[#8d90a0]">
              <p className="flex items-center gap-2 text-white">
                <Building className="w-3.5 h-3.5 text-[#45dfa4]" />
                {contact.companyName || 'Empresa Geral'}
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#45dfa4]" />
                Último atendimento: {contact.lastContactAt}
              </p>
            </div>

            <div className="pt-3 border-t border-[#27272a] flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {contact.tags.map(t => (
                  <span key={t} className="px-2 py-0.5 rounded bg-[#27272a] text-[#45dfa4] font-mono text-[10px]">
                    #{t}
                  </span>
                ))}
              </div>
              <span className="text-xs font-mono text-white font-bold">
                {contact.totalAttendances} atends.
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
