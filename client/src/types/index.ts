export interface DashboardStats {
  activeMachines: number;
  activeEmployees: number;
  todayProduction: number;
  runningSessions: number;
  overallEfficiency: number;
}

export interface ProductionSessionWithDetails {
  id: number;
  startTime: string;
  endTime?: string;
  status: string;
  totalPieces: number;
  selectedMaterialId?: number;
  efficiency: number;
  notes?: string;
  employee: {
    id: number;
    name: string;
    registration: string;
  };
  machine: {
    id: number;
    name: string;
    code: string;
  };
  matrix: {
    id: number;
    name: string;
    code: string;
    piecesPerCycle: number;
    cycleTimeSeconds: number;
  };
  material?: {
    id: number;
    name: string;
    description?: string;
  };
  matrixMaterial?: {
    id: number;
    cycleTimeSeconds: number;
  };
}

export interface ProductionModalData {
  employeeId: number;
  machineId: number;
  matrixId: number;
  selectedMaterialId?: number; // Novo campo para o material selecionado
}

export interface MatrixMaterial {
  id: number;
  rawMaterialId: number;
  materialName: string;
  materialDescription?: string;
  cycleTimeSeconds: number;
}

export interface ResumeProductionData {
  matrixId: number;
  selectedMaterialId?: number;
}

export interface SessionPause {
  id: number;
  startTime: string;
  endTime?: string;
  reason?: string;
  duration?: number;
  pauseReasonId?: number;
  pauseReason?: {
    id: number;
    name: string;
    description?: string;
  };
  newMatrixId?: number;
  newMaterialId?: number;
  newMatrix?: {
    id: number;
    name: string;
  };
  newMaterial?: {
    id: number;
    name: string;
  };
}

export interface SessionMetrics {
  sessionId: number;
  totalSessionTime: number; // em minutos
  totalPauseTime: number; // em minutos
  effectiveWorkTime: number; // em minutos
  pauseCount: number;
  cycleTime: number; // em segundos
  piecesPerCycle: number;
  expectedPiecesPerHour: number;
  expectedPieces: number;
  actualPieces: number;
  actualEfficiency: number; // em percentual
  downtimePercentage: number; // em percentual
}

export interface PauseReason {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface PauseReasonFormData {
  name: string;
  description?: string;
  isActive?: boolean;
}
