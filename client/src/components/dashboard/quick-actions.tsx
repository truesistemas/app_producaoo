import { Play, Pause, UserPlus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickActionsProps {
  onStartProduction: () => void;
  onPauseProduction: () => void;
  onAddEmployee: () => void;
  onGenerateReport: () => void;
}

export default function QuickActions({ 
  onStartProduction, 
  onPauseProduction, 
  onAddEmployee, 
  onGenerateReport 
}: QuickActionsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button
          onClick={onStartProduction}
          className="flex flex-col items-center p-4 h-auto bg-success-50 hover:bg-success-100 text-success-700 border border-success-200"
          variant="outline"
        >
          <Play className="text-2xl mb-2" />
          <span className="text-sm font-medium">Iniciar Produção</span>
        </Button>
        
        <Button
          onClick={onPauseProduction}
          className="flex flex-col items-center p-4 h-auto bg-warning-50 hover:bg-warning-100 text-warning-700 border border-warning-200"
          variant="outline"
        >
          <Pause className="text-2xl mb-2" />
          <span className="text-sm font-medium">Pausar Produção</span>
        </Button>
        
        <Button
          onClick={onAddEmployee}
          className="flex flex-col items-center p-4 h-auto bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200"
          variant="outline"
        >
          <UserPlus className="text-2xl mb-2" />
          <span className="text-sm font-medium">Novo Colaborador</span>
        </Button>
        
        <Button
          onClick={onGenerateReport}
          className="flex flex-col items-center p-4 h-auto bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200"
          variant="outline"
        >
          <FileText className="text-2xl mb-2" />
          <span className="text-sm font-medium">Gerar Relatório</span>
        </Button>
      </div>
    </div>
  );
}
