import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: "postgres://app_producao:@Wsr461300321321@54.242.187.130:5432/app-producao-postegres?sslmode=disable"
});

async function applyMigration() {
  try {
    await client.connect();
    console.log('🔗 Conectado ao banco de dados');
    
    // Verificar se a tabela pause_reasons já existe
    console.log('🔍 Verificando se tabela pause_reasons já existe...');
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'pause_reasons'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('✅ Tabela pause_reasons já existe');
    } else {
      console.log('🔧 Criando tabela pause_reasons...');
      
      // Criar tabela pause_reasons
      await client.query(`
        CREATE TABLE pause_reasons (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP NOT NULL DEFAULT now()
        );
      `);
      console.log('✅ Tabela pause_reasons criada');
    }
    
    // Verificar se a coluna pause_reason_id já existe em production_pauses
    console.log('🔍 Verificando coluna pause_reason_id...');
    const columnExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'production_pauses' 
        AND column_name = 'pause_reason_id'
      );
    `);
    
    if (columnExists.rows[0].exists) {
      console.log('✅ Coluna pause_reason_id já existe');
    } else {
      console.log('🔧 Adicionando coluna pause_reason_id...');
      
      // Adicionar coluna pause_reason_id
      await client.query(`
        ALTER TABLE production_pauses 
        ADD COLUMN pause_reason_id INTEGER REFERENCES pause_reasons(id);
      `);
      console.log('✅ Coluna pause_reason_id adicionada');
    }
    
    // Verificar se reason pode ser NULL
    console.log('🔧 Atualizando coluna reason para ser opcional...');
    await client.query(`
      ALTER TABLE production_pauses 
      ALTER COLUMN reason DROP NOT NULL;
    `);
    console.log('✅ Coluna reason agora é opcional');
    
    // Verificar se já existem dados de pause_reasons
    const reasonsCount = await client.query('SELECT COUNT(*) FROM pause_reasons');
    
    if (parseInt(reasonsCount.rows[0].count) === 0) {
      console.log('🔧 Inserindo motivos de pausa padrão...');
      
      // Inserir motivos padrão
      await client.query(`
        INSERT INTO pause_reasons (name, description) VALUES 
        ('Banheiro', 'Pausa para necessidades fisiológicas'),
        ('Refeição', 'Pausa para almoço ou lanche'),
        ('Troca de Matriz', 'Pausa para troca de matriz de produção'),
        ('Manutenção', 'Pausa para manutenção preventiva ou corretiva'),
        ('Reunião', 'Pausa para participação em reuniões'),
        ('Descanso', 'Pausa para descanso programado'),
        ('Problema Técnico', 'Pausa devido a problemas técnicos na produção'),
        ('Falta de Material', 'Pausa por falta de matéria-prima'),
        ('Outros', 'Outros motivos não listados');
      `);
      console.log('✅ Motivos de pausa inseridos');
    } else {
      console.log('✅ Motivos de pausa já existem');
    }
    
    // Criar índices se não existirem
    console.log('🔧 Criando índices...');
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_production_pauses_pause_reason_id 
        ON production_pauses(pause_reason_id);
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_pause_reasons_is_active 
        ON pause_reasons(is_active);
      `);
      console.log('✅ Índices criados');
    } catch (err) {
      console.log('ℹ️ Índices já existem ou foram criados');
    }
    
    // Verificar resultado final
    console.log('\n📊 Verificação final:');
    const finalReasons = await client.query('SELECT id, name, is_active FROM pause_reasons ORDER BY id');
    console.log(`✅ ${finalReasons.rows.length} motivos de pausa disponíveis:`);
    finalReasons.rows.forEach(reason => {
      console.log(`  ${reason.id}: ${reason.name} ${reason.is_active ? '(ativo)' : '(inativo)'}`);
    });
    
    console.log('\n🎉 Migration aplicada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na migration:', error.message);
  } finally {
    await client.end();
  }
}

applyMigration();