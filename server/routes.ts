import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertEmployeeSchema, insertMachineSchema, insertMatrixSchema, 
  insertProductionSessionSchema, insertProductionPauseSchema,
  insertEmployeeMachineSchema, insertUserSchema
} from "@shared/schema";
import { z } from "zod";
import { 
  hashPassword, comparePassword, generateToken, 
  authenticateToken, requireRole, requireMinimumRole,
  type AuthenticatedRequest
} from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ 
          message: "Nome de usuário e senha são obrigatórios",
          error: "MISSING_CREDENTIALS"
        });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ 
          message: "Credenciais inválidas",
          error: "INVALID_CREDENTIALS"
        });
      }

      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ 
          message: "Credenciais inválidas",
          error: "INVALID_CREDENTIALS"
        });
      }

      // Check if user is approved
      if (user.status !== 'approved') {
        let message = "Acesso negado";
        let error = "ACCESS_DENIED";
        
        if (user.status === 'pending') {
          message = "Sua conta está aguardando aprovação do administrador";
          error = "PENDING_APPROVAL";
        } else if (user.status === 'rejected') {
          message = "Sua conta foi rejeitada pelo administrador";
          error = "ACCOUNT_REJECTED";
        }
        
        return res.status(403).json({ message, error });
      }

      const token = generateToken(user);
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        message: "Login realizado com sucesso",
        token,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ 
        message: "Erro interno do servidor",
        error: "INTERNAL_ERROR"
      });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({ 
          message: "Nome de usuário já está em uso",
          error: "USERNAME_EXISTS"
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);
      
      // SECURITY: ALWAYS create new users with "pending" status - NO EXCEPTIONS!
      // Even if admin level is selected, it must be approved by existing admin
      const userToCreate = {
        ...userData,
        password: hashedPassword,
        status: "pending" // Force pending status for ALL new registrations
      };

      const user = await storage.createUser(userToCreate);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      // SECURITY: NEVER auto-login new users - ALL must be approved first
      res.status(201).json({
        message: "Conta criada com sucesso! Aguarde a aprovação de um administrador para fazer login.",
        user: userWithoutPassword,
        requiresApproval: true
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors,
          error: "VALIDATION_ERROR"
        });
      }
      console.error("Register error:", error);
      res.status(500).json({ 
        message: "Erro interno do servidor",
        error: "INTERNAL_ERROR"
      });
    }
  });

  app.get("/api/auth/me", authenticateToken, (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: "Usuário não autenticado",
        error: "NOT_AUTHENTICATED"
      });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = req.user;
    res.json({ user: userWithoutPassword });
  });

  app.post("/api/auth/logout", authenticateToken, (req: AuthenticatedRequest, res) => {
    // For JWT, logout is handled client-side by removing the token
    // In a more sophisticated setup, we could maintain a blacklist
    res.json({ message: "Logout realizado com sucesso" });
  });

  // Users management routes (Admin only)
  app.get("/api/users", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const users = await storage.getUsers();
      
      // Remove passwords from response
      const usersWithoutPassword = users.map(({ password, ...user }) => user);
      
      res.json(usersWithoutPassword);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ 
        message: "Erro ao buscar usuários",
        error: "INTERNAL_ERROR"
      });
    }
  });

  app.get("/api/users/pending", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const users = await storage.getUsersByStatus("pending");
      
      // Remove passwords from response
      const usersWithoutPassword = users.map(({ password, ...user }) => user);
      
      res.json(usersWithoutPassword);
    } catch (error) {
      console.error("Get pending users error:", error);
      res.status(500).json({ 
        message: "Erro ao buscar usuários pendentes",
        error: "INTERNAL_ERROR"
      });
    }
  });

  app.put("/api/users/:id/approve", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const user = await storage.updateUser(id, { status: "approved" });
      if (!user) {
        return res.status(404).json({ 
          message: "Usuário não encontrado",
          error: "USER_NOT_FOUND"
        });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      res.json({
        message: "Usuário aprovado com sucesso",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Approve user error:", error);
      res.status(500).json({ 
        message: "Erro ao aprovar usuário",
        error: "INTERNAL_ERROR"
      });
    }
  });

  app.put("/api/users/:id/reject", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const user = await storage.updateUser(id, { status: "rejected" });
      if (!user) {
        return res.status(404).json({ 
          message: "Usuário não encontrado",
          error: "USER_NOT_FOUND"
        });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      res.json({
        message: "Usuário rejeitado",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Reject user error:", error);
      res.status(500).json({ 
        message: "Erro ao rejeitar usuário",
        error: "INTERNAL_ERROR"
      });
    }
  });

  app.put("/api/users/:id", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { password, ...updateData } = req.body;
      
      // If password is being updated, hash it
      if (password) {
        updateData.password = await hashPassword(password);
      }

      const user = await storage.updateUser(id, updateData);
      if (!user) {
        return res.status(404).json({ 
          message: "Usuário não encontrado",
          error: "USER_NOT_FOUND"
        });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        message: "Usuário atualizado com sucesso",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ 
        message: "Erro ao atualizar usuário",
        error: "INTERNAL_ERROR"
      });
    }
  });

  app.delete("/api/users/:id", authenticateToken, requireRole("admin"), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Prevent deleting self
      if (req.user && req.user.id === id) {
        return res.status(400).json({ 
          message: "Você não pode deletar sua própria conta",
          error: "CANNOT_DELETE_SELF"
        });
      }

      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ 
          message: "Usuário não encontrado",
          error: "USER_NOT_FOUND"
        });
      }

      res.json({ message: "Usuário removido com sucesso" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ 
        message: "Erro ao remover usuário",
        error: "INTERNAL_ERROR"
      });
    }
  });

  app.put("/api/auth/change-password", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          message: "Senha atual e nova senha são obrigatórias",
          error: "MISSING_PASSWORDS"
        });
      }

      if (!req.user) {
        return res.status(401).json({ 
          message: "Usuário não autenticado",
          error: "NOT_AUTHENTICATED"
        });
      }

      // Verify current password
      const isValidPassword = await comparePassword(currentPassword, req.user.password);
      if (!isValidPassword) {
        return res.status(401).json({ 
          message: "Senha atual incorreta",
          error: "INVALID_CURRENT_PASSWORD"
        });
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);
      
      // Update password
      await storage.updateUser(req.user.id, { password: hashedNewPassword });

      res.json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ 
        message: "Erro interno do servidor",
        error: "INTERNAL_ERROR"
      });
    }
  });

  // Employee routes (require authentication)
  app.get("/api/employees", authenticateToken, async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar colaboradores" });
    }
  });

  app.get("/api/employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: "Colaborador não encontrado" });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar colaborador" });
    }
  });

  app.post("/api/employees", authenticateToken, requireMinimumRole("supervisor"), async (req, res) => {
    try {
      const employeeData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(employeeData);
      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar colaborador" });
    }
  });

  app.put("/api/employees/:id", authenticateToken, requireMinimumRole("supervisor"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employeeData = insertEmployeeSchema.partial().parse(req.body);
      const employee = await storage.updateEmployee(id, employeeData);
      if (!employee) {
        return res.status(404).json({ message: "Colaborador não encontrado" });
      }
      res.json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao atualizar colaborador" });
    }
  });

  app.delete("/api/employees/:id", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteEmployee(id);
      if (!success) {
        return res.status(404).json({ message: "Colaborador não encontrado" });
      }
      res.json({ message: "Colaborador removido com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao remover colaborador" });
    }
  });

  // Machine routes (require authentication)
  app.get("/api/machines", authenticateToken, async (req, res) => {
    try {
      const machines = await storage.getMachines();
      res.json(machines);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar máquinas" });
    }
  });

  app.post("/api/machines", authenticateToken, requireMinimumRole("supervisor"), async (req, res) => {
    try {
      const machineData = insertMachineSchema.parse(req.body);
      const machine = await storage.createMachine(machineData);
      res.status(201).json(machine);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar máquina" });
    }
  });

  app.put("/api/machines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const machineData = insertMachineSchema.partial().parse(req.body);
      const machine = await storage.updateMachine(id, machineData);
      if (!machine) {
        return res.status(404).json({ message: "Máquina não encontrada" });
      }
      res.json(machine);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao atualizar máquina" });
    }
  });

  // Matrix routes
  app.get("/api/matrices", async (req, res) => {
    try {
      const matrices = await storage.getMatrices();
      res.json(matrices);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar matrizes" });
    }
  });

  app.post("/api/matrices", async (req, res) => {
    try {
      const matrixData = insertMatrixSchema.parse(req.body);
      const matrix = await storage.createMatrix(matrixData);
      res.status(201).json(matrix);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar matriz" });
    }
  });

  app.put("/api/matrices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const matrixData = insertMatrixSchema.partial().parse(req.body);
      const matrix = await storage.updateMatrix(id, matrixData);
      if (!matrix) {
        return res.status(404).json({ message: "Matriz não encontrada" });
      }
      res.json(matrix);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao atualizar matriz" });
    }
  });

  // Production session routes (require authentication)
  app.get("/api/production-sessions", authenticateToken, async (req, res) => {
    try {
      const sessions = await storage.getProductionSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar sessões de produção" });
    }
  });

  app.get("/api/production-sessions/active", authenticateToken, async (req, res) => {
    try {
      const sessions = await storage.getActiveProductionSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar sessões ativas" });
    }
  });

  app.post("/api/production-sessions", async (req, res) => {
    try {
      const sessionData = insertProductionSessionSchema.parse({
        ...req.body,
        startTime: new Date(),
        status: "running"
      });
      const session = await storage.createProductionSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao iniciar produção" });
    }
  });

  app.put("/api/production-sessions/:id/pause", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { reason } = req.body;
      
      // Update session status to paused
      await storage.updateProductionSession(id, { status: "paused" });
      
      // Create pause record
      const pause = await storage.createProductionPause({
        sessionId: id,
        startTime: new Date(),
        reason,
      });
      
      res.json({ message: "Produção pausada", pause });
    } catch (error) {
      res.status(500).json({ message: "Erro ao pausar produção" });
    }
  });

  app.put("/api/production-sessions/:id/resume", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Update session status to running
      const session = await storage.updateProductionSession(id, { status: "running" });
      
      res.json({ message: "Produção retomada", session });
    } catch (error) {
      res.status(500).json({ message: "Erro ao retomar produção" });
    }
  });

  app.put("/api/production-sessions/:id/end", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { totalPieces } = req.body;
      
      const session = await storage.endProductionSession(id, totalPieces);
      if (!session) {
        return res.status(404).json({ message: "Sessão não encontrada" });
      }
      
      res.json({ message: "Produção finalizada", session });
    } catch (error) {
      res.status(500).json({ message: "Erro ao finalizar produção" });
    }
  });

  // Dashboard stats (require authentication)
  app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  // Employee-machine assignments
  app.get("/api/employee-machines", async (req, res) => {
    try {
      const assignments = await storage.getEmployeeMachines();
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar atribuições" });
    }
  });

  app.post("/api/employee-machines", async (req, res) => {
    try {
      const assignmentData = insertEmployeeMachineSchema.parse(req.body);
      const assignment = await storage.createEmployeeMachine(assignmentData);
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar atribuição" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
