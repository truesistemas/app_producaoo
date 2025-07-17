import { 
  users, employees, machines, matrices, productionSessions, productionPauses, employeeMachines,
  type User, type InsertUser, type Employee, type InsertEmployee, 
  type Machine, type InsertMachine, type Matrix, type InsertMatrix,
  type ProductionSession, type InsertProductionSession,
  type ProductionPause, type InsertProductionPause,
  type EmployeeMachine, type InsertEmployeeMachine
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

  // Employee Machines
  getEmployeeMachines(): Promise<any[]>;
  createEmployeeMachine(assignment: InsertEmployeeMachine): Promise<EmployeeMachine>;

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
        targetPieces: productionSessions.targetPieces,
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
        },
      })
      .from(productionSessions)
      .leftJoin(employees, eq(productionSessions.employeeId, employees.id))
      .leftJoin(machines, eq(productionSessions.machineId, machines.id))
      .leftJoin(matrices, eq(productionSessions.matrixId, matrices.id))
      .orderBy(desc(productionSessions.createdAt));
  }

  async getActiveProductionSessions(): Promise<any[]> {
    return await db
      .select({
        id: productionSessions.id,
        startTime: productionSessions.startTime,
        status: productionSessions.status,
        totalPieces: productionSessions.totalPieces,
        targetPieces: productionSessions.targetPieces,
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
        },
      })
      .from(productionSessions)
      .leftJoin(employees, eq(productionSessions.employeeId, employees.id))
      .leftJoin(machines, eq(productionSessions.machineId, machines.id))
      .leftJoin(matrices, eq(productionSessions.matrixId, matrices.id))
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
        targetPieces: productionSessions.targetPieces,
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
        efficiency: sql`CASE WHEN target_pieces > 0 THEN (${totalPieces}::float / target_pieces * 100) ELSE 0 END`,
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
}

export const storage = new DatabaseStorage();
