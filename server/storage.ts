import { 
  users, employees, machines, matrices, productionSessions, productionPauses, employeeMachines,
  rawMaterials, matrixMaterials, pauseReasons,
  type User, type InsertUser, type Employee, type InsertEmployee, 
  type Machine, type InsertMachine, type Matrix, type InsertMatrix,
  type ProductionSession, type InsertProductionSession,
  type ProductionPause, type InsertProductionPause,
  type EmployeeMachine, type InsertEmployeeMachine,
  type RawMaterial, type InsertRawMaterial,
  type MatrixMaterial, type InsertMatrixMaterial,
  type PauseReason, type InsertPauseReason
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUsersByStatus(status: string): Promise<User[]>;
  deleteUser(id: number): Promise<boolean>;

  // Employees
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;

  // Machines
  getMachines(): Promise<Machine[]>;
  getMachine(id: number): Promise<Machine | undefined>;
  createMachine(machine: InsertMachine): Promise<Machine>;
  updateMachine(id: number, machine: Partial<InsertMachine>): Promise<Machine | undefined>;
  deleteMachine(id: number): Promise<boolean>;

  // Matrices
  getMatrices(): Promise<Matrix[]>;
  getMatrix(id: number): Promise<Matrix | undefined>;
  createMatrix(matrix: InsertMatrix): Promise<Matrix>;
  updateMatrix(id: number, matrix: Partial<InsertMatrix>): Promise<Matrix | undefined>;
  deleteMatrix(id: number): Promise<boolean>;

  // Raw Materials
  getRawMaterials(): Promise<RawMaterial[]>;
  getRawMaterial(id: number): Promise<RawMaterial | undefined>;
  createRawMaterial(material: InsertRawMaterial): Promise<RawMaterial>;
  updateRawMaterial(id: number, material: Partial<InsertRawMaterial>): Promise<RawMaterial | undefined>;
  deleteRawMaterial(id: number): Promise<boolean>;

  // Matrix Materials
  getMatrixMaterials(matrixId: number): Promise<any[]>;
  createMatrixMaterial(matrixMaterial: InsertMatrixMaterial): Promise<MatrixMaterial>;
  updateMatrixMaterial(id: number, matrixMaterial: Partial<InsertMatrixMaterial>): Promise<MatrixMaterial | undefined>;
  deleteMatrixMaterial(id: number): Promise<boolean>;

  // Production Sessions
  getProductionSessions(): Promise<any[]>;
  getActiveProductionSessions(): Promise<any[]>;
  getProductionSession(id: number): Promise<any | undefined>;
  createProductionSession(session: InsertProductionSession): Promise<ProductionSession>;
  updateProductionSession(id: number, session: Partial<InsertProductionSession>): Promise<ProductionSession | undefined>;
  endProductionSession(id: number, totalPieces: number): Promise<ProductionSession | undefined>;

  // Production Pauses
  createProductionPause(pause: InsertProductionPause): Promise<ProductionPause>;
  endProductionPause(id: number): Promise<ProductionPause | undefined>;
  getActivePauseBySessionId(sessionId: number): Promise<ProductionPause | undefined>;
  updateProductionPause(id: number, data: Partial<ProductionPause>): Promise<ProductionPause | undefined>;
  getSessionPauses(sessionId: number): Promise<any[]>;
  getSessionMetrics(sessionId: number): Promise<any>;

  // Employee Machines
  getEmployeeMachines(): Promise<any[]>;
  createEmployeeMachine(assignment: InsertEmployeeMachine): Promise<EmployeeMachine>;

  // Pause Reasons
  getPauseReasons(): Promise<PauseReason[]>;
  getPauseReason(id: number): Promise<PauseReason | undefined>;
  createPauseReason(reason: InsertPauseReason): Promise<PauseReason>;
  updatePauseReason(id: number, reason: Partial<InsertPauseReason>): Promise<PauseReason | undefined>;
  deletePauseReason(id: number): Promise<boolean>;

  // Dashboard data
  getDashboardStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUsersByStatus(status: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.status, status))
      .orderBy(desc(users.createdAt));
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getEmployees(): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.isActive, true)).orderBy(employees.name);
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db.insert(employees).values(employee).returning();
    return newEmployee;
  }

  async updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [updated] = await db.update(employees).set(employee).where(eq(employees.id, id)).returning();
    return updated || undefined;
  }

  async deleteEmployee(id: number): Promise<boolean> {
    const result = await db.update(employees).set({ isActive: false }).where(eq(employees.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getMachines(): Promise<Machine[]> {
    return await db.select().from(machines).where(eq(machines.isAvailable, true)).orderBy(machines.name);
  }

  async getMachine(id: number): Promise<Machine | undefined> {
    const [machine] = await db.select().from(machines).where(eq(machines.id, id));
    return machine || undefined;
  }

  async createMachine(machine: InsertMachine): Promise<Machine> {
    const [newMachine] = await db.insert(machines).values(machine).returning();
    return newMachine;
  }

  async updateMachine(id: number, machine: Partial<InsertMachine>): Promise<Machine | undefined> {
    const [updated] = await db.update(machines).set(machine).where(eq(machines.id, id)).returning();
    return updated || undefined;
  }

  async deleteMachine(id: number): Promise<boolean> {
    const result = await db.update(machines).set({ isAvailable: false }).where(eq(machines.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getMatrices(): Promise<Matrix[]> {
    return await db.select().from(matrices).where(eq(matrices.isActive, true)).orderBy(matrices.name);
  }

  async getMatrix(id: number): Promise<Matrix | undefined> {
    const [matrix] = await db.select().from(matrices).where(eq(matrices.id, id));
    return matrix || undefined;
  }

  async createMatrix(matrix: InsertMatrix): Promise<Matrix> {
    const [newMatrix] = await db.insert(matrices).values(matrix).returning();
    return newMatrix;
  }

  async updateMatrix(id: number, matrix: Partial<InsertMatrix>): Promise<Matrix | undefined> {
    const [updated] = await db.update(matrices).set(matrix).where(eq(matrices.id, id)).returning();
    return updated || undefined;
  }

  async deleteMatrix(id: number): Promise<boolean> {
    const result = await db.update(matrices).set({ isActive: false }).where(eq(matrices.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getProductionSessions(): Promise<any[]> {
    return await db
      .select({
        id: productionSessions.id,
        startTime: productionSessions.startTime,
        endTime: productionSessions.endTime,
        status: productionSessions.status,
        totalPieces: productionSessions.totalPieces,
        selectedMaterialId: productionSessions.selectedMaterialId,
        efficiency: productionSessions.efficiency,
        notes: productionSessions.notes,
        employee: {
          id: employees.id,
          name: employees.name,
          registration: employees.registration,
        },
        machine: {
          id: machines.id,
          name: machines.name,
          code: machines.code,
        },
        matrix: {
          id: matrices.id,
          name: matrices.name,
          code: matrices.code,
          piecesPerCycle: matrices.piecesPerCycle,
          cycleTimeSeconds: matrices.cycleTimeSeconds,
        },
        material: {
          id: rawMaterials.id,
          name: rawMaterials.name,
          description: rawMaterials.description,
        },
        matrixMaterial: {
          id: matrixMaterials.id,
          cycleTimeSeconds: matrixMaterials.cycleTimeSeconds,
        },
      })
      .from(productionSessions)
      .leftJoin(employees, eq(productionSessions.employeeId, employees.id))
      .leftJoin(machines, eq(productionSessions.machineId, machines.id))
      .leftJoin(matrices, eq(productionSessions.matrixId, matrices.id))
      .leftJoin(rawMaterials, eq(productionSessions.selectedMaterialId, rawMaterials.id))
      .leftJoin(matrixMaterials, and(
        eq(matrixMaterials.matrixId, matrices.id),
        eq(matrixMaterials.rawMaterialId, rawMaterials.id)
      ))
      .orderBy(desc(productionSessions.createdAt));
  }

  async getActiveProductionSessions(): Promise<any[]> {
    return await db
      .select({
        id: productionSessions.id,
        startTime: productionSessions.startTime,
        status: productionSessions.status,
        totalPieces: productionSessions.totalPieces,
        selectedMaterialId: productionSessions.selectedMaterialId,
        efficiency: productionSessions.efficiency,
        employee: {
          id: employees.id,
          name: employees.name,
          registration: employees.registration,
        },
        machine: {
          id: machines.id,
          name: machines.name,
          code: machines.code,
        },
        matrix: {
          id: matrices.id,
          name: matrices.name,
          code: matrices.code,
          piecesPerCycle: matrices.piecesPerCycle,
          cycleTimeSeconds: matrices.cycleTimeSeconds,
        },
        material: {
          id: rawMaterials.id,
          name: rawMaterials.name,
          description: rawMaterials.description,
        },
        matrixMaterial: {
          id: matrixMaterials.id,
          cycleTimeSeconds: matrixMaterials.cycleTimeSeconds,
        },
      })
      .from(productionSessions)
      .leftJoin(employees, eq(productionSessions.employeeId, employees.id))
      .leftJoin(machines, eq(productionSessions.machineId, machines.id))
      .leftJoin(matrices, eq(productionSessions.matrixId, matrices.id))
      .leftJoin(rawMaterials, eq(productionSessions.selectedMaterialId, rawMaterials.id))
      .leftJoin(matrixMaterials, and(
        eq(matrixMaterials.matrixId, matrices.id),
        eq(matrixMaterials.rawMaterialId, rawMaterials.id)
      ))
      .where(and(
        eq(productionSessions.status, "running"),
        sql`${productionSessions.endTime} IS NULL`
      ))
      .orderBy(productionSessions.startTime);
  }

  async getProductionSession(id: number): Promise<any | undefined> {
    const [session] = await db
      .select({
        id: productionSessions.id,
        startTime: productionSessions.startTime,
        endTime: productionSessions.endTime,
        status: productionSessions.status,
        totalPieces: productionSessions.totalPieces,
        selectedMaterialId: productionSessions.selectedMaterialId,
        efficiency: productionSessions.efficiency,
        notes: productionSessions.notes,
        employee: {
          id: employees.id,
          name: employees.name,
          registration: employees.registration,
        },
        machine: {
          id: machines.id,
          name: machines.name,
          code: machines.code,
        },
        matrix: {
          id: matrices.id,
          name: matrices.name,
          code: matrices.code,
        },
      })
      .from(productionSessions)
      .leftJoin(employees, eq(productionSessions.employeeId, employees.id))
      .leftJoin(machines, eq(productionSessions.machineId, machines.id))
      .leftJoin(matrices, eq(productionSessions.matrixId, matrices.id))
      .where(eq(productionSessions.id, id));

    return session || undefined;
  }

  async createProductionSession(session: InsertProductionSession): Promise<ProductionSession> {
    const [newSession] = await db.insert(productionSessions).values(session).returning();
    return newSession;
  }

  async updateProductionSession(id: number, session: Partial<InsertProductionSession>): Promise<ProductionSession | undefined> {
    const [updated] = await db.update(productionSessions).set(session).where(eq(productionSessions.id, id)).returning();
    return updated || undefined;
  }

  async endProductionSession(id: number, totalPieces: number): Promise<ProductionSession | undefined> {
    const [updated] = await db
      .update(productionSessions)
      .set({
        endTime: new Date(),
        status: "completed",
        totalPieces,
        efficiency: 100, // Temporary: setting efficiency to 100% since target_pieces was removed
      })
      .where(eq(productionSessions.id, id))
      .returning();
    return updated || undefined;
  }

  async createProductionPause(pause: InsertProductionPause): Promise<ProductionPause> {
    const [newPause] = await db.insert(productionPauses).values(pause).returning();
    return newPause;
  }

  async endProductionPause(id: number): Promise<ProductionPause | undefined> {
    const endTime = new Date();
    const [updated] = await db
      .update(productionPauses)
      .set({ endTime })
      .where(eq(productionPauses.id, id))
      .returning();
    return updated || undefined;
  }

  async getActivePauseBySessionId(sessionId: number): Promise<ProductionPause | undefined> {
    const [pause] = await db
      .select()
      .from(productionPauses)
      .where(and(
        eq(productionPauses.sessionId, sessionId),
        sql`${productionPauses.endTime} IS NULL`
      ))
      .orderBy(desc(productionPauses.startTime))
      .limit(1);
    return pause || undefined;
  }

  async updateProductionPause(id: number, data: Partial<ProductionPause>): Promise<ProductionPause | undefined> {
    const [updated] = await db
      .update(productionPauses)
      .set(data)
      .where(eq(productionPauses.id, id))
      .returning();
    return updated || undefined;
  }

  async getSessionPauses(sessionId: number): Promise<any[]> {
    return await db
      .select({
        id: productionPauses.id,
        startTime: productionPauses.startTime,
        endTime: productionPauses.endTime,
        reason: productionPauses.reason,
        duration: productionPauses.duration,
        pauseReasonId: productionPauses.pauseReasonId,
        pauseReason: {
          id: pauseReasons.id,
          name: pauseReasons.name,
          description: pauseReasons.description,
        },
        newMatrixId: productionPauses.newMatrixId,
        newMaterialId: productionPauses.newMaterialId,
        newMatrix: {
          id: matrices.id,
          name: matrices.name,
        },
        newMaterial: {
          id: rawMaterials.id,
          name: rawMaterials.name,
        },
      })
      .from(productionPauses)
      .leftJoin(pauseReasons, eq(productionPauses.pauseReasonId, pauseReasons.id))
      .leftJoin(matrices, eq(productionPauses.newMatrixId, matrices.id))
      .leftJoin(rawMaterials, eq(productionPauses.newMaterialId, rawMaterials.id))
      .where(eq(productionPauses.sessionId, sessionId))
      .orderBy(productionPauses.startTime);
  }

  async getSessionMetrics(sessionId: number): Promise<any> {
    // Buscar dados da sessão
    const [session] = await db
      .select({
        id: productionSessions.id,
        startTime: productionSessions.startTime,
        endTime: productionSessions.endTime,
        status: productionSessions.status,
        totalPieces: productionSessions.totalPieces,
        matrixId: productionSessions.matrixId,
        selectedMaterialId: productionSessions.selectedMaterialId,
        piecesPerCycle: matrices.piecesPerCycle,
        defaultCycleTime: matrices.cycleTimeSeconds,
        specificCycleTime: matrixMaterials.cycleTimeSeconds,
      })
      .from(productionSessions)
      .leftJoin(matrices, eq(productionSessions.matrixId, matrices.id))
      .leftJoin(matrixMaterials, and(
        eq(matrixMaterials.matrixId, matrices.id),
        eq(matrixMaterials.rawMaterialId, productionSessions.selectedMaterialId)
      ))
      .where(eq(productionSessions.id, sessionId))
      .limit(1);

    if (!session) return null;

    // Buscar pausas da sessão
    const pauses = await db
      .select({
        duration: productionPauses.duration,
        startTime: productionPauses.startTime,
        endTime: productionPauses.endTime,
      })
      .from(productionPauses)
      .where(eq(productionPauses.sessionId, sessionId));

    // Calcular métricas
    const now = new Date();
    const startTime = new Date(session.startTime);
    const endTime = session.endTime ? new Date(session.endTime) : now;
    
    // Tempo total da sessão em minutos
    const totalSessionTime = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    
    // Tempo total de pausas em minutos
    const totalPauseTime = pauses.reduce((total, pause) => {
      if (pause.duration) {
        return total + pause.duration;
      } else if (pause.endTime) {
        const pauseDuration = Math.floor((new Date(pause.endTime).getTime() - new Date(pause.startTime).getTime()) / (1000 * 60));
        return total + pauseDuration;
      } else if (session.status === 'paused') {
        // Pausa ativa
        const pauseDuration = Math.floor((now.getTime() - new Date(pause.startTime).getTime()) / (1000 * 60));
        return total + pauseDuration;
      }
      return total;
    }, 0);
    
    // Tempo efetivo de trabalho
    const effectiveWorkTime = totalSessionTime - totalPauseTime;
    
    // Cálculo de peças esperadas
    const cycleTime = session.specificCycleTime || session.defaultCycleTime || 60;
    const piecesPerCycle = session.piecesPerCycle || 1;
    const cyclesPerHour = 3600 / cycleTime;
    const expectedPiecesPerHour = cyclesPerHour * piecesPerCycle;
    const expectedPieces = Math.floor((effectiveWorkTime / 60) * expectedPiecesPerHour);
    
    // Eficiência real
    const actualEfficiency = expectedPieces > 0 ? (session.totalPieces / expectedPieces) * 100 : 0;

    return {
      sessionId: session.id,
      totalSessionTime,
      totalPauseTime,
      effectiveWorkTime,
      pauseCount: pauses.length,
      cycleTime,
      piecesPerCycle,
      expectedPiecesPerHour: Math.round(expectedPiecesPerHour * 10) / 10,
      expectedPieces,
      actualPieces: session.totalPieces,
      actualEfficiency: Math.round(actualEfficiency * 10) / 10,
      downtimePercentage: totalSessionTime > 0 ? Math.round((totalPauseTime / totalSessionTime) * 100 * 10) / 10 : 0,
    };
  }

  async getEmployeeMachines(): Promise<any[]> {
    return await db
      .select({
        id: employeeMachines.id,
        isActive: employeeMachines.isActive,
        employee: {
          id: employees.id,
          name: employees.name,
          registration: employees.registration,
        },
        machine: {
          id: machines.id,
          name: machines.name,
          code: machines.code,
        },
      })
      .from(employeeMachines)
      .leftJoin(employees, eq(employeeMachines.employeeId, employees.id))
      .leftJoin(machines, eq(employeeMachines.machineId, machines.id))
      .where(eq(employeeMachines.isActive, true));
  }

  async createEmployeeMachine(assignment: InsertEmployeeMachine): Promise<EmployeeMachine> {
    const [newAssignment] = await db.insert(employeeMachines).values(assignment).returning();
    return newAssignment;
  }

  async getDashboardStats(): Promise<any> {
    const activeMachinesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(machines)
      .where(eq(machines.status, "active"));

    const activeEmployeesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(employees)
      .where(eq(employees.isActive, true));

    const todayProductionResult = await db
      .select({ total: sql<number>`coalesce(sum(total_pieces), 0)` })
      .from(productionSessions)
      .where(sql`date(start_time) = current_date`);

    const runningSessionsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(productionSessions)
      .where(eq(productionSessions.status, "running"));

    return {
      activeMachines: activeMachinesResult[0]?.count || 0,
      activeEmployees: activeEmployeesResult[0]?.count || 0,
      todayProduction: todayProductionResult[0]?.total || 0,
      runningSessions: runningSessionsResult[0]?.count || 0,
      overallEfficiency: 85, // Calculate based on actual data
    };
  }

  // Raw Materials methods
  async getRawMaterials(): Promise<RawMaterial[]> {
    return await db.select().from(rawMaterials).where(eq(rawMaterials.isActive, true)).orderBy(rawMaterials.name);
  }

  async getRawMaterial(id: number): Promise<RawMaterial | undefined> {
    const [material] = await db.select().from(rawMaterials).where(eq(rawMaterials.id, id));
    return material || undefined;
  }

  async createRawMaterial(material: InsertRawMaterial): Promise<RawMaterial> {
    const [newMaterial] = await db.insert(rawMaterials).values(material).returning();
    return newMaterial;
  }

  async updateRawMaterial(id: number, material: Partial<InsertRawMaterial>): Promise<RawMaterial | undefined> {
    const [updated] = await db.update(rawMaterials).set(material).where(eq(rawMaterials.id, id)).returning();
    return updated || undefined;
  }

  async deleteRawMaterial(id: number): Promise<boolean> {
    const result = await db.update(rawMaterials).set({ isActive: false }).where(eq(rawMaterials.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Matrix Materials methods
  async getMatrixMaterials(matrixId: number): Promise<any[]> {
    return await db
      .select({
        id: matrixMaterials.id,
        matrixId: matrixMaterials.matrixId,
        rawMaterialId: matrixMaterials.rawMaterialId,
        cycleTimeSeconds: matrixMaterials.cycleTimeSeconds,
        materialName: rawMaterials.name,
        materialDescription: rawMaterials.description,
      })
      .from(matrixMaterials)
      .innerJoin(rawMaterials, eq(matrixMaterials.rawMaterialId, rawMaterials.id))
      .where(eq(matrixMaterials.matrixId, matrixId))
      .orderBy(rawMaterials.name);
  }

  async createMatrixMaterial(matrixMaterial: InsertMatrixMaterial): Promise<MatrixMaterial> {
    const [newMatrixMaterial] = await db.insert(matrixMaterials).values(matrixMaterial).returning();
    return newMatrixMaterial;
  }

  async updateMatrixMaterial(id: number, matrixMaterial: Partial<InsertMatrixMaterial>): Promise<MatrixMaterial | undefined> {
    const [updated] = await db.update(matrixMaterials).set(matrixMaterial).where(eq(matrixMaterials.id, id)).returning();
    return updated || undefined;
  }

  async deleteMatrixMaterial(id: number): Promise<boolean> {
    const result = await db.delete(matrixMaterials).where(eq(matrixMaterials.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Pause Reasons CRUD
  async getPauseReasons(): Promise<PauseReason[]> {
    return await db
      .select()
      .from(pauseReasons)
      .where(eq(pauseReasons.isActive, true))
      .orderBy(pauseReasons.name);
  }

  async getPauseReason(id: number): Promise<PauseReason | undefined> {
    const [reason] = await db
      .select()
      .from(pauseReasons)
      .where(eq(pauseReasons.id, id));
    return reason || undefined;
  }

  async createPauseReason(reason: InsertPauseReason): Promise<PauseReason> {
    const [newReason] = await db.insert(pauseReasons).values(reason).returning();
    return newReason;
  }

  async updatePauseReason(id: number, reason: Partial<InsertPauseReason>): Promise<PauseReason | undefined> {
    const [updated] = await db
      .update(pauseReasons)
      .set(reason)
      .where(eq(pauseReasons.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePauseReason(id: number): Promise<boolean> {
    // Exclusão lógica - marcar como inativo
    const result = await db
      .update(pauseReasons)
      .set({ isActive: false })
      .where(eq(pauseReasons.id, id));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();
