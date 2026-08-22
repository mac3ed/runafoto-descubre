import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sql = postgres('postgresql://runafoto_user:runafoto_secure_password_2026@localhost:5433/runafoto_cuestionarios');

async function backup() {
  const data = {
    hitos: await sql`SELECT * FROM hito`,
    dimensiones: await sql`SELECT * FROM dimension`,
    cuestionarios: await sql`SELECT * FROM cuestionario`,
    preguntas: await sql`SELECT * FROM pregunta ORDER BY orden ASC`,
    asignaciones: await sql`SELECT * FROM asignacion`,
    respuestas: await sql`SELECT * FROM respuesta`,
  };

  const target = path.join(__dirname, 'backup_descubrimiento_completo.json');
  fs.writeFileSync(target, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✅ Backup completo guardado en: ${target} (${data.respuestas.length} respuestas, ${data.hitos.length} hitos).`);
  await sql.end();
}

backup().catch(console.error);
