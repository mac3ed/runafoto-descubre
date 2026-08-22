import fs from 'fs';
import postgres from 'postgres';

try {
  process.loadEnvFile('.env');
} catch (e) {
  // Ignorar si no existe .env
}

const connectionString = process.env.DATABASE_URL || 'postgresql://runafoto_user:runafoto_secure_password_2026@localhost:5433/runafoto_cuestionarios';
console.log('Conectando a PostgreSQL:', connectionString.replace(/:[^:@]+@/, ':****@'));

const sql = postgres(connectionString);

async function runSeed() {
  try {
    const sqlContent = fs.readFileSync('seed_espacios_alumnos.sql', 'utf8');
    console.log('Ejecutando seed de Nuevos Espacios...');
    await sql.unsafe(sqlContent);
    console.log('✅ Hito, dimensiones, cuestionario y preguntas de Nuevos Espacios cargados exitosamente sin afectar datos previos.');
  } catch (err) {
    console.error('❌ Error al ejecutar seed:', err);
  } finally {
    await sql.end();
  }
}

runSeed();
