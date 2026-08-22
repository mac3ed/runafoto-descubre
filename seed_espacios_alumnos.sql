-- ==============================================================================
-- INAUGURACIÓN NUEVOS ESPACIOS 2026 - ENCUESTA ALUMNOS ESCUELA RUNAFOTO
-- Script seguro e idempotente (No elimina datos anteriores)
-- ==============================================================================

-- 1. Insertar o actualizar el Hito de Nuevos Espacios
INSERT INTO hito (id, nombre, fecha_inicio, fecha_fin, activo) VALUES
('e8888888-8888-8888-8888-888888888888', 'Inauguración Nuevos Espacios - Escuela RunaFoto 2026', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '60 days', TRUE)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  activo = EXCLUDED.activo;

-- 2. Insertar Dimensiones de la Encuesta de Espacios
INSERT INTO dimension (id, hito_id, codigo, nombre, descripcion, color) VALUES
('espacios_perfil', 'e8888888-8888-8888-8888-888888888888', 'E1', 'Perfil del Alumno', 'Área de estudio, nivel o módulo actual y tiempo en la Escuela RunaFoto.', 'hsl(210, 85%, 55%)'),
('espacios_satisfaccion', 'e8888888-8888-8888-8888-888888888888', 'E2', 'Experiencia y Satisfacción', 'Satisfacción general con la Escuela, recomendación NPS y aprendizaje práctico.', 'hsl(145, 70%, 45%)'),
('espacios_conocimiento', 'e8888888-8888-8888-8888-888888888888', 'E3', 'Conocimiento de Espacios', 'Nivel de conocimiento, recorrido y ambientes que más entusiasman a los alumnos.', 'hsl(280, 75%, 55%)'),
('espacios_utilidad', 'e8888888-8888-8888-8888-888888888888', 'E4', 'Utilidad e Intención de Uso', 'Relevancia del estudio de luz, áreas de producción, frecuencia e interés de uso.', 'hsl(25, 95%, 55%)'),
('espacios_recursos', 'e8888888-8888-8888-8888-888888888888', 'E5', 'Recursos y Acompañamiento', 'Disponibilidad y estado de equipos, acompañamiento técnico y docente.', 'hsl(190, 85%, 45%)'),
('espacios_mejoras', 'e8888888-8888-8888-8888-888888888888', 'E6', 'Barreras y Mejoras', 'Dificultades de acceso, mejoras prioritarias y sugerencias abiertas del alumno.', 'hsl(340, 80%, 55%)')
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  color = EXCLUDED.color;

