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
    const { hitoId, instruccionesEnfoque = '' } = await request.json();
    if (!hitoId) {
      return new Response(JSON.stringify({ error: 'Hito ID es requerido.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Obtener la clave API desde las variables de entorno
    const apiKey = import.meta.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'La clave de procesamiento no está configurada.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Obtener todas las respuestas cuantitativas y cualitativas del hito
    const respuestas = await sql`
      SELECT 
        r.valor, 
        p.codigo as pregunta_codigo, 
        p.texto as pregunta_texto, 
        p.tipo as pregunta_tipo,
        c.nombre as cuestionario_nombre, 
        a.identificador_sujeto, 
        d.id as dimension_id,
        d.nombre as dimension_nombre
      FROM respuesta r
      JOIN pregunta p ON r.pregunta_id = p.id
      JOIN cuestionario c ON p.cuestionario_id = c.id
      JOIN asignacion a ON r.asignacion_id = a.id
      JOIN dimension d ON p.dimension_id = d.id
      WHERE c.hito_id = ${hitoId} AND (a.estado = 'LANZADO' OR a.estado = 'COMPLETADO')
    `;

    if (respuestas.length === 0) {
      return new Response(JSON.stringify({ error: 'No hay respuestas suficientes para realizar el análisis en este Hito.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Agrupar y anonimizar datos para el prompt
    const respuestasParaProcesar = respuestas.map(r => {
      // Desempacar el valor de la respuesta
      const ansVal = r.valor?.respuesta;
      return {
        dimension: r.dimension_nombre,
        dimension_id: r.dimension_id,
        rol: r.cuestionario_nombre,
        sujeto: r.identificador_sujeto,
        pregunta: r.pregunta_texto,
        respuesta: Array.isArray(ansVal) ? ansVal.join('; ') : String(ansVal ?? '')
      };
    });

    // 5. Inyectar directrices de enfoque opcionales si las provee el consultor
    let instruccionesEnfoquePrompt = '';
    if (instruccionesEnfoque && instruccionesEnfoque.trim() !== '') {
      instruccionesEnfoquePrompt = `
DIRECTRICES DE ENFOQUE ESPECÍFICAS (DEFINIDAS POR EL CONSULTOR):
El consultor estratégico ha definido que este análisis debe orientarse y priorizar bajo las siguientes pautas:
"${instruccionesEnfoque}"
Asegúrate de estructurar el análisis general, el sentimiento y los temas detectados siguiendo estrictamente esta dirección.
`;
    }

    // 6. Construir prompt estructurado
    const promptText = `
Eres un analista experto en diagnósticos organizacionales y descubrimientos estratégicos. Tu objetivo es procesar las respuestas recolectadas del diagnóstico empresarial de este Hito y generar un reporte analítico consolidado y de alta calidad para el consultor.
${instruccionesEnfoquePrompt}

DATOS DEL DIAGNÓSTICO:
${JSON.stringify(respuestasParaProcesar)}

INSTRUCCIONES DE RESPUESTA:
Debes responder ÚNICAMENTE con un objeto JSON válido que cumpla estrictamente con la siguiente estructura. No incluyas explicaciones adicionales, introducciones ni bloques de código markdown (\`\`\`json). Todo el texto en el JSON debe ser redactado en español. No uses palabras como "IA", "inteligencia artificial" o "Gemini" en la respuesta.

Estructura JSON requerida:
{
  "resumen": "Escribe un análisis de resultados profundo y estratégico estructurado OBLIGATORIAMENTE por puntos principales, viñetas y subviñetas detalladas (usando guiones '-' y asteriscos '*' con indentación). El resumen debe dividirse en 4 secciones clave adaptables según el tipo de Hito analizado:
- 1. METODOLOGÍA Y TENDENCIA GENERAL: Referencia al hito/investigación actual, dimensiones implicadas y estimaciones cualitativas o generalizaciones cuantitativas (ej. tasas de participación, niveles de alineación global).
- 2. DIAGNÓSTICO DE CLIMA LABORAL, COMUNICACIÓN Y CULTURA: Análisis detallado del ambiente organizacional, relaciones entre equipos, comunicación vertical/horizontal y factores culturales o motivadores clave extraídos de las respuestas.
- 3. MADUREZ DIGITAL Y HERRAMIENTAS DE TRABAJO: Evaluación de la infraestructura tecnológica actual, idoneidad de los recursos asignados y brechas digitales identificadas en el equipo.
- 4. FUGAS DE VALOR Y OPORTUNIDADES CRÍTICAS: Identificación de ineficiencias operacionales, cuellos de botella, riesgos de merma o desalineación estratégica, y propuestas de solución directas sugeridas por los colaboradores.
Usa un tono formal, profesional, empático y de consultoría de negocio de alto nivel. Extrae siempre los patrones reales presentes en los datos, adaptando las temáticas a la naturaleza específica del hito evaluado.",
  "sentimiento": [
    {
      "dimension_id": "ID_DE_LA_DIMENSION", // Debe ser el ID de dimensión exacto recibido en los datos (ej: 'negocio_crecimiento', 'comercial', 'operaciones', 'informacion', 'organizacion', 'tecnologia_automatizacion')
      "polaridad": 0.2, // Puntuación numérica entre -1.0 (mucha fricción/desalineación) y +1.0 (excelente/alineado)
      "motivos": "Breve explicación de los factores cuantitativos y cualitativos que influyen en esta puntuación de polaridad semántica."
    }
  ],
  "temas": [
    {
      "titulo": "Título breve del Punto de Dolor u Oportunidad clave detectada",
      "descripcion": "Descripción explicativa del hallazgo, por qué es crítico y sus implicaciones para el negocio.",
      "citas": ["Frase o cita relevante tomada textualmente de las respuestas cualitativas de los colaboradores (máximo 2)"],
      "frecuencia": 65, // Porcentaje numérico estimado (0 a 100) que representa qué tan extendido está este patrón/comentario en las respuestas del equipo
      "impacto": 4, // Nivel de gravedad o impacto estimado para el negocio en una escala del 1 (muy bajo) al 5 (crítico)
      "nivel_calor": "critico" // Nivel de calor o prioridad urgente. Debe ser exactamente uno de estos valores: "bajo", "medio", "alto" o "critico"
    }
  ]
}
`;

    // 7. Hacer la llamada HTTPS directa con fallback de modelos
    const modelsToTry = ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-flash-lite-latest'];
    let generatedText = '';
    let lastErrorMsg = '';

    for (const model of modelsToTry) {
      console.log(`Intentando procesar datos con el modelo: ${model}`);
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      try {
        const apiResponse = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: promptText
                  }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        });

        if (apiResponse.ok) {
          const resJson = await apiResponse.json();
          generatedText = resJson.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (generatedText) {
            console.log(`Procesamiento completado exitosamente con el modelo: ${model}`);
            break;
          }
        } else {
          const errText = await apiResponse.text();
          console.error(`Error con modelo ${model}:`, errText);
          lastErrorMsg = errText;
        }
      } catch (err: any) {
        console.error(`Excepción con modelo ${model}:`, err);
        lastErrorMsg = err.message || String(err);
      }
    }

    if (!generatedText) {
      return new Response(JSON.stringify({ error: `El motor de procesamiento no pudo consolidar la solicitud. Detalles: ${lastErrorMsg}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 8. Parsear e insertar/actualizar el diagnóstico en la base de datos
    let parsedAnalysis: any;
    try {
      parsedAnalysis = JSON.parse(generatedText.trim());
    } catch (parseError) {
      console.error('Error al parsear JSON generado:', generatedText);
      return new Response(JSON.stringify({ error: 'La respuesta consolidada no tiene un formato válido.' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { resumen = '', sentimiento = [], temas = [] } = parsedAnalysis || {};

    await sql`
      INSERT INTO diagnostico_inteligente (hito_id, analisis_resumen, analisis_sentimiento, analisis_temas, instrucciones_enfoque, actualizado_at)
      VALUES (${hitoId}, ${resumen}, ${JSON.stringify(sentimiento)}::jsonb, ${JSON.stringify(temas)}::jsonb, ${instruccionesEnfoque}, CURRENT_TIMESTAMP)
      ON CONFLICT (hito_id)
      DO UPDATE SET
        analisis_resumen = EXCLUDED.analisis_resumen,
        analisis_sentimiento = EXCLUDED.analisis_sentimiento,
        analisis_temas = EXCLUDED.analisis_temas,
        instrucciones_enfoque = EXCLUDED.instrucciones_enfoque,
        actualizado_at = CURRENT_TIMESTAMP
    `;

    return new Response(JSON.stringify({
      success: true,
      resumen,
      sentimiento,
      temas,
      instruccionesEnfoque
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error en analyze-data endpoint:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor de procesamiento.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
