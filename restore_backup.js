import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbUrl = process.env.DATABASE_URL || 'postgresql://runafoto_user:runafoto_secure_password_2026@localhost:5433/runafoto_cuestionarios';
const sql = postgres(dbUrl);

async function restore() {
  const jsonPath = path.join(__dirname, 'backup_descubrimiento_completo.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ No se encontró el archivo backup_descubrimiento_completo.json');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`Restaurando ${data.hitos.length} hitos, ${data.cuestionarios.length} cuestionarios y ${data.respuestas.length} respuestas...`);

  await sql.begin(async (sqlTrans) => {
    // 1. Hitos
    for (const h of data.hitos) {
      await sqlTrans`
        INSERT INTO hito (id, nombre, fecha_inicio, fecha_fin, activo)
        VALUES (${h.id}, ${h.nombre}, ${h.fecha_inicio}, ${h.fecha_fin}, ${h.activo})
        ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, activo = EXCLUDED.activo
      `;
    }

    // 2. Dimensiones
    for (const d of data.dimensiones) {
      await sqlTrans`
        INSERT INTO dimension (id, hito_id, codigo, nombre, descripcion, color)
        VALUES (${d.id}, ${d.hito_id}, ${d.codigo}, ${d.nombre}, ${d.descripcion}, ${d.color})
        ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion, color = EXCLUDED.color
      `;
    }

    // 3. Cuestionarios
    for (const c of data.cuestionarios) {
      await sqlTrans`
        INSERT INTO cuestionario (id, hito_id, nombre, descripcion, version, metadatos)
        VALUES (${c.id}, ${c.hito_id}, ${c.nombre}, ${c.descripcion}, ${c.version}, ${sqlTrans.json(c.metadatos || {})})
        ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion, metadatos = EXCLUDED.metadatos, version = EXCLUDED.version
      `;
    }

    // 4. Preguntas
    for (const p of data.preguntas) {
      await sqlTrans`
        INSERT INTO pregunta (id, cuestionario_id, codigo, texto, tipo, opciones, dimension_id, version, orden, respuesta_critica)
        VALUES (${p.id}, ${p.cuestionario_id}, ${p.codigo}, ${p.texto}, ${p.tipo}, ${sqlTrans.json(p.opciones)}, ${p.dimension_id}, ${p.version}, ${p.orden}, ${p.respuesta_critica})
        ON CONFLICT (id) DO UPDATE SET texto = EXCLUDED.texto, tipo = EXCLUDED.tipo, opciones = EXCLUDED.opciones, dimension_id = EXCLUDED.dimension_id, orden = EXCLUDED.orden
      `;
    }

    // 5. Asignaciones
    for (const a of data.asignaciones) {
      await sqlTrans`
        INSERT INTO asignacion (id, cuestionario_id, token, tipo_sujeto, identificador_sujeto, muestra_esperada, estado, completado_en, guardado_parcial)
        VALUES (${a.id}, ${a.cuestionario_id}, ${a.token}, ${a.tipo_sujeto}, ${a.identificador_sujeto}, ${a.muestra_esperada}, ${a.estado}, ${a.completado_en}, ${a.guardado_parcial})
        ON CONFLICT (token) DO UPDATE SET estado = EXCLUDED.estado, completado_en = EXCLUDED.completado_en, guardado_parcial = EXCLUDED.guardado_parcial
      `;
    }

    // 6. Respuestas
    for (const r of data.respuestas) {
      await sqlTrans`
        INSERT INTO respuesta (id, asignacion_id, pregunta_id, valor, creado_en, actualizado_en)
        VALUES (${r.id}, ${r.asignacion_id}, ${r.pregunta_id}, ${sqlTrans.json(r.valor)}, ${r.creado_en}, ${r.actualizado_en})
        ON CONFLICT (id) DO UPDATE SET valor = EXCLUDED.valor, actualizado_en = EXCLUDED.actualizado_en
      `;
    }
  });

  console.log('✅ Restauración completa y exitosa de todos los datos históricos.');
  await sql.end();
}

restore().catch(console.error);
