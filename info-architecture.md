# Arquitectura de la Información (Information Architecture) - FASE 4
## Sistema de Levantamiento Estratégico de Información - Grupo RunaFoto

Este documento describe la estructura lógica de los datos, el mapeo de relaciones entre las entidades del sistema y las interfaces de TypeScript que servirán como contrato de datos único en el código de la aplicación.

---

## 1. FLUJO Y JERARQUÍA DE INFORMACIÓN

Los datos del sistema se estructuran jerárquicamente de la siguiente forma para soportar la reusabilidad en el tiempo (múltiples hitos o diagnósticos organizacionales):

```
Hito (Campaña de Diagnóstico, ej: Descubrimiento 2026)
└── Cuestionario (Específico de un rol o departamento, ej: Ventas)
    ├── Asignación (Enlace dinámico de acceso con token único)
    │   └── Respuesta (Instancia de respuesta asociada al cuestionario del colaborador/grupo)
    └── Pregunta (Pregunta estructurada vinculada a una Dimensión)
        └── Respuesta (Valor registrado por el usuario)
```

### Relaciones clave:
1.  **Hito a Cuestionario (1:N):** Un hito (diagnóstico de 15 días) agrupa varios cuestionarios por rol.
2.  **Cuestionario a Pregunta (1:N):** Un cuestionario se compone de múltiples preguntas ordenadas secuencialmente.
3.  **Cuestionario a Asignación (1:N):** Para un mismo cuestionario, se pueden generar múltiples enlaces/asignaciones (ej: una asignación individual para Douglas, y una asignación grupal para el equipo de producción).
4.  **Asignación a Respuesta (1:N):** Una asignación almacena las respuestas que va completando el colaborador (o colaboradores si es grupal) para cada una de las preguntas del cuestionario.

---

## 2. INTERFACES DE TYPESCRIPT (src/types/index.ts)

A continuación se definen los tipos e interfaces que gobernarán el código de la aplicación. No se incluye lógica de persistencia ni manipulación en esta fase, únicamente la definición del esquema de tipado.

```typescript
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
```

---

## 3. JUSTIFICACIÓN DE LA ARQUITECTURA DE INFORMACIÓN
1.  **Escalabilidad e Historial (Versionado):** La propiedad `version` y la auto-referencia `preguntaPadreId` en la interfaz `Pregunta` resuelven la necesidad crítica de rastrear mejoras de preguntas en cuestionarios a futuro. Si en el Hito 2 mejoramos la pregunta P1 (para hacerla más simple de responder), el sistema puede mapear que `P1_v2` proviene de `P1_v1`, permitiendo comparar resultados de forma histórica sin romper bases de datos antiguas.
2.  **Flexibilidad de Selección Persona/Grupo:** La interfaz `Asignacion` encapsula la lógica solicitada para modelar si una encuesta es para un individuo o departamento. Si `tipoSujeto === 'GRUPAL'`, el backend de persistencia permite registrar múltiples respuestas de diferentes colaboradores bajo el mismo token e identificador del área, consolidando la analítica en lugar de individualizar el reporte.
3.  **Uso de JSONB en Base de Datos Postgres:** La propiedad `valor` en la interfaz `Respuesta` y `opciones` en `Pregunta` se definen con tipo flexible `any` o `Record` para mapear directamente al tipo nativo `JSONB` de Postgres. Esto permite cambios ágiles en el formato de respuesta (ej: un simple string de opción única, un array ordenado para arrastre, o un número de conteo) sin requerir migraciones estructurales de la base de datos.
4.  **Dimensiones Estratégicas Dinámicas:** Al transformar `DimensionEstrategica` de un tipo literal numérico estático a una interfaz `Dimension` basada en identificadores únicos guardados en base de datos/JSON, garantizamos la escalabilidad futura de la plataforma. Si en próximos cuestionarios se desea analizar dimensiones como *Cultura Organizacional* o *Adopción Tecnológica*, éstas pueden ser creadas de manera dinámica sin necesidad de reescribir código en el frontend o backend.

