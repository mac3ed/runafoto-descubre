import type { APIRoute } from 'astro';
import { sql } from '../../lib/db';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return new Response(JSON.stringify({ error: 'Token es requerido.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1. Obtener la asignación y validar existencia
    const [asignacion] = await sql`
      SELECT id, cuestionario_id, token, tipo_sujeto, identificador_sujeto, completado_en, guardado_parcial, estado
      FROM asignacion WHERE token = ${token}
    `;

    if (!asignacion) {
      return new Response(JSON.stringify({ error: 'Token inválido o cuestionario no encontrado.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Si es individual y ya se completó, bloquear acceso
    if (asignacion.tipo_sujeto === 'INDIVIDUAL' && asignacion.completado_en) {
      return new Response(JSON.stringify({ error: 'Este cuestionario ya ha sido completado y enviado.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Obtener el cuestionario asociado
    const [cuestionario] = await sql`
      SELECT id, nombre, descripcion, version FROM cuestionario WHERE id = ${asignacion.cuestionario_id}
    `;

    if (!cuestionario) {
      return new Response(JSON.stringify({ error: 'Cuestionario no encontrado.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Obtener las preguntas del cuestionario ordenadas por 'orden'
    const preguntas = await sql`
      SELECT id, codigo, texto, tipo, opciones, dimension_id, version, pregunta_padre_id
      FROM pregunta 
      WHERE cuestionario_id = ${cuestionario.id}
      ORDER BY orden ASC
    `;

    // 5. Retornar los datos integrados
    return new Response(JSON.stringify({
      asignacion: {
        id: asignacion.id,
        token: asignacion.token,
        tipoSujeto: asignacion.tipo_sujeto,
        identificadorSujeto: asignacion.identificador_sujeto,
        completadoEn: asignacion.completado_en,
        guardadoParcial: asignacion.guardado_parcial,
      },
      cuestionario: {
        id: cuestionario.id,
        nombre: cuestionario.nombre,
        descripcion: cuestionario.descripcion,
        version: cuestionario.version,
      },
      preguntas: (() => {
        const safeParseOptions = (opciones: any): string[] => {
          if (!opciones) return [];
          if (Array.isArray(opciones)) return opciones;
          if (typeof opciones === 'string') {
            try {
              const parsed = JSON.parse(opciones);
              if (Array.isArray(parsed)) return parsed;
            } catch(e) {}
            return opciones.split(',').map((s: string) => s.trim()).filter(Boolean);
          }
          return [];
        };
        return preguntas.map(p => ({
          id: p.id,
          codigo: p.codigo,
          texto: p.texto,
          tipo: p.tipo,
          opciones: safeParseOptions(p.opciones),
          dimensionId: p.dimension_id,
          version: p.version,
          preguntaPadreId: p.pregunta_padre_id,
        }));
      })(),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error al obtener cuestionario:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
