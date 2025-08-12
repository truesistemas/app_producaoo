import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";
import type { ProductionSessionWithDetails } from "@/types";

interface ProductionTableProps {
  sessions: ProductionSessionWithDetails[];
}

export default function ProductionTable({ sessions }: ProductionTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <Badge className="bg-success-100 text-success-800 hover:bg-success-100">Produzindo</Badge>;
      case "paused":
        return <Badge className="bg-warning-100 text-warning-800 hover:bg-warning-100">Pausada</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Finalizada</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">Inativa</Badge>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Status de Produção em Tempo Real</h2>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-500">Atualizado agora</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Máquina</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Colaborador</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Matriz</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Produzido</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  Nenhuma sessão de produção ativa no momento
                </td>
              </tr>
            ) : (
              sessions.map((session) => (
                <tr key={session.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                        <Settings className="text-primary-600 text-sm" />
                      </div>
                      <span className="font-medium text-gray-900">{session.machine.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-700">{session.employee.name}</td>
                  <td className="py-4 px-4 text-gray-700">{session.matrix.code}</td>
                  <td className="py-4 px-4">{getStatusBadge(session.status)}</td>
                  <td className="py-4 px-4 font-medium text-gray-900">{session.totalPieces}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
