import type { APIRoute } from 'astro';
import { sql } from '../../lib/db';

// A5: Regex para validar formato UUID v4
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// A5: Límite máximo de tamaño del payload (100 KB)
const MAX_PAYLOAD_SIZE = 100_000;

export const POST: APIRoute = async ({ request }) => {
  try {
    // A5: Validar Content-Length antes de parsear
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_PAYLOAD_SIZE) {
      return new Response(JSON.stringify({ error: 'Payload demasiado grande.' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const rawText = await request.text();

    // A5: Validar tamaño del body real
    if (rawText.length > MAX_PAYLOAD_SIZE) {
      return new Response(JSON.stringify({ error: 'Payload demasiado grande.' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let body: any;
    try {
      body = JSON.parse(rawText);
    } catch {
      return new Response(JSON.stringify({ error: 'JSON inválido.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { token, respuestas, completar, sesionId, deviceId, fingerprint } = body;

    // A5: Validación de tipos y estructura
    if (!token || typeof token !== 'string') {
      return new Response(JSON.stringify({ error: 'Token es requerido y debe ser un string.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!sesionId || typeof sesionId !== 'string') {
      return new Response(JSON.stringify({ error: 'sesionId es requerido y debe ser un string.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!respuestas || !Array.isArray(respuestas)) {
      return new Response(JSON.stringify({ error: 'respuestas debe ser un array.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // A5: Limitar cantidad de respuestas por request
    if (respuestas.length > 500) {
      return new Response(JSON.stringify({ error: 'Demasiadas respuestas en un solo envío.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Obtener la asignación (solo columnas necesarias en lugar de SELECT *)
    const [asignacion] = await sql`
      SELECT id, cuestionario_id, token, tipo_sujeto, completado_en, estado, muestra_esperada
      FROM asignacion WHERE token = ${token}
    `;

    if (!asignacion) {
      return new Response(JSON.stringify({ error: 'Asignación no encontrada.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // M3: Bloquear guardado si la asignación está en estado BORRADOR
    if (asignacion.estado === 'BORRADOR') {
      return new Response(JSON.stringify({ error: 'Esta asignación está en modo borrador y no acepta respuestas.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Si es individual y ya se completó, bloquear
    if (asignacion.tipo_sujeto === 'INDIVIDUAL' && asignacion.completado_en) {
      return new Response(JSON.stringify({ error: 'Investigación ya completada previamente.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // A5: Obtener IDs de preguntas válidas del cuestionario para validación cruzada
    const preguntasValidas = await sql`
      SELECT id FROM pregunta WHERE cuestionario_id = ${asignacion.cuestionario_id}
    `;
    const preguntaIdsValidos = new Set(preguntasValidas.map(p => p.id));

    // A5: Filtrar y validar cada respuesta
    const respuestasValidadas = respuestas.filter(resp => {
      if (!resp || typeof resp !== 'object') return false;
      if (!resp.preguntaId || typeof resp.preguntaId !== 'string') return false;
      if (!UUID_REGEX.test(resp.preguntaId)) return false;
      // Verificar que la pregunta pertenece al cuestionario de esta asignación
      if (!preguntaIdsValidos.has(resp.preguntaId)) return false;
      return true;
    });

    // 3. Procesar las respuestas validadas
    // Usamos una transacción para garantizar integridad de datos
    await sql.begin(async (sqlTrans) => {
      for (const resp of respuestasValidadas) {
        const { preguntaId, valor } = resp;

        // A5: Sanitizar deviceId y fingerprint (limitar longitud)
        const safeDeviceId = typeof deviceId === 'string' ? deviceId.slice(0, 100) : 'unknown';
        const safeFingerprint = typeof fingerprint === 'string' ? fingerprint.slice(0, 100) : 'unknown';

        // Estructuramos el valor final de la respuesta incluyendo la sesión, dispositivo y huella
        const finalSesionId = asignacion.tipo_sujeto === 'INDIVIDUAL' ? 'individual' : sesionId.slice(0, 100);
        const valorEstructurado = {
          respuesta: valor,
          sesionId: finalSesionId,
          deviceId: safeDeviceId,
          fingerprint: safeFingerprint,
          // M3: Marcar si la respuesta proviene de una sesión de prueba
          esTest: asignacion.estado === 'TEST',
        };

        // Guardado atómico usando ON CONFLICT para evitar condiciones de carrera y duplicados
        await sqlTrans`
          INSERT INTO respuesta (asignacion_id, pregunta_id, valor)
          VALUES (${asignacion.id}, ${preguntaId}, ${sqlTrans.json(valorEstructurado)})
          ON CONFLICT (asignacion_id, pregunta_id, (COALESCE(valor->>'sesionId', '')))
          DO UPDATE SET 
            valor = EXCLUDED.valor,
            actualizado_en = CURRENT_TIMESTAMP
        `;
      }

      // 4. Actualizar estado de completado en la asignación
      if (completar) {
        if (asignacion.tipo_sujeto === 'INDIVIDUAL') {
          // Individual se marca como finalizada, se inhabilita para futuros accesos y pasa a COMPLETADO
          await sqlTrans`
            UPDATE asignacion 
            SET completado_en = CURRENT_TIMESTAMP, guardado_parcial = FALSE, estado = 'COMPLETADO'
            WHERE id = ${asignacion.id}
          `;
        } else {
          // Grupal no se inhabilita porque otros colaboradores deben poder usarla.
          // Verificamos si alcanzamos la muestra esperada para marcar como COMPLETADO.
          const sesionesCountRes = await sqlTrans`
            SELECT COUNT(DISTINCT valor->>'sesionId') as total
            FROM respuesta
            WHERE asignacion_id = ${asignacion.id}
          `;
          const completadosGrupal = parseInt(sesionesCountRes[0].total || '0');
          // Ya que acabamos de registrar una nueva respuesta, 'completadosGrupal' ya incluye esta sesión.
          const nuevoEstado = completadosGrupal >= (asignacion.muestra_esperada || 1) ? 'COMPLETADO' : asignacion.estado;

          await sqlTrans`
            UPDATE asignacion 
            SET completado_en = COALESCE(completado_en, CURRENT_TIMESTAMP), guardado_parcial = FALSE, estado = ${nuevoEstado}
            WHERE id = ${asignacion.id}
          `;
        }
      } else {
        // Si no se completa pero se guardan datos parciales
        await sqlTrans`
          UPDATE asignacion 
          SET guardado_parcial = TRUE
          WHERE id = ${asignacion.id}
        `;
      }
    });

    return new Response(JSON.stringify({ success: true, message: 'Respuestas procesadas correctamente.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error al guardar respuestas:', error);
    // A4: No exponer detalles internos del error
    return new Response(JSON.stringify({ error: 'Error interno del servidor al procesar el guardado.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
