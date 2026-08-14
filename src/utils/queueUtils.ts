import { UserAccount, ServiceQueue } from '../types';

export const getOperatorsForQueue = (managedUsers: UserAccount[], queue?: ServiceQueue | string): UserAccount[] => {
  if (!managedUsers || managedUsers.length === 0) return [];
  if (!queue || queue === 'Todas') return managedUsers;

  const qUpper = (queue || 'N1').toUpperCase();

  const filtered = managedUsers.filter((u) => {
    const role = (u.role || '').toLowerCase();
    // Admin, Gestor, and CEO have access across all queues
    if (['admin', 'gestor', 'ceo'].includes(role)) return true;

    if (qUpper === 'N1') return role === 'n1' || role === 'technician';
    if (qUpper === 'N2') return role === 'n2';
    if (qUpper === 'N3') return role === 'n3';
    if (qUpper === 'ADM') return role === 'admin' || role === 'gestor' || role === 'ceo';
    return true;
  });

  // Fallback to all managed users if no operator matches role specific to queue
  return filtered.length > 0 ? filtered : managedUsers;
};
