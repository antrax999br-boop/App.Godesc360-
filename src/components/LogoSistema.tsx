import React from 'react';
import { useApp } from '../context/AppContext';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  onClick?: () => void;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  showSubtitle = false,
  className = '',
  onClick
}) => {
  const { theme } = useApp();
  const isDark = theme === 'dark';

  // Dimension presets based on size
  const imgHeight = {
    sm: 'h-7',
    md: 'h-9',
    lg: 'h-12',
    xl: 'h-16'
  }[size];

  // Contorno preto pronunciado no modo escuro conforme solicitado pelo usuário
  const darkContourStyle: React.CSSProperties = isDark
    ? {
        filter:
          'drop-shadow(2px 0 0 #000000) drop-shadow(-2px 0 0 #000000) drop-shadow(0 2px 0 #000000) drop-shadow(0 -2px 0 #000000) drop-shadow(1px 1px 0 #000000) drop-shadow(-1px -1px 0 #000000) drop-shadow(0 0 6px rgba(0, 0, 0, 0.95))'
      }
    : {
        filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.06))'
      };

  // No modo escuro usa a imagem com contorno preto reforçado. No modo claro usa a versão com letras escuras legíveis.
  const logoSrc = isDark ? '/logo-geral-dark-contour.png' : '/logo-geral-light.png';

  return (
    <div
      onClick={onClick}
      className={`inline-flex flex-col items-center justify-center select-none transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:opacity-90 active:scale-95' : ''
      } ${className}`}
      title="GoDesc 360 - Service Desk"
    >
      <img
        src={logoSrc}
        alt="GoDesc 360"
        style={darkContourStyle}
        className={`${imgHeight} w-auto object-contain transition-all duration-300`}
      />
      {showSubtitle && (
        <span
          className={`font-mono text-[10px] tracking-widest uppercase font-bold mt-1 ${
            isDark ? 'text-[#8d90a0]' : 'text-slate-500'
          }`}
        >
          Service Desk 360
        </span>
      )}
    </div>
  );
};

export const LogoSistema = AppLogo;
