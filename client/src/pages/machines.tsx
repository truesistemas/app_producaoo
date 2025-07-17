import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Machine, InsertMachine } from "@shared/schema";

export default function Machines() {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [formData, setFormData] = useState<InsertMachine>({
    name: "",
    code: "",
    maxCapacityPerDay: 0,
    status: "inactive",
    isAvailable: true,
  });

  const { data: machines = [], isLoading } = useQuery<Machine[]>({
    queryKey: ["/api/machines"],
  });

  const createMachineMutation = useMutation({
    mutationFn: async (data: InsertMachine) => {
      return await apiRequest("POST", "/api/machines", data);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Máquina criada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/machines"] });
      setModalOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar máquina.",
        variant: "destructive",
      });
    },
  });

  const updateMachineMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertMachine> }) => {
      return await apiRequest("PUT", `/api/machines/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Máquina atualizada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/machines"] });
      setModalOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar máquina.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      maxCapacityPerDay: 0,
      status: "inactive",
      isAvailable: true,
    });
    setEditingMachine(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingMachine) {
      updateMachineMutation.mutate({ id: editingMachine.id, data: formData });
    } else {
      createMachineMutation.mutate(formData);
    }
  };

  const handleEdit = (machine: Machine) => {
    setEditingMachine(machine);
    setFormData({
      name: machine.name,
      code: machine.code,
      maxCapacityPerDay: machine.maxCapacityPerDay || 0,
      status: machine.status,
      isAvailable: machine.isAvailable,
    });
    setModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success-100 text-success-800">Ativa</Badge>;
      case "maintenance":
        return <Badge className="bg-warning-100 text-warning-800">Manutenção</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-600">Inativa</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 py-4 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Máquinas Injetoras</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gerencie as máquinas e sua disponibilidade
            </p>
          </div>
          
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Máquina
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingMachine ? "Editar Máquina" : "Nova Máquina"}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Nome *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label>Código *</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label>Capacidade Máxima/Dia</Label>
                  <Input
                    type="number"
                    value={formData.maxCapacityPerDay || ''}
                    onChange={(e) => setFormData({ ...formData, maxCapacityPerDay: parseInt(e.target.value) || 0 })}
                  />
                </div>
                
                <div>
                  <Label>Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativa</SelectItem>
                      <SelectItem value="inactive">Inativa</SelectItem>
                      <SelectItem value="maintenance">Manutenção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingMachine ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-20 lg:pb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Carregando...</div>
          ) : machines.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Settings className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Nenhuma máquina cadastrada</p>
              <p className="text-sm">Clique em "Nova Máquina" para começar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Nome</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Código</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Capacidade/Dia</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Status</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Disponível</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {machines.map((machine) => (
                    <tr key={machine.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6 font-medium text-gray-900">{machine.name}</td>
                      <td className="py-4 px-6 text-gray-700">{machine.code}</td>
                      <td className="py-4 px-6 text-gray-700">{machine.maxCapacityPerDay}</td>
                      <td className="py-4 px-6">{getStatusBadge(machine.status)}</td>
                      <td className="py-4 px-6">
                        <Badge className={machine.isAvailable ? "bg-success-100 text-success-800" : "bg-gray-100 text-gray-600"}>
                          {machine.isAvailable ? "Sim" : "Não"}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(machine)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
