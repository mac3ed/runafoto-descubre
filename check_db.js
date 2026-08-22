import postgres from 'postgres';

const sql = postgres('postgresql://runafoto_user:runafoto_secure_password_2026@localhost:5433/runafoto_cuestionarios');

async function check() {
  const hitos = await sql`SELECT id, nombre, activo FROM hito`;
  console.log('HITOS ENCONTRADOS:', hitos);

  const cuestionarios = await sql`SELECT id, nombre, hito_id FROM cuestionario`;
  console.log('TOTAL CUESTIONARIOS:', cuestionarios.length);

  const asignaciones = await sql`SELECT id, token, identificador_sujeto, estado FROM asignacion`;
  console.log('ASIGNACIONES:', asignaciones);

  const respuestas = await sql`SELECT count(*) FROM respuesta`;
  console.log('TOTAL RESPUESTAS EN DB:', respuestas[0].count);

  await sql.end();
}

check().catch(console.error);
