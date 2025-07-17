import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Package } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Matrix, InsertMatrix } from "@shared/schema";

export default function Matrices() {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMatrix, setEditingMatrix] = useState<Matrix | null>(null);
  const [formData, setFormData] = useState<InsertMatrix>({
    name: "",
    code: "",
    pieceName: "",
    piecesPerCycle: 1,
    isActive: true,
  });

  const { data: matrices = [], isLoading } = useQuery<Matrix[]>({
    queryKey: ["/api/matrices"],
  });

  const createMatrixMutation = useMutation({
    mutationFn: async (data: InsertMatrix) => {
      return await apiRequest("POST", "/api/matrices", data);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Matriz criada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/matrices"] });
      setModalOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar matriz.",
        variant: "destructive",
      });
    },
  });

  const updateMatrixMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertMatrix> }) => {
      return await apiRequest("PUT", `/api/matrices/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Matriz atualizada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/matrices"] });
      setModalOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar matriz.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      pieceName: "",
      piecesPerCycle: 1,
      isActive: true,
    });
    setEditingMatrix(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingMatrix) {
      updateMatrixMutation.mutate({ id: editingMatrix.id, data: formData });
    } else {
      createMatrixMutation.mutate(formData);
    }
  };

  const handleEdit = (matrix: Matrix) => {
    setEditingMatrix(matrix);
    setFormData({
      name: matrix.name,
      code: matrix.code,
      pieceName: matrix.pieceName,
      piecesPerCycle: matrix.piecesPerCycle || 1,
      isActive: matrix.isActive,
    });
    setModalOpen(true);
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 py-4 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Matrizes</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gerencie as matrizes e formas de peças
            </p>
          </div>
          
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Matriz
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingMatrix ? "Editar Matriz" : "Nova Matriz"}
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
                  <Label>Nome da Peça *</Label>
                  <Input
                    value={formData.pieceName}
                    onChange={(e) => setFormData({ ...formData, pieceName: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label>Peças por Ciclo</Label>
                  <Input
                    type="number"
                    value={formData.piecesPerCycle || ''}
                    onChange={(e) => setFormData({ ...formData, piecesPerCycle: parseInt(e.target.value) || 1 })}
                    min="1"
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingMatrix ? "Atualizar" : "Criar"}
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
          ) : matrices.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Nenhuma matriz cadastrada</p>
              <p className="text-sm">Clique em "Nova Matriz" para começar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Nome</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Código</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Peça</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Peças/Ciclo</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Status</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {matrices.map((matrix) => (
                    <tr key={matrix.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6 font-medium text-gray-900">{matrix.name}</td>
                      <td className="py-4 px-6 text-gray-700">{matrix.code}</td>
                      <td className="py-4 px-6 text-gray-700">{matrix.pieceName}</td>
                      <td className="py-4 px-6 text-gray-700">{matrix.piecesPerCycle}</td>
                      <td className="py-4 px-6">
                        <Badge className={matrix.isActive ? "bg-success-100 text-success-800" : "bg-gray-100 text-gray-600"}>
                          {matrix.isActive ? "Ativa" : "Inativa"}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(matrix)}
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
