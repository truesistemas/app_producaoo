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
  targetPieces: number;
  efficiency: number;
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
  };
}

export interface ProductionModalData {
  employeeId: number;
  machineId: number;
  matrixId: number;
  targetPieces: number;
}
