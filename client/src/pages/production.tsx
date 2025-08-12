import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Play, Pause, Square, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import ProductionModal from "@/components/modals/production-modal";
import ResumeProductionModal from "@/components/modals/resume-production-modal";
import ProductionCard from "@/components/production/production-card";
import SessionDetailsModal from "@/components/production/session-details-modal";
import RealTimeDuration from "@/components/ui/real-time-duration";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ProductionSessionWithDetails, PauseReason } from "@/types";

export default function Production() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [productionModalOpen, setProductionModalOpen] = useState(false);
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [endModalOpen, setEndModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ProductionSessionWithDetails | null>(null);
  const [pauseReason, setPauseReason] = useState("");
  const [selectedPauseReasonId, setSelectedPauseReasonId] = useState<number | null>(null);
  const [finalPieces, setFinalPieces] = useState(0);

  const { data: sessions = [], isLoading } = useQuery<ProductionSessionWithDetails[]>({
    queryKey: ["/api/production-sessions"],
    refetchInterval: 5000, // Atualizar mais frequentemente para contexto em tempo real
  });

  const { data: pauseReasons = [] } = useQuery<PauseReason[]>({
    queryKey: ["/api/pause-reasons"],
  });

  const pauseSessionMutation = useMutation({
    mutationFn: async ({ id, pauseReasonId, reason }: { id: number; pauseReasonId?: number; reason?: string }) => {
      return await apiRequest("PUT", `/api/production-sessions/${id}/pause`, { pauseReasonId, reason });
    },
    onSuccess: () => {
      toast({
        title: "Produção Pausada",
        description: "A sessão foi pausada com sucesso.",
      });
      // Invalidar múltiplas queries para atualização completa
      queryClient.invalidateQueries({ queryKey: ["/api/production-sessions"] });
      if (selectedSession) {
        queryClient.invalidateQueries({ queryKey: [`/api/production-sessions/${selectedSession.id}/pauses`] });
        queryClient.invalidateQueries({ queryKey: [`/api/production-sessions/${selectedSession.id}/metrics`] });
      }
      setPauseModalOpen(false);
      setPauseReason("");
      setSelectedPauseReasonId(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao pausar produção.",
        variant: "destructive",
      });
    },
  });



  const endSessionMutation = useMutation({
    mutationFn: async ({ id, totalPieces }: { id: number; totalPieces: number }) => {
      return await apiRequest("PUT", `/api/production-sessions/${id}/end`, { totalPieces });
    },
    onSuccess: () => {
      toast({
        title: "Produção Finalizada",
        description: "A sessão foi finalizada com sucesso.",
      });
      // Invalidar múltiplas queries para atualização completa
      queryClient.invalidateQueries({ queryKey: ["/api/production-sessions"] });
      if (selectedSession) {
        queryClient.invalidateQueries({ queryKey: [`/api/production-sessions/${selectedSession.id}/pauses`] });
        queryClient.invalidateQueries({ queryKey: [`/api/production-sessions/${selectedSession.id}/metrics`] });
      }
      setEndModalOpen(false);
      setFinalPieces(0);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao finalizar produção.",
        variant: "destructive",
      });
    },
  });

  const handlePause = (session: ProductionSessionWithDetails) => {
    setSelectedSession(session);
    setPauseModalOpen(true);
  };

  const handleResume = (session: ProductionSessionWithDetails) => {
    setSelectedSession(session);
    setResumeModalOpen(true);
  };

  const handleEnd = (session: ProductionSessionWithDetails) => {
    setSelectedSession(session);
    setFinalPieces(session.totalPieces);
    setEndModalOpen(true);
  };

  const handleShowDetails = (session: ProductionSessionWithDetails) => {
    setSelectedSession(session);
    setDetailsModalOpen(true);
  };

  // Atualizar selectedSession quando os dados mudarem para manter contexto atualizado
  useEffect(() => {
    if (selectedSession && sessions.length > 0) {
      const updatedSession = sessions.find(s => s.id === selectedSession.id);
      if (updatedSession) {
        setSelectedSession(updatedSession);
      }
    }
  }, [sessions, selectedSession]);

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



  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 py-4 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Controle de Produção</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gerencie as sessões de produção em tempo real
            </p>
          </div>
          
          <Button onClick={() => setProductionModalOpen(true)}>
            <Play className="w-4 h-4 mr-2" />
            Iniciar Produção
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-20 lg:pb-8">
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
            Carregando...
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
            <Play className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Nenhuma sessão de produção encontrada</p>
            <p className="text-sm">Clique em "Iniciar Produção" para começar</p>
          </div>
        ) : isMobile ? (
          <div className="space-y-4">
            {sessions.map((session) => (
              <ProductionCard
                key={session.id}
                session={session}
                onPause={handlePause}
                onResume={handleResume}
                onEnd={handleEnd}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Colaborador</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Máquina</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Matriz</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Material</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Status</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Duração</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Produzido</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6 font-medium text-gray-900">
                        {session.employee.name}
                      </td>
                      <td className="py-4 px-6 text-gray-700">
                        {session.machine.name}
                      </td>
                      <td className="py-4 px-6 text-gray-700">
                        <div>
                          <div className="font-medium">{session.matrix.name}</div>
                          <div className="text-sm text-gray-500">{session.matrix.code}</div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-700">
                        {session.material ? (
                          <div>
                            <div className="font-medium">{session.material.name}</div>
                            {session.material.description && (
                              <div className="text-sm text-gray-500">{session.material.description}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Não selecionado</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(session.status)}
                      </td>
                      <td className="py-4 px-6 text-gray-700">
                        <RealTimeDuration 
                          startTime={session.startTime}
                          endTime={session.endTime}
                          status={session.status}
                        />
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-900">
                        {session.totalPieces}
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShowDetails(session)}
                            title="Ver detalhes"
                          >
                            <Info className="w-4 h-4" />
                          </Button>
                          {session.status === "running" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePause(session)}
                                title="Pausar produção"
                              >
                                <Pause className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEnd(session)}
                                title="Finalizar produção"
                              >
                                <Square className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {session.status === "paused" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResume(session)}
                              title="Retomar produção"
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <ProductionModal 
        open={productionModalOpen}
        onOpenChange={setProductionModalOpen}
      />

      <ResumeProductionModal
        open={resumeModalOpen}
        onOpenChange={setResumeModalOpen}
        session={selectedSession}
      />

      {/* Pause Modal */}
      <Dialog open={pauseModalOpen} onOpenChange={setPauseModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pausar Produção</DialogTitle>
          </DialogHeader>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedSession) {
                if (!selectedPauseReasonId) {
                  toast({
                    title: "Erro",
                    description: "Selecione um motivo para a pausa.",
                    variant: "destructive",
                  });
                  return;
                }
                pauseSessionMutation.mutate({ 
                  id: selectedSession.id, 
                  pauseReasonId: selectedPauseReasonId,
                  reason: pauseReason.trim() || undefined 
                });
              }
            }}
            className="space-y-4"
          >
            <div>
              <Label>Motivo da Pausa *</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                {pauseReasons.map((reason) => (
                  <div
                    key={reason.id}
                    onClick={() => setSelectedPauseReasonId(reason.id)}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedPauseReasonId === reason.id
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{reason.name}</div>
                    {reason.description && (
                      <div className="text-xs text-gray-500 mt-1">{reason.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Observações (opcional)</Label>
              <Textarea
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                placeholder="Informações adicionais sobre a pausa..."
                rows={2}
              />
            </div>
            
            <div className="flex space-x-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setPauseModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={pauseSessionMutation.isPending}>
                {pauseSessionMutation.isPending ? "Pausando..." : "Pausar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* End Modal */}
      <Dialog open={endModalOpen} onOpenChange={setEndModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Produção</DialogTitle>
          </DialogHeader>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedSession) {
                endSessionMutation.mutate({ id: selectedSession.id, totalPieces: finalPieces });
              }
            }}
            className="space-y-4"
          >
            <div>
              <Label>Total de Peças Produzidas *</Label>
              <Input
                type="number"
                value={finalPieces}
                onChange={(e) => setFinalPieces(parseInt(e.target.value))}
                min="0"
                required
              />
            </div>
            
            <div className="flex space-x-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setEndModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={endSessionMutation.isPending}>
                {endSessionMutation.isPending ? "Finalizando..." : "Finalizar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <SessionDetailsModal
        session={selectedSession}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
      />
    </>
  );
}
