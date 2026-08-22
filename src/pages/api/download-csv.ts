import type { APIRoute } from 'astro';
import { sql } from '../../lib/db';
import { validateSession } from '../../lib/auth';

export const GET: APIRoute = async ({ request, cookies }) => {
  // 1. Validar la sesión del administrador
  const session = await validateSession(cookies);
  if (!session) {
    return new Response('No autorizado', { status: 401 });
  }

  const url = new URL(request.url);
  const hitoId = url.searchParams.get('hitoId');

  if (!hitoId) {
    return new Response('Hito ID no especificado', { status: 400 });
  }

  try {
    // 2. Obtener datos del Hito
    const [hito] = await sql`
      SELECT id, nombre, fecha_inicio, fecha_fin, activo
      FROM hito 
      WHERE id = ${hitoId}
    `;

    if (!hito) {
      return new Response('Hito no encontrado', { status: 404 });
    }

    // 3. Obtener dimensiones
    const dimensiones = await sql`
      SELECT id, codigo, nombre, descripcion 
      FROM dimension 
      ORDER BY codigo
    `;

    // 4. Obtener preguntas de este hito
    const preguntas = await sql`
      SELECT p.id, p.codigo, p.texto, p.tipo, p.opciones, p.dimension_id, c.nombre as cuestionario_nombre
      FROM pregunta p
      JOIN cuestionario c ON p.cuestionario_id = c.id
      WHERE c.hito_id = ${hitoId}
    `;

    // 5. Obtener todas las asignaciones y sus respuestas
    const asignaciones = await sql`
      SELECT 
        a.id as asignacion_id,
        a.identificador_sujeto,
        a.estado as asignacion_estado,
        c.nombre as cuestionario_nombre
      FROM asignacion a
      JOIN cuestionario c ON a.cuestionario_id = c.id
      WHERE c.hito_id = ${hitoId}
    `;

    const respuestas = await sql`
      SELECT 
        r.id as respuesta_id,
        r.asignacion_id,
        r.pregunta_id,
        r.valor,
        r.creado_en as respuesta_creado_at
      FROM respuesta r
      JOIN pregunta p ON r.pregunta_id = p.id
      JOIN cuestionario c ON p.cuestionario_id = c.id
      WHERE c.hito_id = ${hitoId}
    `;

    // 6. Obtener diagnóstico inteligente (IA / Resultados Semánticos)
    const [diagnostico] = await sql`
      SELECT analisis_resumen, analisis_sentimiento, analisis_temas 
      FROM diagnostico_inteligente 
      WHERE hito_id = ${hitoId}
    `;

    // Parsear sentimientos del diagnóstico inteligente
    let sentimientosMap: Record<string, { polaridad: number; motivos: string }> = {};
    if (diagnostico && diagnostico.analisis_sentimiento) {
      try {
        const sentiments = Array.isArray(diagnostico.analisis_sentimiento)
          ? diagnostico.analisis_sentimiento
          : JSON.parse(String(diagnostico.analisis_sentimiento));
        
        sentiments.forEach((s: any) => {
          if (s.dimension_id) {
            sentimientosMap[s.dimension_id] = {
              polaridad: typeof s.polaridad === 'number' ? s.polaridad : 0,
              motivos: s.motivos || ''
            };
          }
        });
      } catch (e) {
        console.error('Error parseando polaridad del diagnóstico:', e);
      }
    }

    // 7. Lógica de cálculo de promedios cuantitativos y brechas
    const safeParseOptions = (optsVal: any): string[] => {
      if (!optsVal) return [];
      if (Array.isArray(optsVal)) return optsVal;
      try {
        return JSON.parse(String(optsVal));
      } catch {
        return [];
      }
    };

    const calculateAnswerScore = (val: any, opcionesJson: any): number | null => {
      if (val === undefined || val === null) return null;
      const strVal = String(val).trim().toLowerCase();
      
      if (strVal === 'sí' || strVal === 'si' || strVal === 'verdadero' || strVal === 'true') return 100;
      if (strVal === 'no' || strVal === 'falso' || strVal === 'false') return 0;
      
      const opciones = safeParseOptions(opcionesJson);
      if (opciones && opciones.length > 1) {
        const idx = opciones.findIndex(o => o.trim().toLowerCase() === strVal);
        if (idx !== -1) {
          const firstOpt = opciones[0].toLowerCase();
          const isDesc = firstOpt.includes('excelente') || firstOpt.includes('bueno') || firstOpt.includes('alto') || firstOpt.includes('sí') || firstOpt.includes('si') || firstOpt.includes('óptimo') || firstOpt.includes('correcto');
          if (isDesc) {
            return Math.round(((opciones.length - 1 - idx) / (opciones.length - 1)) * 100);
          } else {
            return Math.round((idx / (opciones.length - 1)) * 100);
          }
        }
      }
      return null;
    };

    // Calcular promedios por dimensión
    const brechasPorDimension: Record<string, { avgDir: number | null; avgOp: number | null; brecha: number | null }> = {};
    
    dimensiones.forEach(dim => {
      const respuestasDim = respuestas.filter(r => {
        const q = preguntas.find(p => p.id === r.pregunta_id);
        return q && q.dimension_id === dim.id;
      });

      const respuestasDir = respuestasDim.filter(r => {
        const asig = asignaciones.find(a => a.asignacion_id === r.asignacion_id);
        if (!asig) return false;
        const name = asig.identificador_sujeto.toLowerCase();
        const rol = asig.cuestionario_nombre.toLowerCase();
        return name.includes('douglas') || name.includes('betty') || name.includes('karla') || name.includes('yeri') || name.includes('dirección') || name.includes('administracion') || rol.includes('dirección') || rol.includes('administración');
      });

      const respuestasOp = respuestasDim.filter(r => {
        const asig = asignaciones.find(a => a.asignacion_id === r.asignacion_id);
        if (!asig) return false;
        const name = asig.identificador_sujeto.toLowerCase();
        const rol = asig.cuestionario_nombre.toLowerCase();
        return !(name.includes('douglas') || name.includes('betty') || name.includes('karla') || name.includes('yeri') || name.includes('dirección') || name.includes('administracion') || rol.includes('dirección') || rol.includes('administración'));
      });

      const getAverage = (list: any[]) => {
        let sum = 0;
        let count = 0;
        list.forEach(r => {
          const q = preguntas.find(p => p.id === r.pregunta_id);
          const score = calculateAnswerScore(r.valor?.respuesta, q?.opciones);
          if (score !== null) {
            sum += score;
            count++;
          }
        });
        return count > 0 ? Math.round(sum / count) : null;
      };

      const avgDir = getAverage(respuestasDir);
      const avgOp = getAverage(respuestasOp);
      const brecha = (avgDir !== null && avgOp !== null) ? (avgDir - avgOp) : null;

      brechasPorDimension[dim.id] = { avgDir, avgOp, brecha };
    });

    // 8. Construcción del CSV
    const headers = [
      'HITO_ID',
      'HITO_CODIGO',
      'HITO_NOMBRE',
      'HITO_DESCRIPCION',
      'HITO_CREADO_AT',
      'COLABORADOR_SUJETO',
      'CUESTIONARIO_ROL',
      'ASIGNACION_ESTADO',
      'FECHA_RESPUESTA',
      'DISPOSITIVO_ID',
      'SESION_ID',
      'DIMENSION_CODIGO',
      'DIMENSION_NOMBRE',
      'PREGUNTA_CODIGO',
      'PREGUNTA_TEXTO',
      'PREGUNTA_TIPO',
      'RESPUESTA_COLABORADOR',
      'RESPUESTA_PUNTAJE_0_100',
      'GRUPO_CLASIFICACION',
      'DIMENSION_AVG_DIRECCION',
      'DIMENSION_AVG_OPERACIONES',
      'DIMENSION_BRECHA',
      'ANALISIS_RESUMEN_HITO',
      'ANALISIS_POLARIDAD_DIMENSION',
      'ANALISIS_MOTIVOS_POLARIDAD'
    ];

    const escapeCSV = (val: any): string => {
      if (val === undefined || val === null) return '""';
      let str = String(val).trim();
      // Duplicar comillas dobles
      str = str.replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvRows = [headers.join(',')];

    // Para cada asignación (colaborador), vamos a generar filas para todas sus respuestas
    asignaciones.forEach(asig => {
      const respuestasAsig = respuestas.filter(r => r.asignacion_id === asig.asignacion_id);
      
      const nameLower = asig.identificador_sujeto.toLowerCase();
      const rolLower = asig.cuestionario_nombre.toLowerCase();
      const grupo = (nameLower.includes('douglas') || nameLower.includes('betty') || nameLower.includes('karla') || nameLower.includes('yeri') || nameLower.includes('dirección') || nameLower.includes('administracion') || rolLower.includes('dirección') || rolLower.includes('administración'))
        ? 'DIRECCIÓN'
        : 'OPERACIONES';

      if (respuestasAsig.length === 0) {
        // Asignación sin respuestas aún (pendiente o lanzada sin responder)
        const row = [
          escapeCSV(hito.id),
          escapeCSV('N/A'),
          escapeCSV(hito.nombre),
          escapeCSV('N/A'),
          escapeCSV(hito.fecha_inicio),
          escapeCSV(asig.identificador_sujeto),
          escapeCSV(asig.cuestionario_nombre),
          escapeCSV(asig.asignacion_estado),
          escapeCSV(null), // fecha_respuesta
          escapeCSV(null), // dispositivo_id
          escapeCSV(null), // sesion_id
          escapeCSV(null), // dim_codigo
          escapeCSV(null), // dim_nombre
          escapeCSV(null), // preg_codigo
          escapeCSV(null), // preg_texto
          escapeCSV(null), // preg_tipo
          escapeCSV(null), // respuesta_colaborador
          escapeCSV(null), // puntaje
          escapeCSV(grupo),
          escapeCSV(null), // avgDir
          escapeCSV(null), // avgOp
          escapeCSV(null), // brecha
          escapeCSV(diagnostico?.analisis_resumen),
          escapeCSV(null), // polaridad
          escapeCSV(null)  // motivos
        ];
        csvRows.push(row.join(','));
      } else {
        respuestasAsig.forEach(resp => {
          const preg = preguntas.find(p => p.id === resp.pregunta_id);
          const dim = preg ? dimensiones.find(d => d.id === preg.dimension_id) : null;
          
          const ansText = Array.isArray(resp.valor?.respuesta)
            ? resp.valor.respuesta.join(' > ')
            : String(resp.valor?.respuesta ?? '');
            
          const puntaje = preg ? calculateAnswerScore(resp.valor?.respuesta, preg.opciones) : null;
          
          const dimBrecha = dim ? brechasPorDimension[dim.id] : null;
          const dimSemantico = dim ? sentimientosMap[dim.id] : null;

          const row = [
            escapeCSV(hito.id),
            escapeCSV('N/A'),
            escapeCSV(hito.nombre),
            escapeCSV('N/A'),
            escapeCSV(hito.fecha_inicio),
            escapeCSV(asig.identificador_sujeto),
            escapeCSV(asig.cuestionario_nombre),
            escapeCSV(asig.asignacion_estado),
            escapeCSV(resp.respuesta_creado_at),
            escapeCSV(resp.valor?.deviceId),
            escapeCSV(resp.valor?.sesionId),
            escapeCSV(dim?.codigo),
            escapeCSV(dim?.nombre),
            escapeCSV(preg?.codigo),
            escapeCSV(preg?.texto),
            escapeCSV(preg?.tipo),
            escapeCSV(ansText),
            escapeCSV(puntaje),
            escapeCSV(grupo),
            escapeCSV(dimBrecha?.avgDir),
            escapeCSV(dimBrecha?.avgOp),
            escapeCSV(dimBrecha?.brecha),
            escapeCSV(diagnostico?.analisis_resumen),
            escapeCSV(dimSemantico?.polaridad),
            escapeCSV(dimSemantico?.motivos)
          ];
          csvRows.push(row.join(','));
        });
      }
    });

    // Añadir el UTF-8 BOM prefix
    const csvContent = '\uFEFF' + csvRows.join('\r\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="reporte_completo_hito_${String(hito.nombre).replace(/\s+/g, '_')}.csv"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('Error generating CSV:', error);
    return new Response('Error interno del servidor al generar el CSV', { status: 500 });
  }
};
