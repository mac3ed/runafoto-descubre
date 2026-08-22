import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sql = postgres('postgresql://runafoto_user:runafoto_secure_password_2026@localhost:5433/runafoto_cuestionarios');

async function exportSql() {
  const hitos = await sql`SELECT * FROM hito`;
  const dimensiones = await sql`SELECT * FROM dimension`;
  const cuestionarios = await sql`SELECT * FROM cuestionario`;
  const preguntas = await sql`SELECT * FROM pregunta ORDER BY orden ASC`;
  const asignaciones = await sql`SELECT * FROM asignacion`;
  const respuestas = await sql`SELECT * FROM respuesta`;

  let sqlOutput = `-- ==============================================================================
-- RESTAURACIÓN COMPLETA DE DESCUBRIMIENTO ORGANIZACIONAL Y NUEVOS ESPACIOS
-- ==============================================================================
BEGIN;

-- 1. HITOS
`;

  for (const h of hitos) {
    sqlOutput += `INSERT INTO hito (id, nombre, fecha_inicio, fecha_fin, activo) VALUES ('${h.id}', '${h.nombre.replace(/'/g, "''")}', '${h.fecha_inicio.toISOString()}', '${h.fecha_fin.toISOString()}', ${h.activo}) ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, activo = EXCLUDED.activo;\n`;
  }

  sqlOutput += `\n-- 2. DIMENSIONES\n`;
  for (const d of dimensiones) {
    sqlOutput += `INSERT INTO dimension (id, hito_id, codigo, nombre, descripcion, color) VALUES ('${d.id}', '${d.hito_id}', '${d.codigo}', '${d.nombre.replace(/'/g, "''")}', '${d.descripcion.replace(/'/g, "''")}', '${d.color || ''}') ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion, color = EXCLUDED.color;\n`;
  }

  sqlOutput += `\n-- 3. CUESTIONARIOS\n`;
  for (const c of cuestionarios) {
    const metaStr = JSON.stringify(c.metadatos || {}).replace(/'/g, "''");
    sqlOutput += `INSERT INTO cuestionario (id, hito_id, nombre, descripcion, version, metadatos) VALUES ('${c.id}', '${c.hito_id}', '${c.nombre.replace(/'/g, "''")}', '${c.descripcion.replace(/'/g, "''")}', ${c.version}, '${metaStr}'::jsonb) ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion, metadatos = EXCLUDED.metadatos, version = EXCLUDED.version;\n`;
  }

  sqlOutput += `\n-- 4. PREGUNTAS\n`;
  for (const p of preguntas) {
    const opcStr = JSON.stringify(p.opciones || []).replace(/'/g, "''");
    const rc = p.respuesta_critica ? `'${p.respuesta_critica.replace(/'/g, "''")}'` : 'NULL';
    sqlOutput += `INSERT INTO pregunta (id, cuestionario_id, codigo, texto, tipo, opciones, dimension_id, version, orden, respuesta_critica) VALUES ('${p.id}', '${p.cuestionario_id}', '${p.codigo}', '${p.texto.replace(/'/g, "''")}', '${p.tipo}', '${opcStr}'::jsonb, '${p.dimension_id}', ${p.version}, ${p.orden || 1}, ${rc}) ON CONFLICT (id) DO UPDATE SET texto = EXCLUDED.texto, tipo = EXCLUDED.tipo, opciones = EXCLUDED.opciones, dimension_id = EXCLUDED.dimension_id, orden = EXCLUDED.orden;\n`;
  }

  sqlOutput += `\n-- 5. ASIGNACIONES\n`;
  for (const a of asignaciones) {
    const compStr = a.completado_en ? `'${a.completado_en.toISOString()}'` : 'NULL';
    sqlOutput += `INSERT INTO asignacion (id, cuestionario_id, token, tipo_sujeto, identificador_sujeto, muestra_esperada, estado, completado_en, guardado_parcial) VALUES ('${a.id}', '${a.cuestionario_id}', '${a.token}', '${a.tipo_sujeto}', '${a.identificador_sujeto.replace(/'/g, "''")}', ${a.muestra_esperada || 1}, '${a.estado}', ${compStr}, ${a.guardado_parcial || false}) ON CONFLICT (token) DO UPDATE SET estado = EXCLUDED.estado, completado_en = EXCLUDED.completado_en, guardado_parcial = EXCLUDED.guardado_parcial;\n`;
  }

  sqlOutput += `\n-- 6. RESPUESTAS\n`;
  for (const r of respuestas) {
    const valStr = JSON.stringify(r.valor).replace(/'/g, "''");
    sqlOutput += `INSERT INTO respuesta (id, asignacion_id, pregunta_id, valor, creado_en, actualizado_en) VALUES ('${r.id}', '${r.asignacion_id}', '${r.pregunta_id}', '${valStr}'::jsonb, '${r.creado_en.toISOString()}', '${r.actualizado_en.toISOString()}') ON CONFLICT (id) DO UPDATE SET valor = EXCLUDED.valor, actualizado_en = EXCLUDED.actualizado_en;\n`;
  }

  sqlOutput += `\nCOMMIT;\n`;

  const target = path.join(__dirname, 'backup_descubrimiento_completo.sql');
  fs.writeFileSync(target, sqlOutput, 'utf-8');
  console.log(`✅ Archivo SQL generado exitosamente: ${target}`);
  await sql.end();
}

exportSql().catch(console.error);
