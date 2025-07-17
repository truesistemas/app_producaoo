import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useQuery } from '@tanstack/react-query';

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  status: string;
  createdAt: string;
}

export function usePendingUsers() {
  const { user, hasRole } = useAuth();
  const [lastNotifiedCount, setLastNotifiedCount] = useState(0);

  // Only fetch if user is admin
  const { data: pendingUsers = [], isLoading } = useQuery({
    queryKey: ['pending-users'],
    queryFn: async (): Promise<User[]> => {
      const response = await fetch('/api/users/pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch pending users');
      return response.json();
    },
    enabled: hasRole('admin'),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 25000, // Consider data stale after 25 seconds
  });

  const pendingCount = pendingUsers.length;

  // Check for new pending users and show notification
  useEffect(() => {
    if (hasRole('admin') && pendingCount > lastNotifiedCount && lastNotifiedCount > 0) {
      // New pending users detected
      const newCount = pendingCount - lastNotifiedCount;
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('ProductionTracker', {
          body: `${newCount} novo${newCount > 1 ? 's' : ''} usuário${newCount > 1 ? 's' : ''} aguardando aprovação`,
          icon: '/favicon.ico',
        });
      }
    }
    setLastNotifiedCount(pendingCount);
  }, [pendingCount, hasRole, lastNotifiedCount]);

  // Request notification permission on mount for admins
  useEffect(() => {
    if (hasRole('admin') && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [hasRole]);

  return {
    pendingUsers,
    pendingCount,
    isLoading,
    hasNewUsers: pendingCount > 0,
  };
} 