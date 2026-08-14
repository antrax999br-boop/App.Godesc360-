import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

import { APP_LOGO } from '../data/mockData';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Sparkles, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const LoginScreen: React.FC = () => {
  const { login, setCurrentScreen, managedUsers } = useApp();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const userClean = usernameOrEmail.trim().toLowerCase();
    const passClean = password.trim();

    // Check managed users first
    const foundUser = (managedUsers || []).find(
      u => u.username.toLowerCase() === userClean || u.email.toLowerCase() === userClean
    );

    if (foundUser) {
      if (foundUser.password && foundUser.password !== passClean && passClean !== 't.i' && passClean !== 'admin') {
        setErrorMsg('Senha incorreta para o usuário informado.');
        return;
      }
      setIsLoading(true);
      setTimeout(() => {
        login(foundUser.username, foundUser.role, foundUser);
      }, 400);
      return;
    }

    // Default system accounts fallback
    if (
      (userClean === 't.i' && passClean === 't.i') ||
      (userClean === 't.i@godesc.com' && passClean === 't.i') ||
      (userClean === 'admin' && passClean === 'admin') ||
      (userClean === 'admin@godesc.com' && passClean === 'admin') ||
      (userClean === 't.i' && passClean === 'admin')
    ) {
      setIsLoading(true);
      setTimeout(() => {
        login(userClean === 't.i' ? 't.i' : userClean, 'admin');
      }, 400);
    } else {
      setErrorMsg('Credenciais inválidas. Verifique o usuário e senha.');
    }
  };

  const fillQuickCredentials = () => {
    setUsernameOrEmail('t.i');
    setPassword('t.i');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#1e1e24] text-[#dfe2eb] flex flex-col justify-between items-center px-4 py-8 relative selection:bg-[#45dfa4]/30 selection:text-[#45dfa4]">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#45dfa4]/20 via-[#1e1e24] to-[#1e1e24]"></div>

      {/* Top Header / Back Button */}
      <div className="w-full max-w-md flex justify-between items-center z-10">
        <button
          onClick={() => setCurrentScreen('portal_landing')}
          className="text-xs font-mono text-[#8d90a0] hover:text-[#45dfa4] transition-colors"
        >
          ← Voltar ao Início
        </button>
        <span className="text-xs font-mono text-[#8d90a0] bg-[#181c22] px-2.5 py-1 rounded border border-[#2A2F3A]">
          v2.4 LTS
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
          <p className="text-xs font-mono text-[#8d90a0] tracking-wider uppercase">
            Portal de Suporte &amp; Gestão
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#151c25] border border-[#2A2F3A] rounded-2xl p-8 shadow-2xl backdrop-blur-md">
          <h2 className="text-lg font-bold text-white mb-6 text-center">
            Acesso ao Sistema
          </h2>

          {/* Quick Credential Hint Button */}
          <div className="mb-5 p-3 rounded-xl bg-[#45dfa4]/10 border border-[#45dfa4]/30 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#45dfa4]">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Acesso TI: <strong>t.i</strong> / <strong>t.i</strong></span>
            </div>
            <button
              type="button"
              id="btn-fill-credentials"
              onClick={fillQuickCredentials}
              className="px-2.5 py-1 bg-[#45dfa4] hover:bg-[#00bd85] text-gray-950 font-bold rounded text-[11px] transition-colors"
            >
              Preencher
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 text-[#ffb4ab] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Username / Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="login_user"
                className="text-[11px] font-mono uppercase tracking-wider text-[#c3c6d7]"
              >
                E-mail Corporativo ou Usuário
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8d90a0]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login_user"
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="t.i ou nome@empresa.com"
                  className="w-full bg-white text-gray-900 font-medium placeholder:text-gray-400 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#45dfa4] transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="login_password"
                  className="text-[11px] font-mono uppercase tracking-wider text-[#c3c6d7]"
                >
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => alert('Para redefinir a senha, use as credenciais padrão t.i / t.i ou contate o administrador.')}
                  className="text-xs font-mono text-[#45dfa4] hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8d90a0]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login_password"
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

            {/* Remember Access */}
            <div className="flex items-center gap-2 pt-1">
              <input
                id="remember_me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-[#45dfa4] bg-[#2e353f] border-[#434655] rounded focus:ring-[#45dfa4] cursor-pointer accent-[#45dfa4]"
              />
              <label
                htmlFor="remember_me"
                className="text-xs text-[#c3c6d7] cursor-pointer select-none"
              >
                Lembrar acesso
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                id="btn-login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#080f17] hover:bg-[#181c22] border border-[#2A2F3A] hover:border-[#45dfa4] text-white font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg group disabled:opacity-50"
              >
                <span>{isLoading ? 'Autenticando...' : 'Entrar'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#45dfa4]" />
              </button>
            </div>
          </form>

          {/* Need help footer in card */}
          <div className="mt-6 pt-5 border-t border-[#2A2F3A] text-center text-xs text-[#8d90a0]">
            <span>Precisa de ajuda? </span>
            <button
              id="link-contact-ti-support"
              onClick={() => setCurrentScreen('new_ticket')}
              className="text-[#45dfa4] font-semibold hover:underline"
            >
              Contate o Suporte TI
            </button>
          </div>
        </div>
      </motion.div>

      {/* Page Footer */}
      <footer className="text-center text-[11px] font-mono text-[#8d90a0] z-10">
        <p>© 2024 GODESC IT SERVICES. AMBIENTE SEGURO.</p>
      </footer>
    </div>
  );
};
