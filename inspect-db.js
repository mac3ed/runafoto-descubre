import postgres from 'postgres';

const connectionString = 'postgresql://runafoto_user:runafoto_secure_password_2026@localhost:5433/runafoto_cuestionarios';
const sql = postgres(connectionString);

async function inspectDb() {
  try {
    console.log('Starting DB cleanup and index creation...');
    
    // 1. Eliminar respuestas duplicadas de la base de datos
    const deletedCount = await sql`
      DELETE FROM respuesta r1
      USING respuesta r2
      WHERE r1.id < r2.id
        AND r1.asignacion_id = r2.asignacion_id
        AND r1.pregunta_id = r2.pregunta_id
        AND COALESCE(r1.valor->>'sesionId', '') = COALESCE(r2.valor->>'sesionId', '');
    `;
    console.log('Deleted duplicate records count:', deletedCount.count);

    // 2. Crear índice único
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_respuesta_unico_sesion 
      ON respuesta (asignacion_id, pregunta_id, COALESCE(valor->>'sesionId', ''));
    `;
    console.log('Unique index created successfully!');
    
  } catch (error) {
    console.error('Error during DB cleanup:', error);
  } finally {
    await sql.end();
  }
}

inspectDb();
