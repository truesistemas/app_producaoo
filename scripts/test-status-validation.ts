#!/usr/bin/env tsx

/**
 * Script de teste para verificar validação de status em tempo real
 * Testa se usuários logados são expulsos quando status muda para pending
 * Execute com: npm run test:status-validation
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

async function testStatusValidation() {
  console.log("🔍 TESTE DE VALIDAÇÃO DE STATUS EM TEMPO REAL\n");

  try {
    // 1. Criar usuário aprovado para teste
    console.log("1. Criando usuário aprovado para teste...");
    const hashedPassword = await hashPassword("teste123");
    
    const [testUser] = await db.insert(users).values({
      username: "usuario_teste_status",
      password: hashedPassword,
      name: "Usuário Teste Status",
      role: "operator",
      status: "approved" // Inicialmente aprovado
    }).returning();

    console.log(`✅ Usuário criado: ${testUser.name} (Status: ${testUser.status})`);

    // 2. Gerar token para o usuário (simulando login)
    const token = generateToken(testUser);
    console.log("🔑 Token gerado para usuário aprovado");

    // 3. Simular mudança de status para "pending"
    console.log("\n3. Alterando status do usuário para 'pending'...");
    const [updatedUser] = await db
      .update(users)
      .set({ status: "pending" })
      .where(eq(users.id, testUser.id))
      .returning();

    console.log(`🔄 Status alterado: ${updatedUser.status}`);

    // 4. Simular chamada de API com token antigo
    console.log("\n4. Testando acesso com token antigo após mudança de status...");
    
    try {
      const response = await fetch('http://localhost:5002/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 403) {
        const errorData = await response.json();
        console.log(`🚫 ACESSO NEGADO - Status: ${response.status}`);
        console.log(`📋 Erro: ${errorData.error}`);
        console.log(`💬 Mensagem: ${errorData.message}`);
        console.log("✅ CORREÇÃO FUNCIONANDO! Usuário foi expulso do sistema");
      } else if (response.ok) {
        console.log("❌ FALHA! Usuário ainda consegue acessar com token antigo");
        console.log("⚠️ A validação de status NÃO está funcionando!");
      } else {
        console.log(`⚠️ Resposta inesperada: ${response.status}`);
      }

    } catch (error) {
      console.log("🌐 Erro de conexão - servidor pode estar offline");
      console.log("💡 Execute 'npm run dev' em outro terminal para testar");
    }

    // 5. Testar mudança para "rejected"
    console.log("\n5. Testando status 'rejected'...");
    await db
      .update(users)
      .set({ status: "rejected" })
      .where(eq(users.id, testUser.id));

    try {
      const response = await fetch('http://localhost:5002/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 403) {
        const errorData = await response.json();
        console.log(`🚫 USUÁRIO REJEITADO - Acesso negado corretamente`);
        console.log(`💬 Mensagem: ${errorData.message}`);
      }
    } catch (error) {
      console.log("🌐 Servidor offline para teste de rejeição");
    }

    // 6. Limpeza
    console.log("\n6. Removendo usuário de teste...");
    await db.delete(users).where(eq(users.id, testUser.id));
    console.log("🗑️ Usuário de teste removido");

    console.log("\n🎉 TESTE DE STATUS CONCLUÍDO!");
    console.log("\n✅ COMPORTAMENTO ESPERADO:");
    console.log("• Usuários com status 'pending' ou 'rejected' são expulsos");
    console.log("• Tokens antigos não funcionam após mudança de status");
    console.log("• Frontend recebe erro 403 e faz logout automático");
    console.log("• Sistema mantém segurança em tempo real");

  } catch (error) {
    console.error("❌ Erro no teste:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testStatusValidation().catch(console.error); 