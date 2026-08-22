-- Habilitar extensión para generar UUIDs si no está activa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla: Hito (Campañas de Cuestionarios)
CREATE TABLE IF NOT EXISTS hito (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_fin TIMESTAMP WITH TIME ZONE NOT NULL,
    activo BOOLEAN DEFAULT FALSE
);

-- Tabla: Dimension (Dimensiones Estratégicas dinámicas)
CREATE TABLE IF NOT EXISTS dimension (
    id VARCHAR(100) PRIMARY KEY, -- Ej: 'comercial', 'operativa', etc.
    hito_id UUID REFERENCES hito(id) ON DELETE CASCADE,
    codigo VARCHAR(20) NOT NULL UNIQUE, -- Ej: 'D1', 'D2', 'D3'
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    color VARCHAR(50) -- Opcional HSL/Hex
);

-- Tabla: Cuestionario
CREATE TABLE IF NOT EXISTS cuestionario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hito_id UUID NOT NULL REFERENCES hito(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    metadatos JSONB DEFAULT '{}'::jsonb
);

-- Tabla: Pregunta
CREATE TABLE IF NOT EXISTS pregunta (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cuestionario_id UUID NOT NULL REFERENCES cuestionario(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL, -- Ej: 'P1', 'L3'
    texto TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'OPCION_MULTIPLE', 'ORDEN', 'CORTA', 'BOOLEAN'
    opciones JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de strings o estructura JSON
    dimension_id VARCHAR(100) NOT NULL REFERENCES dimension(id),
    version INTEGER NOT NULL DEFAULT 1,
    pregunta_padre_id UUID REFERENCES pregunta(id) ON DELETE SET NULL,
    orden SERIAL, -- Para ordenar las preguntas secuencialmente de forma sencilla
    respuesta_critica VARCHAR(255)
);

-- Tabla: Asignacion (Tokens de enlaces únicos y mapeo Persona vs Grupo)
CREATE TABLE IF NOT EXISTS asignacion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cuestionario_id UUID NOT NULL REFERENCES cuestionario(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE, -- Token seguro para la URL /q/[token]
    tipo_sujeto VARCHAR(50) NOT NULL, -- 'INDIVIDUAL', 'GRUPAL'
    identificador_sujeto VARCHAR(255) NOT NULL, -- Ej: 'Douglas' o 'Departamento Ventas'
    muestra_esperada INTEGER DEFAULT 1,
    estado VARCHAR(50) DEFAULT 'LANZADO',
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completado_en TIMESTAMP WITH TIME ZONE,
    guardado_parcial BOOLEAN DEFAULT FALSE
);

-- Tabla: Respuesta
CREATE TABLE IF NOT EXISTS respuesta (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asignacion_id UUID NOT NULL REFERENCES asignacion(id) ON DELETE CASCADE,
    pregunta_id UUID NOT NULL REFERENCES pregunta(id) ON DELETE CASCADE,
    valor JSONB NOT NULL, -- El valor de respuesta (puede ser string, boolean o array ordenado)
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- Tabla: Administrador (Usuario administrador de la consola)
CREATE TABLE IF NOT EXISTS administrador (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Administrador Sesion (Sesiones activas del administrador)
CREATE TABLE IF NOT EXISTS administrador_sesion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    administrador_id UUID NOT NULL REFERENCES administrador(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expira_en TIMESTAMP WITH TIME ZONE NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar las consultas comunes
CREATE INDEX IF NOT EXISTS idx_asignacion_token ON asignacion(token);
CREATE INDEX IF NOT EXISTS idx_pregunta_cuestionario ON pregunta(cuestionario_id);
CREATE INDEX IF NOT EXISTS idx_respuesta_asignacion ON respuesta(asignacion_id);
CREATE INDEX IF NOT EXISTS idx_cuestionario_hito ON cuestionario(hito_id);
CREATE INDEX IF NOT EXISTS idx_administrador_sesion_token ON administrador_sesion(token);
CREATE UNIQUE INDEX IF NOT EXISTS idx_respuesta_unico_sesion ON respuesta (asignacion_id, pregunta_id, COALESCE(valor->>'sesionId', ''));



-- Tabla: Diagnostico Inteligente (Análisis cuantitativo y cualitativo de resultados)
CREATE TABLE IF NOT EXISTS diagnostico_inteligente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hito_id UUID NOT NULL REFERENCES hito(id) ON DELETE CASCADE UNIQUE,
    analisis_resumen TEXT NOT NULL,
    analisis_sentimiento JSONB NOT NULL,
    analisis_temas JSONB NOT NULL,
    actualizado_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


