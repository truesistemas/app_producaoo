import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { RequireAuth, RequireMinimumRole } from "@/components/auth/route-guard";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Employees from "@/pages/employees";
import Machines from "@/pages/machines";
import Matrices from "@/pages/matrices";
import Production from "@/pages/production";
import Reports from "@/pages/reports";
import UsersPage from "@/pages/users";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/auth-context";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      <Route path="/">
        <RequireAuth>
          <Dashboard />
        </RequireAuth>
      </Route>
      
      <Route path="/colaboradores">
        <RequireAuth>
          <Employees />
        </RequireAuth>
      </Route>
      
      <Route path="/maquinas">
        <RequireAuth>
          <Machines />
        </RequireAuth>
      </Route>
      
      <Route path="/matrizes">
        <RequireAuth>
          <Matrices />
        </RequireAuth>
      </Route>
      
      <Route path="/producao">
        <RequireAuth>
          <Production />
        </RequireAuth>
      </Route>
      
      <Route path="/relatorios">
        <RequireAuth>
          <Reports />
        </RequireAuth>
      </Route>
      
      <Route path="/usuarios">
        <RequireAuth>
          <RequireMinimumRole role="admin">
            <UsersPage />
          </RequireMinimumRole>
        </RequireAuth>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen bg-gray-50">
      {isAuthenticated && !isMobile && <Sidebar />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Router />
      </div>
      {isAuthenticated && isMobile && <MobileNav />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AppLayout />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
