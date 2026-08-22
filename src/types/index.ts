/**
 * Representa una Dimensión Estratégica dinámica definida en base de datos.
 * Esto permite añadir, modificar o remover dimensiones (Comercial, Operativa, etc.)
 * a futuro sin alterar la base del código.
 */
export interface Dimension {
  id: string; // Identificador único (ej: UUID o slug 'comercial')
  codigo: string; // Ej: "D1", "D2", "D3"
  nombre: string; // Ej: "Comercial"
  descripcion: string; // La pregunta o hipótesis principal de la dimensión
  color?: string; // Código HSL o Hex para representación en gráficos del dashboard
}

/**
 * Tipos de Pregunta soportados por el motor dinámico
 */
export type TipoPregunta = 'OPCION_MULTIPLE' | 'ORDEN' | 'CORTA' | 'BOOLEAN';

/**
 * Tipo de Sujeto evaluado en la Asignación
 * INDIVIDUAL: Cuestionario dirigido a una persona específica (enlace de un solo uso).
 * GRUPAL: Cuestionario para un departamento completo (enlace multi-respuesta consolidada).
 */
export type TipoSujeto = 'INDIVIDUAL' | 'GRUPAL';

/**
 * Representa una campaña o período de levantamiento de información (ej: 15 días de Descubrimiento)
 */
export interface Hito {
  id: string; // UUID v4
  nombre: string; // Ej: "Descubrimiento Organizacional 2026"
  fechaInicio: Date;
  fechaFin: Date;
  activo: boolean; // Solo un hito puede estar recopilando datos de forma activa en paralelo
}

/**
 * Plantilla de cuestionario asociada a un hito
 */
export interface Cuestionario {
  id: string; // UUID v4
  hitoId: string; // FK -> Hito.id
  nombre: string; // Ej: "Cuestionario de Ventas"
  descripcion: string; // Texto explicativo de confidencialidad
  version: number; // Historial de cuestionarios modificados a lo largo del tiempo
  metadatos?: Record<string, any>; // Campos extensibles (departamento, sector)
}

/**
 * Pregunta perteneciente a un Cuestionario
 */
export interface Pregunta {
  id: string; // UUID v4
  cuestionarioId: string; // FK -> Cuestionario.id
  codigo: string; // Ej: "P1", "L4", "P8"
  texto: string; // Enunciado de la pregunta
  tipo: TipoPregunta;
  opciones: string[] | Record<string, any>; // Lista de opciones en selección/ordenamiento
  dimensionId: string; // FK -> Dimension.id (Relación dinámica en lugar de tipo estático)
  version: number; // Historial de la pregunta (para comparar mejoras en el tiempo)
  preguntaPadreId?: string; // Auto-referencia para trazabilidad de mejoras de la misma pregunta
}

/**
 * Asignación de un Cuestionario a un Colaborador o Grupo mediante un link único
 */
export interface Asignacion {
  id: string; // UUID v4
  cuestionarioId: string; // FK -> Cuestionario.id
  token: string; // Token único seguro que viaja en la URL (/q/[token])
  tipoSujeto: TipoSujeto; // Switch Persona vs Grupo
  identificadorSujeto: string; // Ej: "Douglas" (Individual) o "Equipo de Producción" (Grupal)
  creadoEn: Date;
  completadoEn?: Date; // Si tiene fecha, el cuestionario se considera finalizado (si es Individual se bloquea)
  guardadoParcial: boolean; // Indica si tiene datos guardados en progreso
}

/**
 * Respuesta registrada por un usuario a una pregunta específica
 */
export interface Respuesta {
  id: string; // UUID v4
  asignacionId: string; // FK -> Asignacion.id
  preguntaId: string; // FK -> Pregunta.id
  valor: any; // Datos de la respuesta (string, number o array ordenado en JSON)
  creadoEn: Date;
  actualizadoEn?: Date;
}

/**
 * Estructura para el Dashboard de Administración
 */
export interface MetricasDimension {
  dimensionId: string; // FK -> Dimension.id
  totalPreguntas: number;
  totalRespuestas: number;
  indiceFriccion: number; // Mapeado de criticidad/fricción operativa en escala 0-100
}

export interface FugaDeValorReportada {
  codigoLinea: string; // Ej: "L4", "L7"
  descripcion: string;
  frecuencia: 'NUNCA' | 'POCAS_VECES' | 'FRECUENTEMENTE';
  impactoEstimado: 'BAJO' | 'MEDIO' | 'ALTO';
}
