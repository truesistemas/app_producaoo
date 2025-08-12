import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Users, Settings, Activity, BarChart3, Timer, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { queryClient } from "@/lib/queryClient";
import type { ProductionSessionWithDetails, SessionPause, SessionMetrics } from "@/types";

interface SessionDetailsModalProps {
  session: ProductionSessionWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('pt-BR');
}

export default function SessionDetailsModal({ session, open, onOpenChange }: SessionDetailsModalProps) {
  // Buscar pausas da sessão
  const { data: pauses = [] } = useQuery<SessionPause[]>({
    queryKey: [`/api/production-sessions/${session?.id}/pauses`],
    enabled: open && !!session?.id,
    refetchInterval: open ? 5000 : false, // Atualizar mais frequentemente quando aberto
  });

  // Buscar métricas da sessão
  const { data: metrics } = useQuery<SessionMetrics>({
    queryKey: [`/api/production-sessions/${session?.id}/metrics`],
    enabled: open && !!session?.id,
    refetchInterval: open ? 5000 : false, // Atualizar mais frequentemente quando aberto
  });

  if (!session) return null;

  // Calcular peças esperadas e eficiência
  const cycleTime = session.matrixMaterial?.cycleTimeSeconds || session.matrix.cycleTimeSeconds;
  const piecesPerCycle = session.matrix.piecesPerCycle;
  const expectedPiecesPerHour = cycleTime ? Math.round((3600 / cycleTime) * piecesPerCycle * 10) / 10 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Detalhes da Sessão de Produção #{session.id}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Informações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={
                      session.status === 'running' ? 'default' : 
                      session.status === 'paused' ? 'secondary' : 'outline'
                    }>
                      {session.status === 'running' ? 'Em Execução' : 
                       session.status === 'paused' ? 'Pausado' : 'Finalizado'}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground">Funcionário</Label>
                  <p className="font-medium">{session.employee.name}</p>
                  <p className="text-sm text-muted-foreground">Reg: {session.employee.registration}</p>
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground">Máquina</Label>
                  <p className="font-medium">{session.machine.name}</p>
                  <p className="text-sm text-muted-foreground">{session.machine.code}</p>
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground">Matriz</Label>
                  <p className="font-medium">{session.matrix.name}</p>
                  <p className="text-sm text-muted-foreground">{session.matrix.code}</p>
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground">Material</Label>
                  <p className="font-medium">{session.material?.name || 'Não selecionado'}</p>
                  {session.material?.description && (
                    <p className="text-sm text-muted-foreground">{session.material.description}</p>
                  )}
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground">Início</Label>
                  <p className="font-medium">{formatDateTime(session.startTime)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Métricas de Performance */}
          {metrics && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Métricas de Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Timer className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                    <p className="text-2xl font-bold text-blue-700">{formatDuration(metrics.totalSessionTime)}</p>
                    <p className="text-sm text-muted-foreground">Tempo Total</p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Activity className="h-8 w-8 mx-auto text-green-600 mb-2" />
                    <p className="text-2xl font-bold text-green-700">{formatDuration(metrics.effectiveWorkTime)}</p>
                    <p className="text-sm text-muted-foreground">Tempo Efetivo</p>
                  </div>
                  
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <AlertCircle className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                    <p className="text-2xl font-bold text-orange-700">{formatDuration(metrics.totalPauseTime)}</p>
                    <p className="text-sm text-muted-foreground">Tempo de Pausa</p>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <BarChart3 className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                    <p className="text-2xl font-bold text-purple-700">{metrics.actualEfficiency}%</p>
                    <p className="text-sm text-muted-foreground">Eficiência</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Peças Produzidas</Label>
                    <p className="text-xl font-bold">{metrics.actualPieces}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-muted-foreground">Peças Esperadas</Label>
                    <p className="text-xl font-bold">{metrics.expectedPieces}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-muted-foreground">Capacidade/Hora</Label>
                    <p className="text-xl font-bold">{metrics.expectedPiecesPerHour}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground">Eficiência de Produção</Label>
                  <Progress value={Math.min(metrics.actualEfficiency, 100)} className="mt-2" />
                  <p className="text-sm text-muted-foreground mt-1">
                    {metrics.actualPieces} / {metrics.expectedPieces} peças ({metrics.actualEfficiency}%)
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground">Downtime</Label>
                  <Progress value={metrics.downtimePercentage} className="mt-2" />
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDuration(metrics.totalPauseTime)} parado ({metrics.downtimePercentage}% do tempo)
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Histórico de Pausas */}
          {pauses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Histórico de Pausas ({pauses.length})
                </CardTitle>
                <CardDescription>
                  Detalhes de todas as pausas durante esta sessão de produção
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pauses.map((pause) => (
                    <div key={pause.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {pause.pauseReason?.name || "Motivo não informado"}
                            </Badge>
                          </div>
                          {pause.reason && (
                            <p className="text-sm text-gray-600 mb-2">
                              Observações: {pause.reason}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            Início: {formatDateTime(pause.startTime)}
                          </p>
                          {pause.endTime && (
                            <p className="text-sm text-muted-foreground">
                              Fim: {formatDateTime(pause.endTime)}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {pause.duration ? (
                            <Badge variant="outline">{formatDuration(pause.duration)}</Badge>
                          ) : (
                            <Badge variant="secondary">Em andamento</Badge>
                          )}
                        </div>
                      </div>
                      
                      {(pause.newMatrix || pause.newMaterial) && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-sm text-muted-foreground">Mudanças na retomada:</p>
                          {pause.newMatrix && (
                            <p className="text-sm">• Nova matriz: {pause.newMatrix.name}</p>
                          )}
                          {pause.newMaterial && (
                            <p className="text-sm">• Novo material: {pause.newMaterial.name}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}