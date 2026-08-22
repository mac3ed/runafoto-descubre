import type { APIRoute } from 'astro';
import { sql } from '../../lib/db';
import { validateSession } from '../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  // 1. Validar la sesión del administrador
  const session = await validateSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { hitoId, temas } = await request.json();
    if (!hitoId || !temas) {
      return new Response(JSON.stringify({ error: 'Hito ID y temas son requeridos.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Actualizar los temas en el diagnóstico
    await sql`
      UPDATE diagnostico_inteligente
      SET analisis_temas = ${JSON.stringify(temas)}::jsonb,
          actualizado_at = CURRENT_TIMESTAMP
      WHERE hito_id = ${hitoId}
    `;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error al guardar temas manuales:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
