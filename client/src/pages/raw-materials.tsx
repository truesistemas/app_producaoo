import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Package2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { RawMaterial, InsertRawMaterial } from "@shared/schema";

export default function RawMaterials() {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [formData, setFormData] = useState<InsertRawMaterial>({
    name: "",
    description: "",
    isActive: true,
  });

  const { data: rawMaterials = [], isLoading } = useQuery<RawMaterial[]>({
    queryKey: ["/api/raw-materials"],
  });

  const createMaterialMutation = useMutation({
    mutationFn: async (data: InsertRawMaterial) => {
      return await apiRequest("POST", "/api/raw-materials", data);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Matéria prima criada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/raw-materials"] });
      setModalOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar matéria prima.",
        variant: "destructive",
      });
    },
  });

  const updateMaterialMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertRawMaterial> }) => {
      return await apiRequest("PUT", `/api/raw-materials/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Matéria prima atualizada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/raw-materials"] });
      setModalOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar matéria prima.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      isActive: true,
    });
    setEditingMaterial(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingMaterial) {
      updateMaterialMutation.mutate({ id: editingMaterial.id, data: formData });
    } else {
      createMaterialMutation.mutate(formData);
    }
  };

  const handleEdit = (material: RawMaterial) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      description: material.description || "",
      isActive: material.isActive,
    });
    setModalOpen(true);
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 py-4 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Matéria Prima</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gerencie os tipos de matérias primas utilizadas na produção
            </p>
          </div>
          
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Matéria Prima
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingMaterial ? "Editar Matéria Prima" : "Nova Matéria Prima"}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Nome *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Polipropileno, Reciclado, etc."
                    required
                  />
                </div>
                
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição opcional da matéria prima"
                    rows={3}
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingMaterial ? "Atualizar" : "Criar"}
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
          ) : rawMaterials.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Package2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Nenhuma matéria prima cadastrada</p>
              <p className="text-sm">Clique em "Nova Matéria Prima" para começar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Nome</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Descrição</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Status</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {rawMaterials.map((material) => (
                    <tr key={material.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6 font-medium text-gray-900">{material.name}</td>
                      <td className="py-4 px-6 text-gray-700">{material.description || '-'}</td>
                      <td className="py-4 px-6">
                        <Badge className={material.isActive ? "bg-success-100 text-success-800" : "bg-gray-100 text-gray-600"}>
                          {material.isActive ? "Ativa" : "Inativa"}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(material)}
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