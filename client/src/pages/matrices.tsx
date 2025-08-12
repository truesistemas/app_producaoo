import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Package, X } from "lucide-react";
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
import type { Matrix, InsertMatrix, RawMaterial, MatrixMaterial, InsertMatrixMaterial } from "@shared/schema";

interface MatrixMaterialForm {
  rawMaterialId: number;
  materialName: string;
  cycleTimeSeconds: number;
}

// Helper function to format cycle time in a readable way
const formatCycleTime = (seconds: number | null | undefined): string => {
  if (!seconds) return "60s"; // Default value
  
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}min ${remainingSeconds}s` : `${minutes}min`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  }
};

export default function Matrices() {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMatrix, setEditingMatrix] = useState<Matrix | null>(null);
  const [formData, setFormData] = useState<InsertMatrix>({
    name: "",
    code: "",
    pieceName: "",
    piecesPerCycle: 1,
    cycleTimeSeconds: 60,
    isActive: true,
  });
  
  // Estados para gestão de materiais da matriz
  const [matrixMaterials, setMatrixMaterials] = useState<MatrixMaterialForm[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [materialCycleTime, setMaterialCycleTime] = useState<string>("60");

  const { data: matrices = [], isLoading } = useQuery<Matrix[]>({
    queryKey: ["/api/matrices"],
  });

  const { data: rawMaterials = [] } = useQuery<RawMaterial[]>({
    queryKey: ["/api/raw-materials"],
  });

  const createMatrixMutation = useMutation({
    mutationFn: async (data: InsertMatrix): Promise<Matrix> => {
      const response = await apiRequest("POST", "/api/matrices", data);
      return await response.json();
    },
    onSuccess: async (matrix: Matrix) => {
      // Salvar os materiais da matriz
      try {
        for (const material of matrixMaterials) {
          await apiRequest("POST", "/api/matrix-materials", {
            matrixId: matrix.id,
            rawMaterialId: material.rawMaterialId,
            cycleTimeSeconds: material.cycleTimeSeconds,
          });
        }
        
      toast({
        title: "Sucesso",
        description: "Matriz criada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/matrices"] });
      setModalOpen(false);
      resetForm();
      } catch (error) {
        toast({
          title: "Aviso",
          description: "Matriz criada, mas houve erro ao salvar alguns materiais.",
          variant: "destructive",
        });
      }
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
      const response = await apiRequest("PUT", `/api/matrices/${id}`, data);
      return await response.json();
    },
    onSuccess: async (matrix: Matrix) => {
      // Atualizar os materiais da matriz
      try {
        // 1. Primeiro, buscar os materiais existentes para remover
        const existingResponse = await apiRequest("GET", `/api/matrices/${matrix.id}/materials`);
        const existingMaterials: any[] = await existingResponse.json();
        
        // 2. Remover todos os materiais existentes
        for (const existingMaterial of existingMaterials) {
          await apiRequest("DELETE", `/api/matrix-materials/${existingMaterial.id}`);
        }
        
        // 3. Adicionar os novos materiais
        for (const material of matrixMaterials) {
          await apiRequest("POST", "/api/matrix-materials", {
            matrixId: matrix.id,
            rawMaterialId: material.rawMaterialId,
            cycleTimeSeconds: material.cycleTimeSeconds,
          });
        }
        
        toast({
          title: "Sucesso",
          description: "Matriz atualizada com sucesso.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/matrices"] });
        setModalOpen(false);
        resetForm();
      } catch (error) {
        toast({
          title: "Aviso",
          description: "Matriz atualizada, mas houve erro ao salvar alguns materiais.",
          variant: "destructive",
        });
      }
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
      cycleTimeSeconds: 60,
      isActive: true,
    });
    setMatrixMaterials([]);
    setSelectedMaterialId("");
    setMaterialCycleTime("60");
    setEditingMatrix(null);
  };

  const addMaterial = () => {
    if (!selectedMaterialId || !materialCycleTime) {
      toast({
        title: "Erro",
        description: "Selecione um material e informe o tempo do ciclo.",
        variant: "destructive",
      });
      return;
    }

    const materialId = parseInt(selectedMaterialId);
    const material = rawMaterials.find(m => m.id === materialId);
    if (!material) return;

    // Verificar se o material já foi adicionado
    if (matrixMaterials.find(m => m.rawMaterialId === materialId)) {
      toast({
        title: "Erro",
        description: "Este material já foi adicionado à matriz.",
        variant: "destructive",
      });
      return;
    }

    const newMaterial: MatrixMaterialForm = {
      rawMaterialId: materialId,
      materialName: material.name,
      cycleTimeSeconds: parseInt(materialCycleTime),
    };

    setMatrixMaterials([...matrixMaterials, newMaterial]);
    setSelectedMaterialId("");
    setMaterialCycleTime("60");
  };

  const removeMaterial = (materialId: number) => {
    setMatrixMaterials(matrixMaterials.filter(m => m.rawMaterialId !== materialId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingMatrix) {
      updateMatrixMutation.mutate({ id: editingMatrix.id, data: formData });
    } else {
      createMatrixMutation.mutate(formData);
    }
  };

  const handleEdit = async (matrix: Matrix) => {
    setEditingMatrix(matrix);
    setFormData({
      name: matrix.name,
      code: matrix.code,
      pieceName: matrix.pieceName,
      piecesPerCycle: matrix.piecesPerCycle || 1,
      cycleTimeSeconds: matrix.cycleTimeSeconds || 60,
      isActive: matrix.isActive,
    });
    
    // Carregar materiais da matriz
    try {
      const response = await apiRequest("GET", `/api/matrices/${matrix.id}/materials`);
      const materials: any[] = await response.json();
      setMatrixMaterials(materials.map((m: any) => ({
        rawMaterialId: m.rawMaterialId,
        materialName: m.materialName,
        cycleTimeSeconds: m.cycleTimeSeconds,
      })));
    } catch (error) {
      console.error("Erro ao carregar materiais da matriz:", error);
      setMatrixMaterials([]);
    }
    
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
            <DialogContent className="max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>
                  {editingMatrix ? "Editar Matriz" : "Nova Matriz"}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-2">
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
                
                <div>
                  <Label>Tempo do Ciclo Padrão (segundos)</Label>
                  <Input
                    type="number"
                    value={formData.cycleTimeSeconds || ''}
                    onChange={(e) => setFormData({ ...formData, cycleTimeSeconds: parseInt(e.target.value) || 60 })}
                    min="1"
                    placeholder="Tempo padrão em segundos por ciclo"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Este será o tempo padrão. Você pode definir tempos específicos por material abaixo.
                  </p>
                </div>

                {/* Seção de Materiais */}
                <div className="border-t pt-6 space-y-6">
                  <div className="text-center">
                    <Label className="text-lg font-semibold text-gray-900">🧪 Materiais da Matriz</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Configure os materiais que podem ser utilizados nesta matriz com seus tempos específicos
                    </p>
                  </div>

                  {/* Card de Adicionar Material */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Plus className="w-5 h-5 text-blue-600" />
                      <Label className="text-base font-medium text-blue-900">Adicionar Novo Material</Label>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Material</Label>
                        <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Selecione um material" />
                          </SelectTrigger>
                          <SelectContent>
                            {rawMaterials.filter(m => !matrixMaterials.find(mm => mm.rawMaterialId === m.id)).map((material) => (
                              <SelectItem key={material.id} value={material.id.toString()}>
                                {material.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Tempo do Ciclo (seg?)</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            type="number"
                            value={materialCycleTime}
                            onChange={(e) => setMaterialCycleTime(e.target.value)}
                            min="1"
                            placeholder="60"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            onClick={addMaterial}
                            disabled={!selectedMaterialId || !materialCycleTime}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Materiais Configurados */}
                  {matrixMaterials.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-green-600" />
                        <Label className="text-base font-medium text-green-900">
                          Materiais Configurados ({matrixMaterials.length})
                        </Label>
                      </div>
                      
                      <div className="grid gap-3">
                        {matrixMaterials.map((material) => (
                          <div key={material.rawMaterialId} className="group relative bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                  <span className="font-semibold text-gray-900">{material.materialName}</span>
                                </div>
                                <div className="mt-1 ml-6">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    ⏱️ {formatCycleTime(material.cycleTimeSeconds)}
                                  </span>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMaterial(material.rawMaterialId)}
                                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50 transition-opacity"
                                title="Remover material"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">
                        Nenhum material configurado ainda
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Adicione materiais acima para configurar tempos específicos
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="sticky bottom-0 bg-white pt-4 border-t flex space-x-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
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
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Tempo do Ciclo</th>
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
                      <td className="py-4 px-6 text-gray-700 font-medium">{formatCycleTime(matrix.cycleTimeSeconds)}</td>
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
