import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './shared/schema.js';
import { eq, desc, and, sql } from 'drizzle-orm';

const { Pool } = pg;

const pool = new Pool({ 
  connectionString: "postgres://app_producao:@Wsr461300321321@54.242.187.130:5432/app-producao-postegres?sslmode=disable",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const db = drizzle(pool, { schema });

const { productionSessions, employees, machines, matrices } = schema;

async function testDrizzleQueries() {
  try {
    console.log('🔍 Testando queries do Drizzle...');
    
    // Teste 1: Query simples
    console.log('\n1. Query simples com Drizzle:');
    const simpleQuery = await db
      .select({
        id: productionSessions.id,
        status: productionSessions.status,
        selectedMaterialId: productionSessions.selectedMaterialId,
      })
      .from(productionSessions)
      .limit(3);
    
    console.log('✅ Query simples OK:', simpleQuery.length, 'resultados');
    simpleQuery.forEach(s => console.log(`  ID: ${s.id}, Status: ${s.status}, Material: ${s.selectedMaterialId}`));
    
    // Teste 2: Query com joins (igual ao getProductionSessions)
    console.log('\n2. Query com joins:');
    const joinQuery = await db
      .select({
        id: productionSessions.id,
        startTime: productionSessions.startTime,
        endTime: productionSessions.endTime,
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
        },
      })
      .from(productionSessions)
      .leftJoin(employees, eq(productionSessions.employeeId, employees.id))
      .leftJoin(machines, eq(productionSessions.machineId, machines.id))
      .leftJoin(matrices, eq(productionSessions.matrixId, matrices.id))
      .orderBy(desc(productionSessions.createdAt))
      .limit(3);
    
    console.log('✅ Query com joins OK:', joinQuery.length, 'resultados');
    joinQuery.forEach(s => console.log(`  ID: ${s.id}, Employee: ${s.employee?.name}, Machine: ${s.machine?.name}, Matrix: ${s.matrix?.name}`));
    
    // Teste 3: Query de sessões ativas (igual ao getActiveProductionSessions)
    console.log('\n3. Query de sessões ativas:');
    const activeQuery = await db
      .select({
        id: productionSessions.id,
        status: productionSessions.status,
        selectedMaterialId: productionSessions.selectedMaterialId,
      })
      .from(productionSessions)
      .where(and(
        eq(productionSessions.status, "running"),
        sql`${productionSessions.endTime} IS NULL`
      ))
      .limit(3);
    
    console.log('✅ Query de sessões ativas OK:', activeQuery.length, 'resultados');
    activeQuery.forEach(s => console.log(`  ID: ${s.id}, Status: ${s.status}, Material: ${s.selectedMaterialId}`));
    
  } catch (error) {
    console.error('❌ Erro no Drizzle:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testDrizzleQueries().catch(console.error);