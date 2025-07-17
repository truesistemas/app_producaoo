import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Employee, Machine, Matrix } from "@shared/schema";
import type { ProductionModalData } from "@/types";

interface ProductionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProductionModal({ open, onOpenChange }: ProductionModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ProductionModalData>({
    employeeId: 0,
    machineId: 0,
    matrixId: 0,
    targetPieces: 100,
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: machines = [] } = useQuery<Machine[]>({
    queryKey: ["/api/machines"],
  });

  const { data: matrices = [] } = useQuery<Matrix[]>({
    queryKey: ["/api/matrices"],
  });

  const startProductionMutation = useMutation({
    mutationFn: async (data: ProductionModalData) => {
      return await apiRequest("POST", "/api/production-sessions", data);
    },
    onSuccess: () => {
      toast({
        title: "Produção Iniciada",
        description: "Sessão de produção criada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/production-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      onOpenChange(false);
      setFormData({
        employeeId: 0,
        machineId: 0,
        matrixId: 0,
        targetPieces: 100,
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao iniciar produção. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.employeeId === 0 || formData.machineId === 0 || formData.matrixId === 0) {
      toast({
        title: "Dados Incompletos",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    startProductionMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Controle de Produção</DialogTitle>
          <DialogDescription>
            Preencha os dados para iniciar uma nova sessão de produção.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Colaborador *</Label>
            <Select
              value={formData.employeeId > 0 ? formData.employeeId.toString() : ""}
              onValueChange={(value) => setFormData({ ...formData, employeeId: parseInt(value) || 0 })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selecione um colaborador" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id.toString()}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-700">Máquina *</Label>
            <Select
              value={formData.machineId > 0 ? formData.machineId.toString() : ""}
              onValueChange={(value) => setFormData({ ...formData, machineId: parseInt(value) || 0 })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selecione uma máquina" />
              </SelectTrigger>
              <SelectContent>
                {machines.map((machine) => (
                  <SelectItem key={machine.id} value={machine.id.toString()}>
                    {machine.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-700">Matriz *</Label>
            <Select
              value={formData.matrixId > 0 ? formData.matrixId.toString() : ""}
              onValueChange={(value) => setFormData({ ...formData, matrixId: parseInt(value) || 0 })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selecione uma matriz" />
              </SelectTrigger>
              <SelectContent>
                {matrices.map((matrix) => (
                  <SelectItem key={matrix.id} value={matrix.id.toString()}>
                    {matrix.code} - {matrix.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Meta de Peças</Label>
            <Input
              type="number"
              value={formData.targetPieces}
              onChange={(e) => setFormData({ ...formData, targetPieces: parseInt(e.target.value) })}
              className="mt-2"
              min="1"
            />
          </div>
          
          <div className="flex space-x-3 pt-6 mt-6 border-t border-gray-200">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={startProductionMutation.isPending}
            >
              {startProductionMutation.isPending ? "Iniciando..." : "Iniciar Produção"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