-- 3. Insertar Cuestionario para Alumnos
INSERT INTO cuestionario (id, hito_id, nombre, descripcion, version, metadatos) VALUES
('c8888888-8888-8888-8888-888888888888', 'e8888888-8888-8888-8888-888888888888', 'Encuesta de Experiencia y Nuevos Espacios', 'Conoce y evalúa las nuevas instalaciones inauguradas el 22 de Agosto de 2026, tus expectativas de práctica y oportunidades de mejora en Escuela RunaFoto.', 1, '{"audiencia": "Alumnos actuales", "sede": "Trujillo - Av. América Oeste 801", "duracion_estimada_min": 3}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  metadatos = EXCLUDED.metadatos;

-- 4. Limpiar preguntas previas del cuestionario si ya existían para refrescar limpiamente
DELETE FROM pregunta WHERE cuestionario_id = 'c8888888-8888-8888-8888-888888888888';

-- 5. Insertar Preguntas Ágiles de Selección
INSERT INTO pregunta (id, cuestionario_id, codigo, texto, tipo, opciones, dimension_id, version, orden) VALUES
-- Bloque 1: Perfil
('b8000000-0000-0000-0000-000000000001', 'c8888888-8888-8888-8888-888888888888', 'ESP_01', '¿En qué programa o área te estás formando actualmente en Escuela RunaFoto?', 'OPCION_MULTIPLE', '["Fotografía Integral / Profesional", "Iluminación de Estudio y Retrato", "Retoque Digital y Postproducción", "Producción Audiovisual / Video", "Taller o Workshop Específico"]'::jsonb, 'espacios_perfil', 1, 1),
('b8000000-0000-0000-0000-000000000002', 'c8888888-8888-8888-8888-888888888888', 'ESP_02', '¿En qué etapa o módulo de tu formación te encuentras?', 'OPCION_MULTIPLE', '["Primeros módulos (Inicio)", "Módulos intermedios", "Módulos avanzados / Próximo a egresar", "Egresado reciente"]'::jsonb, 'espacios_perfil', 1, 2),

-- Bloque 2: Impresión General
('b8000000-0000-0000-0000-000000000003', 'c8888888-8888-8888-8888-888888888888', 'ESP_03', 'En general, ¿qué tan satisfecho/a estás con tu experiencia de aprendizaje en Escuela RunaFoto?', 'OPCION_MULTIPLE', '["⭐⭐⭐⭐⭐ Excelente / Muy satisfecho", "⭐⭐⭐⭐ Bueno / Satisfecho", "⭐⭐⭐ Regular / Neutral", "⭐⭐ Poco satisfecho", "⭐ Muy insatisfecho"]'::jsonb, 'espacios_satisfaccion', 1, 3),
('b8000000-0000-0000-0000-000000000004', 'c8888888-8888-8888-8888-888888888888', 'ESP_04', '¿Sientes que tus clases y talleres te permiten "aprender haciendo" con práctica real?', 'OPCION_MULTIPLE', '["Totalmente, la formación es muy práctica", "La mayor parte del tiempo", "A veces, me gustaría mayor práctica", "Aún predomina la teoría"]'::jsonb, 'espacios_satisfaccion', 1, 4),
('b8000000-0000-0000-0000-000000000005', 'c8888888-8888-8888-8888-888888888888', 'ESP_05', '¿Qué tan probable es que recomiendes la Escuela RunaFoto a un amigo o colega interesado en foto/video?', 'OPCION_MULTIPLE', '["Definitivamente sí (10/10)", "Muy probable", "Probable con algunas mejoras", "Poco probable"]'::jsonb, 'espacios_satisfaccion', 1, 5),

-- Bloque 3: Conocimiento de Nuevos Espacios
('b8000000-0000-0000-0000-000000000006', 'c8888888-8888-8888-8888-888888888888', 'ESP_06', '¿Qué tanto conoces de los 10 nuevos Espacios inaugurados en nuestra sede?', 'OPCION_MULTIPLE', '["Ya los conozco y he utilizado alguno", "Los he recorrido pero aún no los uso en clase", "He visto publicaciones / he escuchado de ellos", "Aún no los he recorrido ni conozco en detalle"]'::jsonb, 'espacios_conocimiento', 1, 6),
('b8000000-0000-0000-0000-000000000007', 'c8888888-8888-8888-8888-888888888888', 'ESP_07', '¿Cuál de los nuevos ambientes te genera mayor expectativa o entusiasmo?', 'OPCION_MULTIPLE', '["Estudio profesional de iluminación y fondos", "Museo de la Fotografía (60+ cámaras históricas)", "Laboratorio de fotografía Blanco y Negro", "Aulas tecnológicas para clases y edición", "Almacén tecnológico (drones, VR, cámaras, luces)", "Área de maquillaje y producción"]'::jsonb, 'espacios_conocimiento', 1, 7),

-- Bloque 4: Utilidad e Intención de Uso
('b8000000-0000-0000-0000-000000000008', 'c8888888-8888-8888-8888-888888888888', 'ESP_08', '¿Qué tan útil consideras el acceso continuo al Estudio de Iluminación para tu desarrollo?', 'OPCION_MULTIPLE', '["Indispensable para mi portafolio y técnica", "Muy útil y necesario", "Moderadamente útil", "Poco relevante para mi enfoque"]'::jsonb, 'espacios_utilidad', 1, 8),
('b8000000-0000-0000-0000-000000000009', 'c8888888-8888-8888-8888-888888888888', 'ESP_09', '¿En qué actividad te gustaría aprovechar principalmente los nuevos Espacios?', 'OPCION_MULTIPLE', '["Prácticas libres guiadas para ganar confianza", "Construcción de mi propio portafolio profesional", "Proyectos reales de video y producción audiovisual", "Talleres intensivos de iluminación y dirección de modelos", "Visitas culturales y experimentación en laboratorio"]'::jsonb, 'espacios_utilidad', 1, 9),
('b8000000-0000-0000-0000-000000000010', 'c8888888-8888-8888-8888-888888888888', 'ESP_10', '¿Con qué frecuencia desearías realizar prácticas en los nuevos ambientes?', 'OPCION_MULTIPLE', '["Varias veces por semana", "1 vez por semana", "Cada 15 días (quincenal)", "1 vez al mes"]'::jsonb, 'espacios_utilidad', 1, 10),

-- Bloque 5: Recursos y Acompañamiento
('b8000000-0000-0000-0000-000000000011', 'c8888888-8888-8888-8888-888888888888', 'ESP_11', '¿Cómo calificas la disponibilidad y variedad de equipos fotográficos y audiovisuales disponibles?', 'OPCION_MULTIPLE', '["Excelente variedad y estado de equipos", "Buena, cumple con lo necesario", "Regular, a veces faltan equipos en horas punta", "Se requiere mayor variedad de lentes y accesorios"]'::jsonb, 'espacios_recursos', 1, 11),
('b8000000-0000-0000-0000-000000000012', 'c8888888-8888-8888-8888-888888888888', 'ESP_12', '¿Sientes que recibes orientación y acompañamiento claro del equipo académico para usar los espacios?', 'OPCION_MULTIPLE', '["Siempre hay apoyo y resolución rápida de dudas", "La mayoría de veces", "A veces falta coordinación previa", "Rara vez hay acompañamiento técnico"]'::jsonb, 'espacios_recursos', 1, 12),

-- Bloque 6: Barreras y Mejoras
('b8000000-0000-0000-0000-000000000013', 'c8888888-8888-8888-8888-888888888888', 'ESP_13', '¿Cuál es la principal dificultad para aprovechar al 100% los nuevos espacios y equipos?', 'OPCION_MULTIPLE', '["Falta de claridad en horarios y normas de uso", "Disponibilidad de turnos y sistema de reserva", "Necesidad de mayor acompañamiento técnico en estudio", "Cruce con mis horarios laborales / personales", "Ninguna dificultad, todo está claro"]'::jsonb, 'espacios_mejoras', 1, 13),
('b8000000-0000-0000-0000-000000000014', 'c8888888-8888-8888-8888-888888888888', 'ESP_14', '¿Qué mejora generaría el mayor impacto positivo inmediato en tu formación?', 'OPCION_MULTIPLE', '["Más horas de estudio libre para prácticas individuales", "Workshops prácticos de iluminación avanzada", "Mayor variedad de modificadores de luz y fondos", "Protocolo simple de reserva rápida por WhatsApp/Web", "Prácticas de producción en campo con clientes reales"]'::jsonb, 'espacios_mejoras', 1, 14),
('b8000000-0000-0000-0000-000000000015', 'c8888888-8888-8888-8888-888888888888', 'ESP_15', 'En pocas palabras, ¿qué es lo que más te gusta de los nuevos Espacios o qué sugerencia rápida nos darías? (Opcional)', 'CORTA', '[]'::jsonb, 'espacios_mejoras', 1, 15);

-- 6. Insertar Asignación Grupal Abierta para Alumnos
INSERT INTO asignacion (id, cuestionario_id, token, tipo_sujeto, identificador_sujeto, muestra_esperada, estado) VALUES
('a8888888-8888-8888-8888-888888888888', 'c8888888-8888-8888-8888-888888888888', 'token-espacios-alumnos', 'GRUPAL', 'Alumnos Escuela RunaFoto', 200, 'LANZADO')
ON CONFLICT (token) DO UPDATE SET
  cuestionario_id = EXCLUDED.cuestionario_id,
  identificador_sujeto = EXCLUDED.identificador_sujeto,
  muestra_esperada = EXCLUDED.muestra_esperada,
  estado = 'LANZADO';
