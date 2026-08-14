import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Wifi,
  ChevronRight,
  ArrowRight,
  Server,
  Mail,
  Search,
  Ticket,
  Plus,
  ExternalLink,
  Network
} from 'lucide-react';
import { motion } from 'motion/react';
import { INITIAL_KB_ARTICLES, APP_LOGO } from '../data/mockData';

export const ClientHome: React.FC = () => {
  const {
    setCurrentScreen,
    setSelectedCategoryFilter,
    services,
    tickets,
    unreadNotificationCount
  } = useApp();

  const [lookupEmail, setLookupEmail] = useState(() => localStorage.getItem('godesc_saved_email') || '');

  const handleLookupTickets = (e: React.FormEvent) => {
    e.preventDefault();
    if (lookupEmail.trim()) {
      localStorage.setItem('godesc_saved_email', lookupEmail.trim().toLowerCase());
    }
    setCurrentScreen('client_my_tickets');
  };

  const handleCategoryClick = (catName: string) => {
    setSelectedCategoryFilter(catName);
    setCurrentScreen('new_ticket');
  };

  return (
    <div className="min-h-screen bg-[#1e1e24] text-[#dce3f0] flex flex-col antialiased selection:bg-[#45dfa4]/30 selection:text-[#45dfa4]">
      {/* TopNavBar */}
      <header className="fixed top-0 left-0 w-full z-50 bg-[#18181b]/90 backdrop-blur-md border-b border-[#27272a] flex justify-between items-center h-16 px-6 md:px-12 transition-all duration-300">
        <div className="flex items-center gap-6">
          <button
            id="brand-home-link"
            onClick={() => setCurrentScreen('portal_landing')}
            className="text-left flex items-center gap-3 cursor-pointer group"
          >
            <img
              src={APP_LOGO}
              alt="Logo Geral"
              className="h-9 w-auto object-contain"
            />
          </button>

          <nav className="hidden md:flex gap-6 ml-6">
            <button
              id="nav-abrir-ticket"
              onClick={() => setCurrentScreen('new_ticket')}
              className="text-[#c3c6d7] hover:text-[#45dfa4] text-sm font-semibold transition-colors cursor-pointer"
            >
              Abrir Ticket
            </button>
            <button
              id="nav-meus-chamados"
              onClick={() => setCurrentScreen('client_my_tickets')}
              className="text-[#c3c6d7] hover:text-[#45dfa4] text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Ticket className="w-4 h-4 text-[#45dfa4]" />
              <span>Meus Chamados</span>
            </button>
            <button
              id="nav-status"
              onClick={() => setCurrentScreen('system_status')}
              className="text-[#c3c6d7] hover:text-white text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Status</span>
              <span className="w-2 h-2 rounded-full bg-[#45dfa4] animate-pulse"></span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-24 pb-16 px-6 md:px-[8%] lg:px-[12%] max-w-7xl mx-auto w-full">
        {/* Hero Section */}
        <section className="text-center py-8 md:py-12 flex flex-col items-center justify-center relative">
          <div className="absolute inset-0 w-full h-full pointer-events-none opacity-25 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#2563eb]/20 via-[#0d141d] to-[#0d141d]"></div>

          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold text-white mb-4 relative z-10 tracking-tight"
          >
            Portal de Chamados do Solicitante
          </motion.h2>
          <p className="text-sm text-[#c3c6d7] relative z-10 max-w-xl">
            Abra uma nova solicitação técnica ou consulte o andamento dos seus chamados em tempo real.
          </p>
        </section>

        {/* 2 Primary Actions: Abrir Chamado & Consultar por E-mail */}
        <section className="mb-14 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Abrir Novo Chamado */}
          <motion.div
            id="card-cat-novo-chamado"
            whileHover={{ scale: 1.01, translateY: -2 }}
            onClick={() => setCurrentScreen('new_ticket')}
            className="bg-[#192029] border border-[#2A2F3A] hover:border-[#45dfa4]/60 hover:bg-[#232a34]/70 rounded-2xl p-6 sm:p-8 cursor-pointer flex flex-col justify-between relative overflow-hidden group transition-all duration-200 shadow-xl shadow-black/20"
          >
            <div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-[#45dfa4]/10 flex items-center justify-center border border-[#45dfa4]/30">
                  <Plus className="w-6 h-6 text-[#45dfa4]" />
                </div>
                <span className="text-xs font-mono text-[#45dfa4] bg-[#45dfa4]/10 border border-[#45dfa4]/30 px-3 py-1 rounded-full font-bold">
                  Novo Chamado
                </span>
              </div>
              <h4 className="text-xl font-bold text-white mb-2 relative z-10 group-hover:text-[#45dfa4] transition-colors">
                Abrir Novo Ticket
              </h4>
              <p className="text-xs sm:text-sm text-[#c3c6d7] relative z-10 leading-relaxed">
                Relate um problema técnico ou solicite suporte para computador, rede, sistemas, acesso ou equipamentos.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs font-mono text-[#45dfa4] font-bold">
              <span>Abrir Formulário</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

          {/* Card 2: Consultar Meus Chamados por E-mail */}
          <div className="bg-[#192029] border border-[#2A2F3A] rounded-2xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-xl shadow-black/20">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#2563eb]/10 flex items-center justify-center border border-[#2563eb]/30">
                  <Mail className="w-6 h-6 text-[#b4c5ff]" />
                </div>
                <span className="text-xs font-mono text-[#b4c5ff] bg-[#2563eb]/10 border border-[#2563eb]/30 px-3 py-1 rounded-full font-bold">
                  Acompanhamento
                </span>
              </div>
              <h4 className="text-xl font-bold text-white mb-2">
                Consultar Meus Chamados
              </h4>
              <p className="text-xs sm:text-sm text-[#c3c6d7] mb-4 leading-relaxed">
                Digite seu e-mail abaixo para visualizar todos os chamados criados por você.
              </p>

              <form onSubmit={handleLookupTickets} className="space-y-3">
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8d90a0]" />
                  <input
                    type="email"
                    required
                    value={lookupEmail}
                    onChange={(e) => setLookupEmail(e.target.value)}
                    placeholder="Seu e-mail (ex: cliente@empresa.com)"
                    className="w-full bg-[#111827] border border-[#2A2F3A] focus:border-[#45dfa4] text-white text-xs rounded-xl pl-10 pr-4 py-2.5 focus:outline-none placeholder:text-[#8d90a0]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#45dfa4]/10"
                >
                  <Search className="w-4 h-4" />
                  <span>Ver Meus Chamados</span>
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2A2F3A] py-6 text-center text-xs font-mono text-[#8d90a0] bg-[#080f17]">
        <p>© 2024 Service Desk. Todos os direitos reservados. Ambiente Seguro.</p>
      </footer>
    </div>
  );
};
