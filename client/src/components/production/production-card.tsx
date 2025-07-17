import { Play, Pause, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import RealTimeDuration from "@/components/ui/real-time-duration";
import type { ProductionSessionWithDetails } from "@/types";

interface ProductionCardProps {
  session: ProductionSessionWithDetails;
  onPause: (session: ProductionSessionWithDetails) => void;
  onResume: (session: ProductionSessionWithDetails) => void;
  onEnd: (session: ProductionSessionWithDetails) => void;
}

export default function ProductionCard({ session, onPause, onResume, onEnd }: ProductionCardProps) {
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
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header - Employee and Status */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{session.employee.name}</h3>
              <p className="text-sm text-gray-500">Registro: {session.employee.registration}</p>
            </div>
            {getStatusBadge(session.status)}
          </div>

          {/* Machine and Matrix Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 font-medium">Máquina</p>
              <p className="text-gray-900">{session.machine.name}</p>
              <p className="text-xs text-gray-500">{session.machine.code}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Matriz</p>
              <p className="text-gray-900">{session.matrix.name}</p>
              <p className="text-xs text-gray-500">{session.matrix.code}</p>
            </div>
          </div>

          {/* Duration */}
          <div>
            <p className="text-gray-500 font-medium text-sm mb-1">Duração</p>
            <RealTimeDuration 
              startTime={session.startTime}
              endTime={session.endTime}
              status={session.status}
            />
          </div>

          {/* Production Progress */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 font-medium">Produzido</p>
              <p className="text-lg font-bold text-gray-900">{session.totalPieces}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Meta</p>
              <p className="text-lg font-bold text-gray-600">{session.targetPieces}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min(100, (session.totalPieces / session.targetPieces) * 100)}%` 
              }}
            />
          </div>
          <p className="text-xs text-gray-500 text-center">
            {Math.round((session.totalPieces / session.targetPieces) * 100)}% concluído
          </p>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            {session.status === "running" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onPause(session)}
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pausar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onEnd(session)}
                >
                  <Square className="w-4 h-4 mr-2" />
                  Finalizar
                </Button>
              </>
            )}
            {session.status === "paused" && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => onResume(session)}
              >
                <Play className="w-4 h-4 mr-2" />
                Retomar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}