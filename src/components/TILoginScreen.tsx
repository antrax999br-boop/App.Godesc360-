import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { APP_LOGO } from '../data/mockData';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldAlert, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export const TILoginScreen: React.FC = () => {
  const { tiLogin, currentScreen, setCurrentScreen } = useApp();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLockedError, setIsLockedError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated in TI, redirect to dashboard automatically
  useEffect(() => {
    if (currentScreen === 'ti_login') {
      // Check if session valid
    }
  }, [currentScreen]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLockedError(false);
    setIsLoading(true);

    const userClean = usernameOrEmail.trim().toLowerCase();
    const passClean = password.trim();

    setTimeout(() => {
      const result = tiLogin(userClean, passClean);
      setIsLoading(false);

      if (!result.success) {
        setErrorMsg(result.message);
        if (result.locked) {
          setIsLockedError(true);
        }
      }
    }, 300);
  };

  const fillQuickCredentials = (usr: string, pass: string) => {
    setUsernameOrEmail(usr);
    setPassword(pass);
    setErrorMsg(null);
    setIsLockedError(false);
  };

  return (
    <div className="min-h-screen bg-[#1e1e24] text-[#dfe2eb] flex flex-col justify-between items-center px-4 py-8 relative selection:bg-[#45dfa4]/30 selection:text-[#45dfa4]">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#45dfa4]/20 via-[#1e1e24] to-[#1e1e24]"></div>

      {/* Top Header / Back Button */}
      <div className="w-full max-w-md flex justify-between items-center z-10">
        <button
          onClick={() => setCurrentScreen('portal_landing')}
          className="text-xs font-mono text-[#8d90a0] hover:text-[#45dfa4] transition-colors flex items-center gap-1 cursor-pointer"
        >
          ← Voltar ao Início
        </button>
        <span className="text-xs font-mono text-[#45dfa4] bg-[#181c22] px-3 py-1 rounded-full border border-[#45dfa4]/30 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Área Protegida T.I.</span>
        </span>
      </div>

      {/* Main Login Card Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md my-auto z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div
            className="flex items-center justify-center cursor-pointer mb-2"
            onClick={() => setCurrentScreen('portal_landing')}
          >
            <img
              src={APP_LOGO}
              alt="Logo Geral"
              className="h-12 w-auto object-contain"
            />
          </div>
          <p className="text-xs font-mono text-[#45dfa4] tracking-wider uppercase font-bold">
            Autenticação Exclusiva Módulo T.I.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#151c25] border border-[#2A2F3A] rounded-2xl p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center justify-center gap-2 mb-6">
            <ShieldCheck className="w-5 h-5 text-[#45dfa4]" />
            <h2 className="text-lg font-bold text-white text-center">
              Login Obrigatório — Módulo T.I.
            </h2>
          </div>

          {/* Quick Credential Hints for Demo / Testing */}
          <div className="mb-5 p-3 rounded-xl bg-[#45dfa4]/10 border border-[#45dfa4]/30 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#45dfa4] font-medium">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Conta T.I: <strong>t.i</strong> / <strong>t.i</strong></span>
              </div>
              <button
                type="button"
                onClick={() => fillQuickCredentials('t.i', 't.i')}
                className="px-2 py-0.5 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold rounded text-[11px] transition-colors cursor-pointer"
              >
                Usar T.I
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[#45dfa4]/20 text-[11px] text-[#c3c6d7]">
              <span>Gestor: <strong>admin.gestor</strong> / <strong>gestor</strong></span>
              <button
                type="button"
                onClick={() => fillQuickCredentials('admin.gestor', 'gestor')}
                className="px-2 py-0.5 bg-[#181c22] hover:bg-[#283240] text-white font-semibold rounded border border-[#2A2F3A] text-[10px] cursor-pointer"
              >
                Usar Gestor
              </button>
            </div>
          </div>

          {/* Error Message & Account Block Banner */}
          {errorMsg && (
            <div
              className={`mb-5 p-3.5 rounded-xl text-xs flex items-start gap-2.5 border ${
                isLockedError
                  ? 'bg-[#93000a]/30 border-[#ffb4ab]/50 text-[#ffdad6]'
                  : 'bg-[#ffb4ab]/10 border-[#ffb4ab]/30 text-[#ffb4ab]'
              }`}
            >
              {isLockedError ? (
                <ShieldAlert className="w-5 h-5 shrink-0 text-[#ffb4ab] mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-bold">{errorMsg}</p>
                {isLockedError && (
                  <p className="text-[11px] opacity-90">
                    O bloqueio persiste no banco de dados. Para desbloquear, solicite a um <strong>CEO</strong>, <strong>GESTOR</strong> ou <strong>CONTA T.I.</strong> autorizada.
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Username / Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="ti_login_user"
                className="text-[11px] font-mono uppercase tracking-wider text-[#c3c6d7]"
              >
                Usuário / E-mail do T.I.
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8d90a0]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="ti_login_user"
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="t.i ou usuario@empresa.com"
                  className="w-full bg-white text-gray-900 font-medium placeholder:text-gray-400 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#45dfa4] transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="ti_login_password"
                  className="text-[11px] font-mono uppercase tracking-wider text-[#c3c6d7]"
                >
                  Senha de Acesso
                </label>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8d90a0]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="ti_login_password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white text-gray-900 font-medium placeholder:text-gray-400 rounded-lg pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#45dfa4] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-800"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                id="btn-ti-login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#45dfa4]/10 cursor-pointer disabled:opacity-50"
              >
                <span>{isLoading ? 'Autenticando...' : 'Acessar Módulo T.I.'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Info note */}
          <div className="mt-6 pt-5 border-t border-[#2A2F3A] text-center text-[11px] text-[#8d90a0] font-mono">
            <span>Segurança Reforçada • Regra: 3 tentativas incorretas = Bloqueio</span>
          </div>
        </div>
      </motion.div>

      {/* Page Footer */}
      <footer className="text-center text-[11px] font-mono text-[#8d90a0] z-10">
        <p>© 2024 GODESC IT SERVICES. ÁREA PROTEGIDA T.I.</p>
      </footer>
    </div>
  );
};
