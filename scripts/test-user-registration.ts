#!/usr/bin/env tsx

/**
 * Script de teste para demonstrar o fluxo de aprovação de usuários
 * Execute com: npm run test:user-registration
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../server/auth";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function main() {
  console.log("🧪 Testando fluxo de aprovação de usuários...\n");

  try {
    // 1. Criar usuário de teste pendente
    console.log("1. Criando usuário de teste pendente...");
    const hashedPassword = await hashPassword("teste123");
    
    const [testUser] = await db.insert(users).values({
      username: "usuario_teste",
      password: hashedPassword,
      name: "Usuário de Teste",
      role: "operator",
      status: "pending"
    }).returning();

    console.log(`✅ Usuário criado: ${testUser.name} (ID: ${testUser.id})`);
    console.log(`   Status: ${testUser.status}`);
    console.log(`   Role: ${testUser.role}\n`);

    // 2. Verificar lista de usuários pendentes
    console.log("2. Verificando usuários pendentes...");
    const pendingUsers = await db
      .select()
      .from(users)
      .where(eq(users.status, "pending"));

    console.log(`📋 Usuários pendentes encontrados: ${pendingUsers.length}`);
    pendingUsers.forEach(user => {
      console.log(`   - ${user.name} (${user.username}) - ${user.role}`);
    });
    console.log();

    // 3. Simular aprovação
    console.log("3. Simulando aprovação do usuário...");
    const [approvedUser] = await db
      .update(users)
      .set({ status: "approved" })
      .where(eq(users.id, testUser.id))
      .returning();

    console.log(`✅ Usuário aprovado: ${approvedUser.name}`);
    console.log(`   Novo status: ${approvedUser.status}\n`);

    // 4. Limpeza - remover usuário de teste
    console.log("4. Removendo usuário de teste...");
    await db.delete(users).where(eq(users.id, testUser.id));
    console.log("🗑️ Usuário de teste removido\n");

    console.log("🎉 Teste concluído com sucesso!");
    console.log("\n📌 Como testar no sistema:");
    console.log("1. Acesse http://localhost:5002");
    console.log("2. Na tela de login, clique em 'Cadastrar'");
    console.log("3. Preencha os dados e registre um novo usuário");
    console.log("4. O usuário será criado com status 'pendente'");
    console.log("5. Faça login como admin (admin/admin123)");
    console.log("6. Veja a notificação no menu 'Usuários'");
    console.log("7. Acesse 'Usuários' para aprovar/rejeitar");

  } catch (error) {
    console.error("❌ Erro no teste:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(console.error); 