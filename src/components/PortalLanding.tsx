import React from 'react';
import { useApp } from '../context/AppContext';

import { APP_LOGO } from '../data/mockData';
import { Plus, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export const PortalLanding: React.FC = () => {
  const { setCurrentScreen, userSession } = useApp();

  return (
    <div className="min-h-screen bg-[#1e1e24] text-[#dfe2eb] flex flex-col justify-between selection:bg-[#45dfa4]/30 selection:text-[#45dfa4]">
      {/* Top Header with GoDesc Logo */}
      <header className="w-full border-b border-[#27272a] bg-[#18181b]/90 backdrop-blur-md px-6 md:px-12 py-4 flex items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setCurrentScreen('portal_landing')}
        >
          <img
            src={APP_LOGO}
            alt="Logo Geral"
            className="h-10 w-auto object-contain"
          />
        </div>
      </header>

      {/* Hero Body */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 md:py-20 max-w-5xl mx-auto w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-4 max-w-2xl mb-12"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            GoDesc 360 Suporte !
          </h1>
          <p className="text-base sm:text-lg text-[#c3c6d7] font-normal leading-relaxed">
            A melhor infraestrutura 360 apenas na GoDesc 360 !
          </p>
        </motion.div>

        {/* 2 Primary Service Path Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full max-w-3xl">
          {/* Card 1: Abrir Chamado */}
          <motion.div
            id="btn-open-ticket-landing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            whileHover={{ scale: 1.02, translateY: -4 }}
            onClick={() => setCurrentScreen('client_home')}
            className="group cursor-pointer bg-[#181c22]/90 hover:bg-[#1f2630] border border-[#2A2F3A] hover:border-[#45dfa4]/60 rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center text-center transition-all duration-300 shadow-xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#45dfa4]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="w-16 h-16 rounded-full bg-[#262a31] border border-[#434655] group-hover:border-[#45dfa4] group-hover:bg-[#45dfa4]/10 flex items-center justify-center mb-6 transition-all duration-300">
              <Plus className="w-8 h-8 text-[#dfe2eb] group-hover:text-[#45dfa4] transition-colors" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-[#45dfa4] transition-colors">
              Abrir Chamado
            </h2>
            <p className="text-sm text-[#8d90a0] group-hover:text-[#c3c6d7] transition-colors max-w-xs">
              Relate um problema ou solicite um novo atendimento.
            </p>

            <div className="mt-6 flex items-center gap-2 text-xs font-mono text-[#45dfa4] opacity-80 group-hover:opacity-100">
              <span>Acessar Portal do Solicitante</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

          {/* Card 2: Acesso Técnico */}
          <motion.div
            id="btn-tech-access-landing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            whileHover={{ scale: 1.02, translateY: -4 }}
            onClick={() => {
              setCurrentScreen('ti_login');
            }}
            className="group cursor-pointer bg-[#181c22]/90 hover:bg-[#1f2630] border border-[#2A2F3A] hover:border-[#2563eb]/60 rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center text-center transition-all duration-300 shadow-xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#2563eb]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="w-16 h-16 rounded-full bg-[#262a31] border border-[#434655] group-hover:border-[#2563eb] group-hover:bg-[#2563eb]/10 flex items-center justify-center mb-6 transition-all duration-300">
              <ArrowRight className="w-8 h-8 text-[#dfe2eb] group-hover:text-[#2563eb] transition-colors" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-[#b4c5ff] transition-colors">
              Acesso Técnico
            </h2>
            <p className="text-sm text-[#8d90a0] group-hover:text-[#c3c6d7] transition-colors max-w-xs">
              Acesso restrito para equipe de TI e administração.
            </p>

            <div className="mt-6 flex items-center gap-2 text-xs font-mono text-[#b4c5ff] opacity-80 group-hover:opacity-100">
              <span>Login: t.i • Senha: t.i</span>
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2A2F3A] py-6 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between text-xs text-[#8d90a0] gap-4">
        <p className="font-mono">
          © 2024 GoDesc Enterprise Solutions. Todos os direitos reservados.
        </p>
        <div className="flex items-center gap-6 font-mono tracking-wider">
          <span className="text-[#45dfa4]">GoDesc 360 Infraestrutura</span>
        </div>
      </footer>
    </div>
  );
};
