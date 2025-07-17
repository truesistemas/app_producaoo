import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusCards from "@/components/dashboard/status-cards";
import ProductionTable from "@/components/dashboard/production-table";
import QuickActions from "@/components/dashboard/quick-actions";
import ProductionModal from "@/components/modals/production-modal";
import { useIsMobile } from "@/hooks/use-mobile";
import type { DashboardStats, ProductionSessionWithDetails } from "@/types";

export default function Dashboard() {
  const isMobile = useIsMobile();
  const [productionModalOpen, setProductionModalOpen] = useState(false);

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: activeSessions = [] } = useQuery<ProductionSessionWithDetails[]>({
    queryKey: ["/api/production-sessions/active"],
    refetchInterval: 30000,
  });

  const defaultStats: DashboardStats = {
    activeMachines: 0,
    activeEmployees: 0,
    todayProduction: 0,
    runningSessions: 0,
    overallEfficiency: 0,
  };

  const handleStartProduction = () => {
    setProductionModalOpen(true);
  };

  const handlePauseProduction = () => {
    // TODO: Implement pause all production
    console.log("Pause production");
  };

  const handleAddEmployee = () => {
    // TODO: Navigate to employees page or open employee modal
    console.log("Add employee");
  };

  const handleGenerateReport = () => {
    // TODO: Navigate to reports page or open report modal
    console.log("Generate report");
  };

  return (
    <>
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center lg:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="ml-4 text-lg font-semibold text-gray-900">Dashboard</h1>
          </div>
          
          <div className="hidden lg:block">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard de Produção</h1>
            <p className="text-sm text-gray-500 mt-1">
              {new Date().toLocaleDateString("pt-BR", { 
                weekday: "long", 
                year: "numeric", 
                month: "long", 
                day: "numeric" 
              })}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Button variant="ghost" size="icon">
                <Bell className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 bg-error-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  3
                </span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-20 lg:pb-8">
        <StatusCards stats={stats || defaultStats} />
        
        <QuickActions 
          onStartProduction={handleStartProduction}
          onPauseProduction={handlePauseProduction}
          onAddEmployee={handleAddEmployee}
          onGenerateReport={handleGenerateReport}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ProductionTable sessions={activeSessions} />
          </div>
          
          <div className="space-y-6">
            {/* Active Shifts */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Turnos Ativos</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Turno Manhã</p>
                    <p className="text-sm text-gray-500">06:00 - 14:00</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {stats?.activeEmployees || 0} colaboradores
                    </p>
                    <p className="text-xs text-success-600">Em andamento</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Alerts */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertas Recentes</h3>
              <div className="text-center text-gray-500 py-4">
                Nenhum alerta no momento
              </div>
            </div>
          </div>
        </div>
      </main>

      <ProductionModal 
        open={productionModalOpen}
        onOpenChange={setProductionModalOpen}
      />
    </>
  );
}
