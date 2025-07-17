import React from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/auth-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle } from 'lucide-react';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRole?: string;
  requireMinimumRole?: string;
  fallback?: React.ReactNode;
}

export function RouteGuard({
  children,
  requireAuth = true,
  requireRole,
  requireMinimumRole,
  fallback,
}: RouteGuardProps) {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading, user, hasRole, hasMinimumRole } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Check if authentication is required
  if (requireAuth && !isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Você precisa estar logado para acessar esta página.
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={() => setLocation('/login')} 
            className="w-full"
          >
            Fazer login
          </Button>
        </div>
      </div>
    );
  }

  // Check specific role requirement
  if (requireRole && !hasRole(requireRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Você não tem permissão para acessar esta página. 
              Apenas usuários com nível "{requireRole}" podem acessar.
              <br />
              <span className="text-sm text-gray-600 mt-2 block">
                Seu nível atual: {user?.role}
              </span>
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={() => setLocation('/')} 
            variant="outline" 
            className="w-full"
          >
            Voltar ao dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Check minimum role requirement
  if (requireMinimumRole && !hasMinimumRole(requireMinimumRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Você não tem nível de acesso suficiente para esta página. 
              É necessário nível "{requireMinimumRole}" ou superior.
              <br />
              <span className="text-sm text-gray-600 mt-2 block">
                Seu nível atual: {user?.role}
              </span>
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={() => setLocation('/')} 
            variant="outline" 
            className="w-full"
          >
            Voltar ao dashboard
          </Button>
        </div>
      </div>
    );
  }

  // User is authenticated and has required permissions
  return <>{children}</>;
}

// Convenience components for common use cases
export function RequireAuth({ children }: { children: React.ReactNode }) {
  return <RouteGuard>{children}</RouteGuard>;
}

export function RequireRole({ 
  role, 
  children 
}: { 
  role: string; 
  children: React.ReactNode; 
}) {
  return <RouteGuard requireRole={role}>{children}</RouteGuard>;
}

export function RequireMinimumRole({ 
  role, 
  children 
}: { 
  role: string; 
  children: React.ReactNode; 
}) {
  return <RouteGuard requireMinimumRole={role}>{children}</RouteGuard>;
} 