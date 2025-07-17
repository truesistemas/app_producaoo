import { db } from '../server/db.js';
import { users } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

async function fixAdminStatus() {
  try {
    console.log('🔧 Atualizando status do usuário administrador...');

    const result = await db
      .update(users)
      .set({ status: 'approved' })
      .where(eq(users.username, 'admin'))
      .returning();

    if (result.length > 0) {
      console.log('✅ Status do administrador atualizado para "approved"!');
      console.log(`    Nome: ${result[0].name}`);
      console.log(`    Username: ${result[0].username}`);
      console.log(`    Status: ${result[0].status}`);
    } else {
      console.log('⚠️  Usuário admin não encontrado!');
    }

  } catch (error) {
    console.error('❌ Erro ao atualizar status do administrador:', error);
    process.exit(1);
  }
}

// Run the script
fixAdminStatus().then(() => {
  console.log('✨ Script executado com sucesso!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Erro no script:', error);
  process.exit(1);
}); 