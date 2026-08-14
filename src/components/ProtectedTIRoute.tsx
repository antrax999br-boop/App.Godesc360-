import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ScreenView } from '../types';

interface ProtectedTIRouteProps {
  children: React.ReactNode;
  requiredModule?: ScreenView;
}

export const ProtectedTIRoute: React.FC<ProtectedTIRouteProps> = ({ children, requiredModule }) => {
  const { tiSession, checkTISessionValid, setCurrentScreen } = useApp();

  useEffect(() => {
    const isValid = checkTISessionValid();

    if (!isValid) {
      setCurrentScreen('ti_login');
      return;
    }
  }, [tiSession, requiredModule]);

  if (!tiSession.isAuthenticated || tiSession.expiresAt < Date.now()) {
    return null;
  }

  return <>{children}</>;
};
