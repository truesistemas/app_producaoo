import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useIsMobile } from "@/hooks/use-mobile";
import type { PauseReason, PauseReasonFormData } from "@/types";

export default function PauseReasons() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReason, setEditingReason] = useState<PauseReason | null>(null);
  const [formData, setFormData] = useState<PauseReasonFormData>({
    name: "",
    description: "",
    isActive: true,
  });

  const { data: reasons = [], isLoading } = useQuery<PauseReason[]>({
    queryKey: ["/api/pause-reasons"],
  });

  const createReasonMutation = useMutation({
    mutationFn: async (data: PauseReasonFormData) => {
      return await apiRequest("POST", "/api/pause-reasons", data);
    },
    onSuccess: () => {
      toast({
        title: "Motivo Criado",
        description: "Motivo de pausa criado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pause-reasons"] });
      setModalOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar motivo de pausa.",
        variant: "destructive",
      });
    },
  });

  const updateReasonMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PauseReasonFormData }) => {
      return await apiRequest("PUT", `/api/pause-reasons/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Motivo Atualizado",
        description: "Motivo de pausa atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pause-reasons"] });
      setModalOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar motivo de pausa.",
        variant: "destructive",
      });
    },
  });

  const deleteReasonMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/pause-reasons/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Motivo Removido",
        description: "Motivo de pausa removido com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pause-reasons"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao remover motivo de pausa.",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    setEditingReason(null);
    resetForm();
    setModalOpen(true);
  };

  const handleEdit = (reason: PauseReason) => {
    setEditingReason(reason);
    setFormData({
      name: reason.name,
      description: reason.description || "",
      isActive: reason.isActive,
    });
    setModalOpen(true);
  };

  const handleDelete = (reason: PauseReason) => {
    if (window.confirm(`Deseja realmente remover o motivo "${reason.name}"?`)) {
      deleteReasonMutation.mutate(reason.id);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      isActive: true,
    });
    setEditingReason(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do motivo é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (editingReason) {
      updateReasonMutation.mutate({ id: editingReason.id, data: formData });
    } else {
      createReasonMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Carregando motivos de pausa...
      </div>
    );
  }

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 py-4 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Motivos de Pausa</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gerencie os motivos disponíveis para pausas na produção
            </p>
          </div>
          
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Motivo
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        {reasons.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
            Nenhum motivo de pausa cadastrado
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            {isMobile ? (
              // Mobile view - Cards
              <div className="space-y-4 p-4">
                {reasons.map((reason) => (
                  <div key={reason.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{reason.name}</h3>
                      <Badge variant={reason.isActive ? "default" : "secondary"}>
                        {reason.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    
                    {reason.description && (
                      <p className="text-sm text-gray-600 mb-3">{reason.description}</p>
                    )}
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(reason)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(reason)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Desktop view - Table
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-4 px-6 font-medium text-gray-500">Nome</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-500">Descrição</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-500">Status</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-500">Criado em</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-500">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reasons.map((reason) => (
                      <tr key={reason.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-6 font-medium text-gray-900">
                          {reason.name}
                        </td>
                        <td className="py-4 px-6 text-gray-700">
                          {reason.description || "-"}
                        </td>
                        <td className="py-4 px-6">
                          <Badge variant={reason.isActive ? "default" : "secondary"}>
                            {reason.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-gray-700">
                          {new Date(reason.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(reason)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(reason)}
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
        )}
      </main>

      {/* Modal de Criar/Editar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingReason ? "Editar Motivo" : "Novo Motivo"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Banheiro, Refeição, Troca de matriz..."
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição opcional do motivo..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Motivo ativo</Label>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={createReasonMutation.isPending || updateReasonMutation.isPending}
              >
                <Check className="w-4 h-4 mr-2" />
                {editingReason ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}