import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CalendarEvent } from '../types';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  User,
  Bell,
  Trash2,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  X,
  Send,
  CalendarCheck,
  Radio,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORIES = [
  'Visita Técnica',
  'Manutenção Servidor',
  'Backup & Migração',
  'Instalação de Rede',
  'Reunião com Cliente',
  'Treinamento TI',
  'Outros'
];

export const CalendarEventsView: React.FC = () => {
  const {
    calendarEvents,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    triggerCalendarEventReminder,
    setCurrentScreen,
    userSession
  } = useApp();

  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [justNotifiedId, setJustNotifiedId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    location: '',
    createdBy: userSession.name || 'Laércio Schumacher (Analista TI)',
    category: 'Visita Técnica',
    priority: 'Alta' as 'Alta' | 'Média' | 'Baixa' | 'Crítica',
    notes: ''
  });

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtered Events
  const filteredEvents = calendarEvents.filter(evt => {
    const matchesSearch =
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.createdBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = filterCategory === 'all' || evt.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  // Calendar calculations
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handleOpenCreateModal = (presetDate?: string) => {
    setEditingEvent(null);
    setFormData({
      title: '',
      date: presetDate || selectedDateStr || todayStr,
      time: '10:00',
      location: '',
      createdBy: userSession.name || 'Laércio Schumacher (Analista TI)',
      category: 'Visita Técnica',
      priority: 'Alta',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (event: CalendarEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      createdBy: event.createdBy,
      category: event.category || 'Visita Técnica',
      priority: event.priority || 'Alta',
      notes: event.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.date || !formData.time || !formData.location.trim() || !formData.createdBy.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios (Título, Data, Hora, Endereço e Criador).');
      return;
    }

    if (editingEvent) {
      updateCalendarEvent(editingEvent.id, formData);
    } else {
      addCalendarEvent(formData);
    }

    setIsModalOpen(false);
  };

  const handleManualNotify = (eventId: string) => {
    triggerCalendarEventReminder(eventId);
    setJustNotifiedId(eventId);
    setTimeout(() => setJustNotifiedId(null), 3000);
  };

  // Group events for the right sidebar / list
  const eventsForSelectedDay = filteredEvents.filter(e => e.date === selectedDateStr);
  const todayEvents = filteredEvents.filter(e => e.date === todayStr);
  const upcomingEvents = filteredEvents.filter(e => e.date > todayStr).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="min-h-screen bg-[#1e1e24] text-[#dfe2eb] flex flex-col font-sans selection:bg-[#45dfa4]/30 selection:text-[#45dfa4]">
      {/* Top Header */}
      <header className="bg-[#18181b] border-b border-[#27272a] px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setCurrentScreen('ti_dashboard')}
            className="text-xs font-mono text-[#8d90a0] hover:text-[#45dfa4] flex items-center gap-1.5 transition-colors bg-[#181c22] px-3 py-1.5 rounded-lg border border-[#2A2F3A]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard TI</span>
          </button>
          <span className="text-[#434655]">|</span>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[#45dfa4]" />
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Calendário &amp; Lembretes de TI
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Toggle View Mode */}
          <div className="hidden sm:flex bg-[#181c22] p-0.5 rounded-lg border border-[#2A2F3A] text-xs">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                viewMode === 'calendar' ? 'bg-[#45dfa4] text-gray-950 font-bold' : 'text-[#8d90a0] hover:text-white'
              }`}
            >
              Grade Mensal
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                viewMode === 'list' ? 'bg-[#45dfa4] text-gray-950 font-bold' : 'text-[#8d90a0] hover:text-white'
              }`}
            >
              Lista Completa
            </button>
          </div>

          <button
            onClick={() => handleOpenCreateModal()}
            className="px-3.5 py-1.5 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-[#45dfa4]/10"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Evento</span>
          </button>
        </div>
      </header>

      {/* Info Banner for Analyst Notification rule */}
      <div className="bg-[#18181b] border-b border-[#27272a] px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-[#c3c6d7]">
          <Bell className="w-4 h-4 text-[#45dfa4] animate-pulse" />
          <span>
            <strong className="text-white">Alerta Automático de Suporte:</strong> No dia agendado do evento, uma notificação em tempo real é gerada no painel para todos os analistas de T.I.
          </span>
        </div>
        {todayEvents.length > 0 && (
          <span className="bg-[#ffb4ab]/20 text-[#ffb4ab] px-2 py-0.5 rounded text-[11px] font-mono font-bold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {todayEvents.length} Evento(s) Agendado(s) para Hoje!
          </span>
        )}
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left/Main Column: Calendar or Full List (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          {/* Controls Bar */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg bg-[#1e1e24] border border-[#27272a] text-[#c3c6d7] hover:text-white hover:border-[#45dfa4] transition-colors"
                title="Mês Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base sm:text-lg font-bold text-white font-mono min-w-[160px] text-center">
                {monthNames[month]} {year}
              </h2>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg bg-[#1e1e24] border border-[#27272a] text-[#c3c6d7] hover:text-white hover:border-[#45dfa4] transition-colors"
                title="Próximo Mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setCurrentMonth(new Date());
                  setSelectedDateStr(todayStr);
                }}
                className="ml-2 text-xs font-mono text-[#45dfa4] hover:underline bg-[#45dfa4]/10 border border-[#45dfa4]/30 px-2.5 py-1 rounded"
              >
                Hoje
              </button>
            </div>

            {/* Filter by Category */}
            <div className="flex items-center gap-2">
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="bg-[#1e1e24] border border-[#27272a] text-xs text-[#c3c6d7] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#45dfa4]"
              >
                <option value="all">Todas Categorias</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {viewMode === 'calendar' ? (
            /* Month Calendar Grid */
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 sm:p-6 shadow-xl">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-xs font-mono font-bold text-[#8d90a0]">
                <span>DOM</span>
                <span>SEG</span>
                <span>TER</span>
                <span>QUA</span>
                <span>QUI</span>
                <span>SEX</span>
                <span>SÁB</span>
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {/* Empty cells before 1st of month */}
                {Array.from({ length: firstDayIndex }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="h-20 sm:h-24 bg-[#1e1e24]/40 rounded-lg border border-transparent opacity-30" />
                ))}

                {/* Days of month */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dateFormatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const isToday = dateFormatted === todayStr;
                  const isSelected = dateFormatted === selectedDateStr;
                  const dayEvents = filteredEvents.filter(e => e.date === dateFormatted);

                  return (
                    <div
                      key={dateFormatted}
                      onClick={() => setSelectedDateStr(dateFormatted)}
                      onDoubleClick={() => handleOpenCreateModal(dateFormatted)}
                      className={`h-20 sm:h-24 p-1.5 sm:p-2 rounded-lg border flex flex-col justify-between transition-all cursor-pointer overflow-hidden ${
                        isSelected
                          ? 'border-[#45dfa4] bg-[#45dfa4]/10'
                          : isToday
                          ? 'border-[#45dfa4]/40 bg-[#27272a]'
                          : 'border-[#27272a] bg-[#1e1e24] hover:border-[#45dfa4]/40 hover:bg-[#27272a]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-mono font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                            isToday
                              ? 'bg-[#45dfa4] text-gray-950'
                              : isSelected
                              ? 'text-[#45dfa4]'
                              : 'text-white'
                          }`}
                        >
                          {dayNum}
                        </span>

                        {dayEvents.length > 0 && (
                          <span className="text-[10px] font-mono font-bold text-[#45dfa4] bg-[#45dfa4]/20 px-1 rounded">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      {/* Event Mini Pills */}
                      <div className="space-y-1 overflow-y-auto max-h-12 mt-1">
                        {dayEvents.map(e => (
                          <div
                            key={e.id}
                            title={`${e.title} às ${e.time} - ${e.location}`}
                            className={`text-[9px] sm:text-[10px] truncate px-1.5 py-0.5 rounded font-mono font-semibold ${
                              e.priority === 'Crítica' || e.priority === 'Alta'
                                ? 'bg-[#93000a]/40 text-[#ffb4ab] border border-[#ffb4ab]/30'
                                : 'bg-[#45dfa4]/20 text-[#45dfa4] border border-[#45dfa4]/30'
                            }`}
                          >
                            {e.time} {e.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-[#2A2F3A] flex items-center justify-between text-xs text-[#8d90a0]">
                <span>💡 Dica: Clique duplo no dia para agendar rapidamente.</span>
                <span className="font-mono">{filteredEvents.length} eventos no total</span>
              </div>
            </div>
          ) : (
            /* List View */
            <div className="bg-[#111827] border border-[#2A2F3A] rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#2A2F3A]">
                <h3 className="text-base font-bold text-white">Todos os Eventos &amp; Lembretes</h3>
                <span className="text-xs font-mono text-[#8d90a0]">{filteredEvents.length} cadastrados</span>
              </div>

              <div className="divide-y divide-[#2A2F3A]">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map(evt => (
                    <div key={evt.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                              evt.priority === 'Crítica' || evt.priority === 'Alta'
                                ? 'bg-[#ffb4ab]/20 text-[#ffb4ab]'
                                : 'bg-[#45dfa4]/20 text-[#45dfa4]'
                            }`}
                          >
                            {evt.priority}
                          </span>
                          <h4 className="text-sm font-bold text-white">{evt.title}</h4>
                          <span className="text-xs font-mono text-[#45dfa4] bg-[#45dfa4]/10 px-2 py-0.5 rounded border border-[#45dfa4]/20">
                            {evt.category}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#8d90a0]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#45dfa4]" />
                            {evt.date} às {evt.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#38bdf8]" />
                            {evt.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-[#fbbf24]" />
                            Criador: <strong className="text-[#c3c6d7]">{evt.createdBy}</strong>
                          </span>
                        </div>

                        {evt.notes && (
                          <p className="text-xs text-[#c3c6d7] mt-1 bg-[#181c22] p-2 rounded border border-[#2A2F3A]">
                            {evt.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleManualNotify(evt.id)}
                          className="px-3 py-1.5 bg-[#1f2630] hover:bg-[#283240] text-[#c3c6d7] hover:text-white border border-[#2A2F3A] rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors"
                          title="Enviar notificação para o painel de suporte agora"
                        >
                          <Bell className="w-3.5 h-3.5 text-[#45dfa4]" />
                          <span>{justNotifiedId === evt.id ? 'Notificado!' : 'Notificar'}</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(evt)}
                          className="p-2 text-[#8d90a0] hover:text-white hover:bg-[#181c22] rounded-lg"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Deseja excluir o lembrete "${evt.title}"?`)) {
                              deleteCalendarEvent(evt.id);
                            }
                          }}
                          className="p-2 text-[#8d90a0] hover:text-[#ffb4ab] hover:bg-[#181c22] rounded-lg"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-[#8d90a0]">
                    Nenhum evento encontrado para os filtros selecionados.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Selected Day Events & Fast Creation (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Selected Date Card */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272a] mb-4">
              <div>
                <span className="text-[10px] font-mono text-[#8d90a0] uppercase tracking-wider">
                  Eventos do Dia Selecionado
                </span>
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-1.5 mt-0.5">
                  <CalendarCheck className="w-4 h-4 text-[#45dfa4]" />
                  <span>{selectedDateStr}</span>
                </h3>
              </div>
              <button
                onClick={() => handleOpenCreateModal(selectedDateStr)}
                className="px-2.5 py-1 bg-[#45dfa4]/10 hover:bg-[#45dfa4]/20 text-[#45dfa4] border border-[#45dfa4]/30 rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
            </div>

            {eventsForSelectedDay.length > 0 ? (
              <div className="space-y-3">
                {eventsForSelectedDay.map(evt => (
                  <div
                    key={evt.id}
                    className="p-3.5 bg-[#1e1e24] rounded-lg border border-[#27272a] hover:border-[#45dfa4]/40 transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-white">{evt.title}</h4>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                          evt.priority === 'Crítica' || evt.priority === 'Alta'
                            ? 'bg-[#ffb4ab]/20 text-[#ffb4ab]'
                            : 'bg-[#45dfa4]/20 text-[#45dfa4]'
                        }`}
                      >
                        {evt.priority}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-[#8d90a0]">
                      <div className="flex items-center gap-1.5 font-mono text-[#c3c6d7]">
                        <Clock className="w-3.5 h-3.5 text-[#45dfa4]" />
                        <span>{evt.time}</span>
                        <span className="text-[#5e6375]">•</span>
                        <span className="text-[#45dfa4]">{evt.category}</span>
                      </div>

                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#38bdf8] shrink-0 mt-0.5" />
                        <span className="text-[#c3c6d7]">{evt.location}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px]">
                        <User className="w-3.5 h-3.5 text-[#fbbf24] shrink-0" />
                        <span>Criador: <strong className="text-white">{evt.createdBy}</strong></span>
                      </div>
                    </div>

                    {evt.notes && (
                      <p className="text-[11px] text-[#8d90a0] bg-[#111827] p-2 rounded border border-[#2A2F3A] font-mono">
                        {evt.notes}
                      </p>
                    )}

                    <div className="pt-2 border-t border-[#2A2F3A] flex items-center justify-between">
                      <button
                        onClick={() => handleManualNotify(evt.id)}
                        className="text-[11px] font-mono text-[#45dfa4] hover:underline flex items-center gap-1"
                      >
                        <Bell className="w-3 h-3" />
                        <span>{justNotifiedId === evt.id ? 'Alerta Enviado!' : 'Notificar Analistas'}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(evt)}
                          className="p-1 text-[#8d90a0] hover:text-white"
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Excluir "${evt.title}"?`)) {
                              deleteCalendarEvent(evt.id);
                            }
                          }}
                          className="p-1 text-[#8d90a0] hover:text-[#ffb4ab]"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[#8d90a0] space-y-2">
                <Clock className="w-6 h-6 text-[#434655] mx-auto opacity-50" />
                <p>Nenhum evento agendado para este dia.</p>
                <button
                  onClick={() => handleOpenCreateModal(selectedDateStr)}
                  className="text-xs text-[#45dfa4] hover:underline font-mono"
                >
                  + Agendar Lembrete
                </button>
              </div>
            )}
          </div>

          {/* Upcoming Events Box */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272a] mb-3">
              <span className="text-[10px] font-mono text-[#8d90a0] uppercase tracking-wider font-bold">
                Próximos Compromissos
              </span>
              <span className="text-xs font-mono text-[#45dfa4]">{upcomingEvents.length}</span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.slice(0, 5).map(evt => (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedDateStr(evt.date)}
                    className="p-2.5 bg-[#1e1e24] hover:bg-[#27272a] rounded-lg border border-[#27272a] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-white truncate">{evt.title}</span>
                      <span className="text-[10px] font-mono text-[#45dfa4] shrink-0">{evt.date}</span>
                    </div>
                    <div className="text-[11px] text-[#8d90a0] truncate">
                      📍 {evt.location} • Criado por: {evt.createdBy}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-[#8d90a0]">
                  Sem eventos futuros no momento.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Create or Edit Calendar Event */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181c22] border border-[#2A2F3A] rounded-2xl max-w-lg w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2F3A] mb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#45dfa4]" />
                <h3 className="text-base font-bold text-white">
                  {editingEvent ? 'Editar Evento / Lembrete' : 'Novo Evento no Calendário'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#8d90a0] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              {/* Event Name / Title */}
              <div>
                <label className="block font-mono text-[#8d90a0] mb-1">
                  Nome do Evento / Lembrete *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Manutenção Programada Switch Core"
                  className="w-full bg-[#111827] border border-[#2A2F3A] rounded-lg px-3 py-2 text-white placeholder:text-[#8d90a0] focus:outline-none focus:border-[#45dfa4]"
                  autoFocus
                />
              </div>

              {/* Date and Time Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[#8d90a0] mb-1">
                    Data do Evento *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-[#111827] border border-[#2A2F3A] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#45dfa4]"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[#8d90a0] mb-1">
                    Hora do Evento *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    className="w-full bg-[#111827] border border-[#2A2F3A] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#45dfa4]"
                  />
                </div>
              </div>

              {/* Location / Address */}
              <div>
                <label className="block font-mono text-[#8d90a0] mb-1">
                  Endereço / Local *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8d90a0]" />
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ex: Av. Paulista, 1000 - 5º Andar / Sala do Servidor"
                    className="w-full bg-[#111827] border border-[#2A2F3A] rounded-lg pl-9 pr-3 py-2 text-white placeholder:text-[#8d90a0] focus:outline-none focus:border-[#45dfa4]"
                  />
                </div>
              </div>

              {/* Creator Name */}
              <div>
                <label className="block font-mono text-[#8d90a0] mb-1">
                  Nome de Quem Criou o Evento *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8d90a0]" />
                  <input
                    type="text"
                    required
                    value={formData.createdBy}
                    onChange={e => setFormData({ ...formData, createdBy: e.target.value })}
                    placeholder="Ex: Laércio Schumacher (Analista TI)"
                    className="w-full bg-[#111827] border border-[#2A2F3A] rounded-lg pl-9 pr-3 py-2 text-white placeholder:text-[#8d90a0] focus:outline-none focus:border-[#45dfa4]"
                  />
                </div>
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[#8d90a0] mb-1">
                    Categoria
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#111827] border border-[#2A2F3A] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#45dfa4]"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[#8d90a0] mb-1">
                    Prioridade
                  </label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full bg-[#111827] border border-[#2A2F3A] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#45dfa4]"
                  >
                    <option value="Alta">Alta</option>
                    <option value="Crítica">Crítica</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                  </select>
                </div>
              </div>

              {/* Notes / Details */}
              <div>
                <label className="block font-mono text-[#8d90a0] mb-1">
                  Observações Adicionais (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Instruções de acesso, materiais necessários, contato no local..."
                  className="w-full bg-[#111827] border border-[#2A2F3A] rounded-lg px-3 py-2 text-white placeholder:text-[#8d90a0] focus:outline-none focus:border-[#45dfa4] resize-none"
                />
              </div>

              <div className="p-3 bg-[#111827] rounded-lg border border-[#2A2F3A] flex items-center gap-2.5 text-[11px] text-[#c3c6d7]">
                <Bell className="w-4 h-4 text-[#45dfa4] shrink-0" />
                <span>
                  Ao salvar, se a data for hoje, uma notificação será imediatamente gerada para os analistas de T.I.
                </span>
              </div>

              <div className="pt-4 border-t border-[#2A2F3A] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#1f2630] hover:bg-[#283240] text-[#c3c6d7] font-semibold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold rounded-lg transition-colors"
                >
                  {editingEvent ? 'Salvar Alterações' : 'Criar Evento & Lembrete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
