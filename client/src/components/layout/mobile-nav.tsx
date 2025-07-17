import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Play, 
  BarChart3,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { usePendingUsers } from "@/hooks/use-pending-users";
import { Badge } from "@/components/ui/badge";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Colaboradores", href: "/colaboradores", icon: Users },
  { name: "Máquinas", href: "/maquinas", icon: Settings },
  { name: "Produção", href: "/producao", icon: Play },
  { name: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { name: "Usuários", href: "/usuarios", icon: Shield, adminOnly: true },
];

export default function MobileNav() {
  const [location] = useLocation();
  const { user, hasRole } = useAuth();
  const { pendingCount } = usePendingUsers();

  const filteredNavigation = navigation.filter(
    (item) => !item.adminOnly || user?.role === 'admin'
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex justify-around">
        {filteredNavigation.map((item) => {
          const isActive = location === item.href;
          const showPendingBadge = item.name === "Usuários" && hasRole('admin') && pendingCount > 0;
          
          return (
            <Link key={item.name} href={item.href}>
              <div className={cn(
                "flex flex-col items-center py-2 px-3 transition-colors relative",
                isActive ? "text-primary" : "text-gray-500"
              )}>
                <div className="relative">
                  <item.icon className="text-lg mb-1" />
                  {showPendingBadge && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center animate-pulse"
                    >
                      {pendingCount}
                    </Badge>
                  )}
                </div>
                <span className="text-xs font-medium">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
