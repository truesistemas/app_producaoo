import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Play, Pause, Square } from "lucide-react";
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
import ProductionCard from "@/components/production/production-card";
import RealTimeDuration from "@/components/ui/real-time-duration";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ProductionSessionWithDetails } from "@/types";

export default function Production() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [productionModalOpen, setProductionModalOpen] = useState(false);
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [endModalOpen, setEndModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ProductionSessionWithDetails | null>(null);
  const [pauseReason, setPauseReason] = useState("");
  const [finalPieces, setFinalPieces] = useState(0);

  const { data: sessions = [], isLoading } = useQuery<ProductionSessionWithDetails[]>({
    queryKey: ["/api/production-sessions"],
    refetchInterval: 30000,
  });

  const pauseSessionMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      return await apiRequest("PUT", `/api/production-sessions/${id}/pause`, { reason });
    },
    onSuccess: () => {
      toast({
        title: "Produção Pausada",
        description: "A sessão foi pausada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/production-sessions"] });
      setPauseModalOpen(false);
      setPauseReason("");
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao pausar produção.",
        variant: "destructive",
      });
    },
  });

  const resumeSessionMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("PUT", `/api/production-sessions/${id}/resume`);
    },
    onSuccess: () => {
      toast({
        title: "Produção Retomada",
        description: "A sessão foi retomada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/production-sessions"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao retomar produção.",
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
      queryClient.invalidateQueries({ queryKey: ["/api/production-sessions"] });
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
    resumeSessionMutation.mutate(session.id);
  };

  const handleEnd = (session: ProductionSessionWithDetails) => {
    setSelectedSession(session);
    setFinalPieces(session.totalPieces);
    setEndModalOpen(true);
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
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Status</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Duração</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Produzido</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-500">Meta</th>
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
                        {session.matrix.code}
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
                      <td className="py-4 px-6 text-gray-500">
                        {session.targetPieces}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
                          {session.status === "running" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePause(session)}
                              >
                                <Pause className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEnd(session)}
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
                pauseSessionMutation.mutate({ id: selectedSession.id, reason: pauseReason });
              }
            }}
            className="space-y-4"
          >
            <div>
              <Label>Motivo da Pausa *</Label>
              <Textarea
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                placeholder="Ex: Manutenção, troca de matriz, descanso..."
                required
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
    </>
  );
}
