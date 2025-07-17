import { db } from '../server/db.js';
import { users } from '../shared/schema.js';
import { hashPassword } from '../server/auth.js';

async function createAdminUser() {
  try {
    console.log('🔐 Criando usuário administrador...');

    const adminData = {
      username: 'admin',
      password: await hashPassword('admin123'),
      name: 'Administrador do Sistema',
      role: 'admin' as const,
      status: 'approved' as const,
    };

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, adminData.username))
      .limit(1);

    if (existingUser) {
      console.log('⚠️  Usuário admin já existe!');
      console.log(`    Nome: ${existingUser.name}`);
      console.log(`    Username: ${existingUser.username}`);
      console.log(`    Role: ${existingUser.role}`);
      return;
    }

    const [newUser] = await db
      .insert(users)
      .values(adminData)
      .returning();

    console.log('✅ Usuário administrador criado com sucesso!');
    console.log(`    Nome: ${newUser.name}`);
    console.log(`    Username: ${newUser.username}`);
    console.log(`    Password: admin123`);
    console.log(`    Role: ${newUser.role}`);
    console.log('');
    console.log('🚀 Agora você pode fazer login no sistema!');

  } catch (error) {
    console.error('❌ Erro ao criar usuário administrador:', error);
    process.exit(1);
  }
}

// Import eq function
import { eq } from 'drizzle-orm';

// Run the script
createAdminUser().then(() => {
  console.log('✨ Script executado com sucesso!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Erro no script:', error);
  process.exit(1);
}); 