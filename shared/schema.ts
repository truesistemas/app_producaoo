import { pgTable, text, serial, integer, boolean, timestamp, real, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("operator"), // operator, supervisor, admin
  name: text("name").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Employees table
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  registration: text("registration").notNull().unique(),
  shift: varchar("shift", { length: 20 }).notNull(), // morning, afternoon, night
  dailyTarget: integer("daily_target").default(0),
  weeklyTarget: integer("weekly_target").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Injection machines table
export const machines = pgTable("machines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  code: text("code").notNull().unique(),
  maxCapacityPerDay: integer("max_capacity_per_day").default(0),
  status: varchar("status", { length: 20 }).notNull().default("inactive"), // active, inactive, maintenance
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Matrices (molds) table
export const matrices = pgTable("matrices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  pieceName: text("piece_name").notNull(),
  piecesPerCycle: integer("pieces_per_cycle").default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Production sessions table
export const productionSessions = pgTable("production_sessions", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  machineId: integer("machine_id").notNull().references(() => machines.id),
  matrixId: integer("matrix_id").notNull().references(() => matrices.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  status: varchar("status", { length: 20 }).notNull().default("running"), // running, paused, completed
  totalPieces: integer("total_pieces").default(0),
  targetPieces: integer("target_pieces").default(0),
  efficiency: real("efficiency").default(0), // percentage
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Production pauses table
export const productionPauses = pgTable("production_pauses", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => productionSessions.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  reason: text("reason").notNull(),
  duration: integer("duration"), // in minutes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Employee-machine assignments
export const employeeMachines = pgTable("employee_machines", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  machineId: integer("machine_id").notNull().references(() => machines.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const employeesRelations = relations(employees, ({ many }) => ({
  productionSessions: many(productionSessions),
  employeeMachines: many(employeeMachines),
}));

export const machinesRelations = relations(machines, ({ many }) => ({
  productionSessions: many(productionSessions),
  employeeMachines: many(employeeMachines),
}));

export const matricesRelations = relations(matrices, ({ many }) => ({
  productionSessions: many(productionSessions),
}));

export const productionSessionsRelations = relations(productionSessions, ({ one, many }) => ({
  employee: one(employees, {
    fields: [productionSessions.employeeId],
    references: [employees.id],
  }),
  machine: one(machines, {
    fields: [productionSessions.machineId],
    references: [machines.id],
  }),
  matrix: one(matrices, {
    fields: [productionSessions.matrixId],
    references: [matrices.id],
  }),
  pauses: many(productionPauses),
}));

export const productionPausesRelations = relations(productionPauses, ({ one }) => ({
  session: one(productionSessions, {
    fields: [productionPauses.sessionId],
    references: [productionSessions.id],
  }),
}));

export const employeeMachinesRelations = relations(employeeMachines, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeMachines.employeeId],
    references: [employees.id],
  }),
  machine: one(machines, {
    fields: [employeeMachines.machineId],
    references: [machines.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
});

export const insertMachineSchema = createInsertSchema(machines).omit({
  id: true,
  createdAt: true,
});

export const insertMatrixSchema = createInsertSchema(matrices).omit({
  id: true,
  createdAt: true,
});

export const insertProductionSessionSchema = createInsertSchema(productionSessions).omit({
  id: true,
  createdAt: true,
});

export const insertProductionPauseSchema = createInsertSchema(productionPauses).omit({
  id: true,
  createdAt: true,
});

export const insertEmployeeMachineSchema = createInsertSchema(employeeMachines).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type Machine = typeof machines.$inferSelect;
export type InsertMachine = z.infer<typeof insertMachineSchema>;

export type Matrix = typeof matrices.$inferSelect;
export type InsertMatrix = z.infer<typeof insertMatrixSchema>;

export type ProductionSession = typeof productionSessions.$inferSelect;
export type InsertProductionSession = z.infer<typeof insertProductionSessionSchema>;

export type ProductionPause = typeof productionPauses.$inferSelect;
export type InsertProductionPause = z.infer<typeof insertProductionPauseSchema>;

export type EmployeeMachine = typeof employeeMachines.$inferSelect;
export type InsertEmployeeMachine = z.infer<typeof insertEmployeeMachineSchema>;
