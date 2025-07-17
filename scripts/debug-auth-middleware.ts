#!/usr/bin/env tsx

/**
 * Script de debug para verificar o middleware de autenticação
 * Execute com: npm run debug:auth-middleware
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword, generateToken } from "../server/auth";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function debugAuthMiddleware() {
  console.log("🐛 DEBUG DO MIDDLEWARE DE AUTENTICAÇÃO\n");

  try {
    // 1. Criar usuário aprovado para teste
    console.log("1. Criando usuário aprovado para teste...");
    const hashedPassword = await hashPassword("teste123");
    
    const [testUser] = await db.insert(users).values({
      username: "debug_usuario",
      password: hashedPassword,
      name: "Debug User",
      role: "operator",
      status: "approved"
    }).returning();

    console.log(`✅ Usuário criado: ${testUser.name}`);
    console.log(`📊 ID: ${testUser.id}, Status: ${testUser.status}`);

    // 2. Gerar token
    const token = generateToken(testUser);
    console.log(`🔑 Token gerado: ${token.substring(0, 50)}...`);

    // 3. Testar com usuário aprovado
    console.log("\n2. Testando acesso com usuário APROVADO...");
    try {
      const response = await fetch('http://localhost:5002/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`📡 Status da resposta: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Usuário autenticado: ${data.user.name}`);
        console.log(`📊 Status no banco: ${data.user.status || 'undefined'}`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log(`❌ Erro: ${JSON.stringify(errorData, null, 2)}`);
      }
    } catch (error) {
      console.log(`🌐 Erro de conexão: ${error}`);
      console.log("💡 Certifique-se de que o servidor está rodando com 'npm run dev'");
      return;
    }

    // 4. Alterar status para pending
    console.log("\n3. Alterando status para PENDING...");
    const [updatedUser] = await db
      .update(users)
      .set({ status: "pending" })
      .where(eq(users.id, testUser.id))
      .returning();

    console.log(`🔄 Status alterado de 'approved' para '${updatedUser.status}'`);

    // 5. Verificar no banco de dados
    console.log("\n4. Verificando usuário diretamente no banco...");
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, testUser.id));
    
    console.log(`📊 Status no DB: ${dbUser.status}`);

    // 6. Testar acesso com status alterado
    console.log("\n5. Testando acesso com usuário PENDING...");
    try {
      const response = await fetch('http://localhost:5002/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`📡 Status da resposta: ${response.status} ${response.statusText}`);
      
      if (response.status === 403) {
        const errorData = await response.json();
        console.log(`🚫 SUCESSO! Acesso negado corretamente`);
        console.log(`📋 Erro: ${errorData.error}`);
        console.log(`💬 Mensagem: ${errorData.message}`);
      } else if (response.ok) {
        const data = await response.json();
        console.log(`❌ PROBLEMA! Usuário ainda consegue acessar`);
        console.log(`📊 Dados retornados: ${JSON.stringify(data, null, 2)}`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log(`⚠️ Resposta inesperada: ${JSON.stringify(errorData, null, 2)}`);
      }
    } catch (error) {
      console.log(`🌐 Erro de conexão: ${error}`);
    }

    // 7. Limpeza
    console.log("\n6. Removendo usuário de teste...");
    await db.delete(users).where(eq(users.id, testUser.id));
    console.log("🗑️ Usuário removido");

  } catch (error) {
    console.error("❌ Erro no debug:", error);
  } finally {
    await pool.end();
  }
}

debugAuthMiddleware().catch(console.error); 