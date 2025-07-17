import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, FileText, Download, Filter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Employee, Machine, Matrix, ProductionSession } from "@shared/schema";
import type { ProductionSessionWithDetails } from "@/types";

interface ReportFilters {
  employeeId?: number;
  machineId?: number;
  matrixId?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
}

interface ProductionMetrics {
  totalSessions: number;
  totalPieces: number;
  averageEfficiency: number;
  totalProductionTime: number;
  completedSessions: number;
}

export default function Reports() {
  const { toast } = useToast();
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({});

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: machines = [] } = useQuery<Machine[]>({
    queryKey: ["/api/machines"],
  });

  const { data: matrices = [] } = useQuery<Matrix[]>({
    queryKey: ["/api/matrices"],
  });

  const { data: sessions = [], isLoading } = useQuery<ProductionSessionWithDetails[]>({
    queryKey: ["/api/production-sessions"],
  });

  // Calculate metrics based on filtered data
  const filteredSessions = sessions.filter((session) => {
    let matches = true;
    
    if (filters.employeeId && session.employee.id !== filters.employeeId) {
      matches = false;
    }
    if (filters.machineId && session.machine.id !== filters.machineId) {
      matches = false;
    }
    if (filters.matrixId && session.matrix.id !== filters.matrixId) {
      matches = false;
    }
    if (filters.status && session.status !== filters.status) {
      matches = false;
    }
    if (filters.startDate) {
      const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
      if (sessionDate < filters.startDate) {
        matches = false;
      }
    }
    if (filters.endDate) {
      const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
      if (sessionDate > filters.endDate) {
        matches = false;
      }
    }
    
    return matches;
  });

  const metrics: ProductionMetrics = {
    totalSessions: filteredSessions.length,
    totalPieces: filteredSessions.reduce((sum, session) => sum + session.totalPieces, 0),
    averageEfficiency: filteredSessions.length > 0 
      ? filteredSessions.reduce((sum, session) => sum + session.efficiency, 0) / filteredSessions.length 
      : 0,
    totalProductionTime: filteredSessions.reduce((sum, session) => {
      if (session.endTime) {
        const start = new Date(session.startTime);
        const end = new Date(session.endTime);
        return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
      }
      return sum;
    }, 0),
    completedSessions: filteredSessions.filter(s => s.status === "completed").length,
  };

  const handleApplyFilters = (newFilters: ReportFilters) => {
    setFilters(newFilters);
    setFiltersModalOpen(false);
  };

  const handleClearFilters = () => {
    setFilters({});
    setFiltersModalOpen(false);
  };

  const handleExportReport = () => {
    // Create CSV content
    const headers = [
      "Colaborador",
      "Máquina", 
      "Matriz",
      "Início",
      "Fim",
      "Status",
      "Peças Produzidas",
      "Meta",
      "Eficiência (%)"
    ];
    
    const csvContent = [
      headers.join(","),
      ...filteredSessions.map(session => [
        session.employee.name,
        session.machine.name,
        session.matrix.code,
        new Date(session.startTime).toLocaleString("pt-BR"),
        session.endTime ? new Date(session.endTime).toLocaleString("pt-BR") : "Em andamento",
        session.status === "running" ? "Produzindo" : 
        session.status === "paused" ? "Pausada" : 
        session.status === "completed" ? "Finalizada" : session.status,
        session.totalPieces,
        session.targetPieces,
        session.efficiency.toFixed(1)
      ].join(","))
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_producao_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Relatório Exportado",
      description: "O relatório foi baixado com sucesso.",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <Badge className="bg-success-100 text-success-800">Produzindo</Badge>;
      case "paused":
        return <Badge className="bg-warning-100 text-warning-800">Pausada</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Finalizada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60)); // minutes
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  };

  const activeFiltersCount = Object.values(filters).filter(value => value !== undefined && value !== "").length;

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 py-4 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Relatórios</h1>
            <p className="text-sm text-gray-500 mt-1">
              Análise de produção e eficiência
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Dialog open={filtersModalOpen} onOpenChange={setFiltersModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="relative">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Filtros de Relatório</DialogTitle>
                </DialogHeader>
                
                <ReportFiltersForm
                  filters={filters}
                  employees={employees}
                  machines={machines}
                  matrices={matrices}
                  onApply={handleApplyFilters}
                  onClear={handleClearFilters}
                />
              </DialogContent>
            </Dialog>
            
            <Button onClick={handleExportReport} disabled={filteredSessions.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-20 lg:pb-8">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total de Sessões</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{metrics.totalSessions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Peças Produzidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{metrics.totalPieces.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Eficiência Média</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{metrics.averageEfficiency.toFixed(1)}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Tempo Total (h)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{metrics.totalProductionTime.toFixed(1)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Finalizadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{metrics.completedSessions}</div>
            </CardContent>
          </Card>
        </div>

        {/* Sessions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Sessões de Produção
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Carregando...</div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Nenhuma sessão encontrada</p>
                <p className="text-sm">Ajuste os filtros para ver resultados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Colaborador</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Máquina</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Matriz</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Data/Hora</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Duração</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Produzido</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Meta</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Eficiência</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSessions.map((session) => (
                      <tr key={session.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900">{session.employee.name}</td>
                        <td className="py-3 px-4 text-gray-700">{session.machine.name}</td>
                        <td className="py-3 px-4 text-gray-700">{session.matrix.code}</td>
                        <td className="py-3 px-4 text-gray-700">
                          {new Date(session.startTime).toLocaleDateString("pt-BR")} {" "}
                          {new Date(session.startTime).toLocaleTimeString("pt-BR", { 
                            hour: "2-digit", 
                            minute: "2-digit" 
                          })}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {formatDuration(session.startTime, session.endTime)}
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(session.status)}</td>
                        <td className="py-3 px-4 font-medium text-gray-900">{session.totalPieces}</td>
                        <td className="py-3 px-4 text-gray-500">{session.targetPieces}</td>
                        <td className="py-3 px-4">
                          <span className={`font-medium ${
                            session.efficiency >= 100 ? "text-success-600" :
                            session.efficiency >= 80 ? "text-warning-600" :
                            "text-error-600"
                          }`}>
                            {session.efficiency.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}

interface ReportFiltersFormProps {
  filters: ReportFilters;
  employees: Employee[];
  machines: Machine[];
  matrices: Matrix[];
  onApply: (filters: ReportFilters) => void;
  onClear: () => void;
}

function ReportFiltersForm({ 
  filters, 
  employees, 
  machines, 
  matrices, 
  onApply, 
  onClear 
}: ReportFiltersFormProps) {
  const [formFilters, setFormFilters] = useState<ReportFilters>(filters);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(formFilters);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Colaborador</Label>
          <Select
            value={formFilters.employeeId?.toString() || "all"}
            onValueChange={(value) => setFormFilters({ 
              ...formFilters, 
              employeeId: value !== "all" ? parseInt(value) : undefined 
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os colaboradores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os colaboradores</SelectItem>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id.toString()}>
                  {employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Máquina</Label>
          <Select
            value={formFilters.machineId?.toString() || "all"}
            onValueChange={(value) => setFormFilters({ 
              ...formFilters, 
              machineId: value !== "all" ? parseInt(value) : undefined 
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas as máquinas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as máquinas</SelectItem>
              {machines.map((machine) => (
                <SelectItem key={machine.id} value={machine.id.toString()}>
                  {machine.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Matriz</Label>
          <Select
            value={formFilters.matrixId?.toString() || "all"}
            onValueChange={(value) => setFormFilters({ 
              ...formFilters, 
              matrixId: value !== "all" ? parseInt(value) : undefined 
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas as matrizes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as matrizes</SelectItem>
              {matrices.map((matrix) => (
                <SelectItem key={matrix.id} value={matrix.id.toString()}>
                  {matrix.code} - {matrix.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Status</Label>
          <Select
            value={formFilters.status || "all"}
            onValueChange={(value) => setFormFilters({ 
              ...formFilters, 
              status: value !== "all" ? value : undefined 
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="running">Produzindo</SelectItem>
              <SelectItem value="paused">Pausada</SelectItem>
              <SelectItem value="completed">Finalizada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Data Inicial</Label>
          <Input
            type="date"
            value={formFilters.startDate || ""}
            onChange={(e) => setFormFilters({ 
              ...formFilters, 
              startDate: e.target.value || undefined 
            })}
          />
        </div>

        <div>
          <Label>Data Final</Label>
          <Input
            type="date"
            value={formFilters.endDate || ""}
            onChange={(e) => setFormFilters({ 
              ...formFilters, 
              endDate: e.target.value || undefined 
            })}
          />
        </div>
      </div>

      <div className="flex space-x-3 pt-4">
        <Button type="button" variant="outline" className="flex-1" onClick={onClear}>
          Limpar Filtros
        </Button>
        <Button type="submit" className="flex-1">
          Aplicar Filtros
        </Button>
      </div>
    </form>
  );
}
