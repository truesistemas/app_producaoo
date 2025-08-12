import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Package, 
  Play, 
  BarChart3,
  Factory,
  LogOut,
  User,
  Shield,
  Package2,
  PauseCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { usePendingUsers } from "@/hooks/use-pending-users";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Colaboradores", href: "/colaboradores", icon: Users },
  { name: "Máquinas", href: "/maquinas", icon: Settings },
  { name: "Matéria Prima", href: "/materia-prima", icon: Package2 },
  { name: "Matrizes", href: "/matrizes", icon: Package },
  { name: "Produção", href: "/producao", icon: Play },
  { name: "Motivos de Pausa", href: "/motivos-pausa", icon: PauseCircle, supervisorOnly: true },
  { name: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { name: "Usuários", href: "/usuarios", icon: Shield, adminOnly: true },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout, hasRole } = useAuth();
  const { pendingCount } = usePendingUsers();

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'supervisor':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'operator':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'supervisor':
        return 'Supervisor';
      case 'operator':
        return 'Operador';
      default:
        return role;
    }
  };

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
        <Factory className="text-primary text-2xl mr-3" />
        <h1 className="text-lg font-semibold text-gray-900">ControleProd</h1>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation
          .filter((item) => {
            if (item.adminOnly && user?.role !== 'admin') return false;
            if (item.supervisorOnly && !hasRole('supervisor')) return false;
            return true;
          })
          .map((item) => {
            const isActive = location === item.href;
            const showPendingBadge = item.name === "Usuários" && hasRole('admin') && pendingCount > 0;
            
            return (
              <Link key={item.name} href={item.href}>
                <div className={cn(
                  "flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "text-white bg-primary"
                    : "text-gray-700 hover:bg-gray-100"
                )}>
                  <div className="flex items-center">
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </div>
                  {showPendingBadge && (
                    <Badge 
                      variant="destructive" 
                      className="h-5 px-2 text-xs font-medium animate-pulse"
                    >
                      {pendingCount}
                    </Badge>
                  )}
                </div>
              </Link>
            );
          })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-start p-3 h-auto hover:bg-gray-100"
            >
              <div className="flex items-center w-full">
                <div className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full mr-3">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {user?.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {user?.username}
                  </div>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.username}
                </p>
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem disabled>
              <Shield className="mr-2 h-4 w-4" />
              <span className="flex-1">Nível de acesso</span>
              <Badge 
                variant="outline" 
                className={cn("text-xs", getRoleBadgeColor(user?.role || ''))}
              >
                {getRoleLabel(user?.role || '')}
              </Badge>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={logout}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
