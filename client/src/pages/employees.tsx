import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Users } from "lucide-react";
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
import type { Employee, InsertEmployee } from "@shared/schema";

export default function Employees() {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<InsertEmployee>({
    name: "",
    registration: "",
    shift: "morning",
    dailyTarget: 100,
    weeklyTarget: 500,
    isActive: true,
  });

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: InsertEmployee) => {
      return await apiRequest("POST", "/api/employees", data);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Colaborador criado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setModalOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar colaborador.",
        variant: "destructive",
      });
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertEmployee> }) => {
      return await apiRequest("PUT", `/api/employees/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Colaborador atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setModalOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar colaborador.",
        variant: "destructive",
      });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/employees/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Colaborador removido com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao remover colaborador.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      registration: "",
      shift: "morning",
      dailyTarget: 100,
      weeklyTarget: 500,
      isActive: true,
    });
    setEditingEmployee(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingEmployee) {
      updateEmployeeMutation.mutate({ id: editingEmployee.id, data: formData });
    } else {
      createEmployeeMutation.mutate(formData);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      registration: employee.registration,
      shift: employee.shift,
      dailyTarget: employee.dailyTarget || 100,
      weeklyTarget: employee.weeklyTarget || 500,
      isActive: employee.isActive,
    });
    setModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover este colaborador?")) {
      deleteEmployeeMutation.mutate(id);
    }
  };

  const getShiftBadge = (shift: string) => {
    switch (shift) {
      case "morning":
        return <Badge className="bg-blue-100 text-blue-800">Manhã</Badge>;
      case "afternoon":
        return <Badge className="bg-orange-100 text-orange-800">Tarde</Badge>;
      case "night":
        return <Badge className="bg-purple-100 text-purple-800">Noite</Badge>;
      default:
        return <Badge variant="secondary">{shift}</Badge>;
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 py-4 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Colaboradores</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gerencie os colaboradores e suas atribuições
            </p>
          </div>
          
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Colaborador
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingEmployee ? "Editar Colaborador" : "Novo Colaborador"}
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
                  <Label>Matrícula *</Label>
                  <Input
                    value={formData.registration}
                    onChange={(e) => setFormData({ ...formData, registration: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label>Turno *</Label>
                  <Select
                    value={formData.shift}
                    onValueChange={(value) => setFormData({ ...formData, shift: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Manhã</SelectItem>
                      <SelectItem value="afternoon">Tarde</SelectItem>
                      <SelectItem value="night">Noite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Meta Diária</Label>
                  <Input
                    type="number"
                    value={formData.dailyTarget || ''}
                    onChange={(e) => setFormData({ ...formData, dailyTarget: parseInt(e.target.value) || 0 })}
                  />
                </div>
                
                <div>
                  <Label>Meta Semanal</Label>
                  <Input
                    type="number"
                    value={formData.weeklyTarget || ''}
                    onChange={(e) => setFormData({ ...formData, weeklyTarget: parseInt(e.target.value) || 0 })}
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingEmployee ? "Atualizar" : "Criar"}
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
          ) : employees.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Nenhum colaborador cadastrado</p>
              <p className="text-sm">Clique em "Novo Colaborador" para começar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Nome</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Matrícula</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Turno</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Meta Diária</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Status</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6 font-medium text-gray-900">{employee.name}</td>
                      <td className="py-4 px-6 text-gray-700">{employee.registration}</td>
                      <td className="py-4 px-6">{getShiftBadge(employee.shift)}</td>
                      <td className="py-4 px-6 text-gray-700">{employee.dailyTarget}</td>
                      <td className="py-4 px-6">
                        <Badge className={employee.isActive ? "bg-success-100 text-success-800" : "bg-gray-100 text-gray-600"}>
                          {employee.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(employee)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(employee.id)}
                          >
                            <Trash2 className="w-4 h-4" />
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
