import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  status: string; // CRITICAL: Status field for access control
  createdAt: string;
}

export interface RegisterResponse {
  requiresApproval?: boolean;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<RegisterResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasMinimumRole: (role: string) => boolean;
}

export interface RegisterData {
  username: string;
  password: string;
  name: string;
  role?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Role hierarchy for permission checking
const ROLE_HIERARCHY = {
  admin: 3,
  supervisor: 2,
  operator: 1,
} as const;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const isAuthenticated = !!user && !!token;

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      setToken(savedToken);
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  // Set authorization header for requests
  const apiRequest = async (url: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // SECURITY: Handle status-related auth errors - force logout
      if (response.status === 403 && 
          (errorData.error === 'PENDING_APPROVAL' || 
           errorData.error === 'ACCOUNT_REJECTED' || 
           errorData.error === 'ACCESS_DENIED')) {
        
        // Force logout for status issues
        setUser(null);
        setToken(null);
        localStorage.removeItem('auth_token');
        
        toast({
          title: 'Acesso Negado',
          description: errorData.message || 'Sua conta não está mais ativa.',
          variant: 'destructive',
        });
        
        // Don't throw error to prevent additional error handling
        throw new Error('SESSION_TERMINATED');
      }
      
      throw new Error(errorData.message || 'Request failed');
    }

    return response;
  };

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('auth_token', data.token);

      toast({
        title: 'Login realizado com sucesso',
        description: `Bem-vindo(a), ${data.user.name}!`,
      });
    } catch (error) {
      toast({
        title: 'Erro no login',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<RegisterResponse> => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      
      // SECURITY: ALL new registrations require approval - NEVER auto-login
      // This is a critical security measure to prevent unauthorized access
      toast({
        title: 'Conta criada com sucesso!',
        description: 'Sua conta foi criada e está aguardando aprovação de um administrador.',
      });
      return { requiresApproval: true };
    } catch (error) {
      toast({
        title: 'Erro no cadastro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    
    toast({
      title: 'Logout realizado',
      description: 'Você foi desconectado com sucesso.',
    });
  };

  const refreshUser = async () => {
    try {
      if (!token) return;
      
      const response = await apiRequest('/api/auth/me');
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      // Token is invalid or expired
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  const hasMinimumRole = (requiredRole: string): boolean => {
    if (!user) return false;
    
    const userLevel = ROLE_HIERARCHY[user.role as keyof typeof ROLE_HIERARCHY] || 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole as keyof typeof ROLE_HIERARCHY] || 999;
    
    return userLevel >= requiredLevel;
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
    hasRole,
    hasMinimumRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 