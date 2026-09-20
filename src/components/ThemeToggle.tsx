import React from 'react';
import { useApp } from '../context/AppContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  compact?: boolean;
  showLabel?: boolean;
  className?: string;
  buttonId?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  compact = true,
  showLabel = false,
  className = '',
  buttonId = 'btn-theme-toggle'
}) => {
  const { theme, toggleTheme, userSession } = useApp();
  const isLight = theme === 'light';

  const tooltipText = isLight
    ? `Tema ativo: Claro (Clique para mudar para Modo Escuro)${userSession.username ? ` • Padrão de @${userSession.username}` : ''}`
    : `Tema ativo: Escuro (Clique para mudar para Modo Claro)${userSession.username ? ` • Padrão de @${userSession.username}` : ''}`;

  if (compact && !showLabel) {
    return (
      <button
        id={buttonId}
        type="button"
        onClick={toggleTheme}
        className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center relative group ${
          isLight
            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300 shadow-sm shadow-emerald-500/10'
            : 'bg-[#151c25] hover:bg-[#1f2630] text-[#45dfa4] border-[#27272a] hover:border-[#45dfa4]/50'
        } ${className}`}
        title={tooltipText}
        aria-label={tooltipText}
      >
        {isLight ? (
          <Sun className="w-4 h-4 text-emerald-600 transition-transform duration-300 group-hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 text-[#45dfa4] transition-transform duration-300 group-hover:-rotate-12" />
        )}
      </button>
    );
  }

  return (
    <button
      id={buttonId}
      type="button"
      onClick={toggleTheme}
      className={`px-3 py-2 rounded-xl border transition-all duration-200 cursor-pointer flex items-center gap-2 text-xs font-semibold ${
        isLight
          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm'
          : 'bg-[#151c25] hover:bg-[#1f2630] text-[#c3c6d7] hover:text-white border-[#27272a]'
      } ${className}`}
      title={tooltipText}
      aria-label={tooltipText}
    >
      <div className={`p-1 rounded-lg ${isLight ? 'bg-emerald-200/60 text-emerald-800' : 'bg-[#1e1e24] text-[#45dfa4]'}`}>
        {isLight ? (
          <Sun className="w-3.5 h-3.5 text-emerald-700" />
        ) : (
          <Moon className="w-3.5 h-3.5 text-[#45dfa4]" />
        )}
      </div>
      <span>{isLight ? 'Modo Claro' : 'Modo Escuro'}</span>
    </button>
  );
};
