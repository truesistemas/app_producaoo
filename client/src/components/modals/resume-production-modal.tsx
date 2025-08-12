import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Package, Clock, CheckCircle, RotateCcw } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Matrix } from "@shared/schema";
import type { ProductionSessionWithDetails, MatrixMaterial } from "@/types";

// Helper function to format cycle time
const formatCycleTime = (seconds: number): string => {
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

interface ResumeProductionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: ProductionSessionWithDetails | null;
}

interface ResumeProductionData {
  matrixId: number;
  selectedMaterialId?: number;
}

export default function ResumeProductionModal({ open, onOpenChange, session }: ResumeProductionModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ResumeProductionData>({
    matrixId: 0,
    selectedMaterialId: undefined,
  });

  // Estado para materiais da matriz selecionada
  const [matrixMaterials, setMatrixMaterials] = useState<MatrixMaterial[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  const { data: matrices = [] } = useQuery<Matrix[]>({
    queryKey: ["/api/matrices"],
  });

  // Inicializar dados quando o modal abrir
  useEffect(() => {
    if (session && open) {
      setFormData({
        matrixId: session.matrix.id,
        selectedMaterialId: session.selectedMaterialId, // Manter material atual selecionado
      });
    }
  }, [session, open]);

  // Buscar materiais quando uma matriz é selecionada
  useEffect(() => {
    const loadMatrixMaterials = async () => {
      if (formData.matrixId > 0) {
        setLoadingMaterials(true);
        try {
          const response = await apiRequest("GET", `/api/matrices/${formData.matrixId}/materials`);
          const materials: MatrixMaterial[] = await response.json();
          setMatrixMaterials(materials);
          
          // Reset material selection quando mudar de matriz
          setFormData(prev => ({ ...prev, selectedMaterialId: undefined }));
        } catch (error) {
          console.error("Erro ao carregar materiais da matriz:", error);
          setMatrixMaterials([]);
          toast({
            title: "Aviso",
            description: "Erro ao carregar materiais da matriz.",
            variant: "destructive",
          });
        } finally {
          setLoadingMaterials(false);
        }
      } else {
        setMatrixMaterials([]);
        setFormData(prev => ({ ...prev, selectedMaterialId: undefined }));
      }
    };

    loadMatrixMaterials();
  }, [formData.matrixId, toast]);

  const resumeProductionMutation = useMutation({
    mutationFn: async (data: ResumeProductionData) => {
      if (!session) throw new Error("Sessão não encontrada");
      return await apiRequest("PUT", `/api/production-sessions/${session.id}/resume`, data);
    },
    onSuccess: () => {
      toast({
        title: "Produção Retomada",
        description: "Sessão de produção retomada com sucesso. O timer está ativo novamente!",
      });
      // Invalidar múltiplas queries para atualização completa
      queryClient.invalidateQueries({ queryKey: ["/api/production-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      if (session) {
        queryClient.invalidateQueries({ queryKey: [`/api/production-sessions/${session.id}/pauses`] });
        queryClient.invalidateQueries({ queryKey: [`/api/production-sessions/${session.id}/metrics`] });
      }
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao retomar produção. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      matrixId: session?.matrix.id || 0,
      selectedMaterialId: session?.selectedMaterialId, // Manter material atual
    });
    setMatrixMaterials([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.matrixId === 0) {
      toast({
        title: "Matriz Obrigatória",
        description: "Por favor, selecione uma matriz para retomar a produção.",
        variant: "destructive",
      });
      return;
    }

    // Validar seleção de material se a matriz tem materiais configurados
    if (matrixMaterials.length > 0 && !formData.selectedMaterialId) {
      toast({
        title: "Material Obrigatório",
        description: "Selecione o material que será utilizado na produção.",
        variant: "destructive",
      });
      return;
    }

    resumeProductionMutation.mutate(formData);
  };

  const selectedMatrix = matrices.find(m => m.id === formData.matrixId);
  const selectedMaterial = matrixMaterials.find(m => m.rawMaterialId === formData.selectedMaterialId);
  const isMatrixChanged = session && formData.matrixId !== session.matrix.id;

  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-green-600" />
            Retomar Produção
          </DialogTitle>
          <DialogDescription>
            Configure a matriz e material para retomar a produção. Você pode manter a configuração atual ou fazer alterações.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações da Sessão Atual */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <Label className="text-base font-semibold text-blue-900">Sessão Atual</Label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Colaborador:</span>
                <div className="text-blue-800">{session.employee.name}</div>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Máquina:</span>
                <div className="text-blue-800">{session.machine.name}</div>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Peças Produzidas:</span>
                <div className="text-blue-800 font-bold">{session.totalPieces}</div>
              </div>
            </div>
          </div>

          {/* Seção de Configuração de Retomada */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <Label className="text-lg font-semibold text-gray-900">Configuração para Retomada</Label>
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
                      <div className="flex items-center gap-2">
                        {matrix.id === session.matrix.id && <Badge variant="outline" className="text-xs">Atual</Badge>}
                        {matrix.code} - {matrix.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedMatrix && (
                <div className={`mt-2 p-3 rounded-lg border ${isMatrixChanged ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
                  <div className={`text-sm ${isMatrixChanged ? 'text-orange-800' : 'text-blue-800'}`}>
                    {isMatrixChanged && (
                      <div className="flex items-center gap-2 mb-2">
                        <RotateCcw className="w-4 h-4" />
                        <span className="font-medium">Matriz será alterada</span>
                      </div>
                    )}
                    <strong>Peça:</strong> {selectedMatrix.pieceName} | 
                    <strong> Peças/Ciclo:</strong> {selectedMatrix.piecesPerCycle} | 
                    <strong> Tempo Padrão:</strong> {formatCycleTime(selectedMatrix.cycleTimeSeconds || 60)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Seção de Materiais */}
          {formData.matrixId > 0 && (
            <div className="border-t pt-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-green-600" />
                <Label className="text-lg font-semibold text-green-900">Material de Produção</Label>
              </div>

              {loadingMaterials ? (
                <div className="text-center py-4 text-gray-500">
                  Carregando materiais...
                </div>
              ) : matrixMaterials.length === 0 ? (
                <div className="text-center py-6 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Package className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-sm text-yellow-700 font-medium">
                    Nenhum material configurado para esta matriz
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Você pode prosseguir com o tempo padrão da matriz
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Selecione o material que será utilizado *
                  </Label>
                  
                  <div className="grid gap-3">
                    {matrixMaterials.map((material) => (
                      <div
                        key={material.rawMaterialId}
                        className={`
                          group cursor-pointer border rounded-lg p-4 transition-all
                          ${formData.selectedMaterialId === material.rawMaterialId
                            ? 'border-green-500 bg-green-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                          }
                        `}
                        onClick={() => setFormData({ ...formData, selectedMaterialId: material.rawMaterialId })}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className={`
                                w-4 h-4 rounded-full border-2 flex items-center justify-center
                                ${formData.selectedMaterialId === material.rawMaterialId
                                  ? 'border-green-500 bg-green-500'
                                  : 'border-gray-300'
                                }
                              `}>
                                {formData.selectedMaterialId === material.rawMaterialId && (
                                  <CheckCircle className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <div>
                                <span className="font-semibold text-gray-900">{material.materialName}</span>
                                {material.materialDescription && (
                                  <p className="text-sm text-gray-600 mt-1">{material.materialDescription}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge 
                              variant="outline" 
                              className={`
                                ${formData.selectedMaterialId === material.rawMaterialId
                                  ? 'border-green-500 text-green-700 bg-green-50'
                                  : 'border-blue-500 text-blue-700 bg-blue-50'
                                }
                              `}
                            >
                              <Clock className="w-3 h-3 mr-1" />
                              {formatCycleTime(material.cycleTimeSeconds)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedMaterial && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Material Selecionado</span>
                      </div>
                      <div className="text-sm text-green-700">
                        <strong>{selectedMaterial.materialName}</strong> com tempo de ciclo de{' '}
                        <strong>{formatCycleTime(selectedMaterial.cycleTimeSeconds)}</strong>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Alertas de Mudanças */}
          {isMatrixChanged && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <RotateCcw className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Mudança de Matriz Detectada</span>
              </div>
              <p className="text-sm text-orange-700">
                A matriz será alterada de <strong>{session.matrix.code}</strong> para <strong>{selectedMatrix?.code}</strong>.
                Esta alteração será registrada no histórico da produção.
              </p>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex space-x-3 pt-6 mt-6 border-t border-gray-200">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              disabled={resumeProductionMutation.isPending}
            >
              {resumeProductionMutation.isPending ? "Retomando..." : "🚀 Retomar Produção"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}