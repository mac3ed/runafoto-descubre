-- ==============================================================================
-- INAUGURACIÓN NUEVOS ESPACIOS 2026 - ENCUESTA ALUMNOS ESCUELA RUNAFOTO (v3 - 12 Preguntas)
-- Enfoque ágil, juvenil, 12 preguntas esenciales y soporte multi-alumno desde cero
-- ==============================================================================

-- 1. Insertar o actualizar el Hito de Nuevos Espacios
INSERT INTO hito (id, nombre, fecha_inicio, fecha_fin, activo) VALUES
('e8888888-8888-8888-8888-888888888888', 'Inauguración Nuevos Espacios - Escuela RunaFoto 2026', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '60 days', TRUE)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  activo = EXCLUDED.activo;

-- 2. Insertar Dimensiones de la Encuesta de Espacios
INSERT INTO dimension (id, hito_id, codigo, nombre, descripcion, color) VALUES
('espacios_perfil', 'e8888888-8888-8888-8888-888888888888', 'E1', 'Tu Formación en RunaFoto', 'Programa, curso o taller y período o módulo en el que te encuentras.', 'hsl(210, 85%, 55%)'),
('espacios_satisfaccion', 'e8888888-8888-8888-8888-888888888888', 'E2', 'Experiencia y Buenas Vibras', 'Satisfacción general con la Escuela, recomendación y aprendizaje práctico.', 'hsl(145, 70%, 45%)'),
('espacios_conocimiento', 'e8888888-8888-8888-8888-888888888888', 'E3', 'Los 10 Nuevos Espacios', 'Nivel de recorrido, ambientes que más te emocionan y primeras impresiones.', 'hsl(280, 75%, 55%)'),
('espacios_utilidad', 'e8888888-8888-8888-8888-888888888888', 'E4', 'Práctica y Creación', 'Estudio de iluminación, proyectos de portafolio y frecuencia deseada.', 'hsl(25, 95%, 55%)'),
('espacios_recursos', 'e8888888-8888-8888-8888-888888888888', 'E5', 'Equipos y Acompañamiento', 'Disponibilidad de cámaras, luces, accesorios y apoyo del equipo docente/técnico.', 'hsl(190, 85%, 45%)'),
('espacios_mejoras', 'e8888888-8888-8888-8888-888888888888', 'E6', 'Ideas y Mejoras', 'Barreras para aprovechar los espacios, mejoras deseadas y tu voz para seguir creciendo.', 'hsl(340, 80%, 55%)')
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  color = EXCLUDED.color;

-- 3. Insertar Cuestionario para Alumnos
INSERT INTO cuestionario (id, hito_id, nombre, descripcion, version, metadatos) VALUES
('c8888888-8888-8888-8888-888888888888', 'e8888888-8888-8888-8888-888888888888', '¡Queremos saber de ti y tu experiencia en los Nuevos Espacios! 📸✨', 'Cuéntanos qué te parecen las nuevas instalaciones inauguradas este 22 de Agosto de 2026, qué te gustaría practicar más y cómo podemos hacer tus clases aún más increíbles.', 3, '{"audiencia": "Alumnos de Escuela RunaFoto", "sede": "Trujillo - Av. América Oeste 801", "duracion_estimada_min": 2}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  metadatos = EXCLUDED.metadatos,
  version = 3;

-- 4. LIMPIAR RESPUESTAS PREVIAS DE PRUEBA SOLO DE ESTA ENCUESTA (Mantiene intactas las anteriores)
DELETE FROM respuesta WHERE asignacion_id = 'a8888888-8888-8888-8888-888888888888';

-- Limpiar preguntas previas del cuestionario de espacios
DELETE FROM pregunta WHERE cuestionario_id = 'c8888888-8888-8888-8888-888888888888';

-- 5. Insertar EXACTAMENTE 12 Preguntas Esenciales
INSERT INTO pregunta (id, cuestionario_id, codigo, texto, tipo, opciones, dimension_id, version, orden) VALUES

-- 1. Formación y Período
('b8000000-0000-0000-0000-000000000001', 'c8888888-8888-8888-8888-888888888888', 'ESP_01', '¿Qué formación estás cursando actualmente y en qué período te encuentras?', 'FORMACION_PERIODO', '{
  "formaciones": [
    "Programa Integral de Fotografía (1 año)",
    "Video Desde Cero (3 meses)",
    "Workshop Adobe Lightroom",
    "Creación de Contenido con Celular para Emprendedores",
    "Masterclass Newborn",
    "Cierres Efectivos para Fotógrafos Escolares",
    "Otro taller o curso"
  ],
  "periodos": [
    "Mes 1 – 3 (Conociendo tu Cámara / Fundamentos)",
    "Mes 4 – 6 (Composición Visual)",
    "Mes 7 – 9 (Iluminación Artificial / Estudio)",
    "Mes 10 – 12 (Fotocreativa, Portafolio o Comercial)",
    "Asistí a un workshop o taller puntual",
    "Finalizado / Egresado(a)"
  ]
}'::jsonb, 'espacios_perfil', 3, 1),

-- 2. Satisfacción General
('b8000000-0000-0000-0000-000000000002', 'c8888888-8888-8888-8888-888888888888', 'ESP_02', 'En general, ¿qué tan feliz y satisfecho/a estás con tu experiencia en Escuela RunaFoto?', 'OPCION_MULTIPLE', '[
  "⭐⭐⭐⭐⭐ ¡Me encanta! Excelente experiencia de aprendizaje",
  "⭐⭐⭐⭐ Muy buena, estoy aprendiendo un montón",
  "⭐⭐⭐ Regular, está bien pero puede mejorar",
  "⭐⭐ Poco satisfecho/a, esperaba algo diferente",
  "⭐ Muy insatisfecho/a"
]'::jsonb, 'espacios_satisfaccion', 3, 2),

-- 3. Aprender Haciendo
('b8000000-0000-0000-0000-000000000003', 'c8888888-8888-8888-8888-888888888888', 'ESP_03', '¿Sientes que tus clases te permiten "aprender haciendo" con práctica real?', 'OPCION_MULTIPLE', '[
  "📸 ¡Totalmente! Mucha práctica con cámara y luces desde el inicio",
  "👍 La mayor parte del tiempo",
  "⚖️ A veces, me gustaría que haya aún más horas de práctica",
  "⏳ Siento que todavía predomina la teoría"
]'::jsonb, 'espacios_satisfaccion', 3, 3),

-- 4. Recomendación
('b8000000-0000-0000-0000-000000000004', 'c8888888-8888-8888-8888-888888888888', 'ESP_04', '¿Qué tan probable es que le recomiendes la Escuela RunaFoto a un amigo o colega apasionado por la foto o video?', 'OPCION_MULTIPLE', '[
  "🚀 ¡De todas maneras! (10/10)",
  "✨ Muy probable",
  "🤔 Tal vez, con algunas mejoras",
  "🙅‍♂️ Poco probable"
]'::jsonb, 'espacios_satisfaccion', 3, 4),

-- 5. Conocimiento de los 10 Espacios
('b8000000-0000-0000-0000-000000000005', 'c8888888-8888-8888-8888-888888888888', 'ESP_05', '¿Qué tanto conoces de los 10 nuevos Espacios inaugurados en nuestra sede de Trujillo?', 'OPCION_MULTIPLE', '[
  "🏢 ¡Ya los conozco y he tenido prácticas en ellos!",
  "👀 Los he recorrido / visitado, pero aún no los uso en clase",
  "📱 Los he visto en redes sociales y publicaciones",
  "🙋‍♂️ Aún no los he recorrido ni conozco en detalle"
]'::jsonb, 'espacios_conocimiento', 3, 5),

-- 6. Espacio que más te entusiasma
('b8000000-0000-0000-0000-000000000006', 'c8888888-8888-8888-8888-888888888888', 'ESP_06', '¿Cuál de los nuevos ambientes te genera mayor emoción o ganas de usar en tus prácticas?', 'OPCION_MULTIPLE', '[
  "💡 Estudio profesional de iluminación, fondos y esquemas de luz",
  "🏛️ Museo de la Fotografía (con más de 60 cámaras históricas)",
  "🎞️ Laboratorio de fotografía analógica Blanco y Negro",
  "💻 Aulas tecnológicas equipadas para clases y edición digital",
  "🚁 Almacén tecnológico (drones, VR, cámaras, luces y audio)",
  "💄 Área de maquillaje y producción visual"
]'::jsonb, 'espacios_conocimiento', 3, 6),

-- 7. Utilidad del Estudio de Iluminación
('b8000000-0000-0000-0000-000000000007', 'c8888888-8888-8888-8888-888888888888', 'ESP_07', '¿Qué tan útil consideras el acceso continuo al Estudio de Iluminación para tu crecimiento como fotógrafo/a?', 'OPCION_MULTIPLE', '[
  "🔥 Indispensable para soltarme y armar portafolio pro",
  "✨ Muy útil y necesario para dominar la luz",
  "👍 Moderadamente útil",
  "🤷 No es mi enfoque principal"
]'::jsonb, 'espacios_utilidad', 3, 7),

-- 8. Actividad deseada
('b8000000-0000-0000-0000-000000000008', 'c8888888-8888-8888-8888-888888888888', 'ESP_08', '¿En qué tipo de actividad te gustaría aprovechar al máximo estos nuevos Espacios?', 'OPCION_MULTIPLE', '[
  "🎯 Prácticas libres guiadas para ganar confianza con la cámara",
  "💼 Construcción de mi propio portafolio profesional",
  "🎬 Proyectos audiovisuales, rodajes y creación de contenido",
  "🧪 Workshops especializados de iluminación y dirección de personas",
  "🎨 Experimentación artística en el laboratorio B&N y museo"
]'::jsonb, 'espacios_utilidad', 3, 8),

-- 9. Frecuencia ideal
('b8000000-0000-0000-0000-000000000009', 'c8888888-8888-8888-8888-888888888888', 'ESP_09', '¿Con qué frecuencia te gustaría realizar prácticas libres o asistidas en estos espacios?', 'OPCION_MULTIPLE', '[
  "⚡ Varias veces por semana",
  "📅 1 vez por semana",
  "🗓️ Cada 15 días (quincenal)",
  "📆 1 vez al mes"
]'::jsonb, 'espacios_utilidad', 3, 9),

-- 10. Equipos y Acompañamiento
('b8000000-0000-0000-0000-000000000010', 'c8888888-8888-8888-8888-888888888888', 'ESP_10', '¿Cómo sientes la disponibilidad de equipos y el acompañamiento docente para tus prácticas?', 'OPCION_MULTIPLE', '[
  "🚀 Excelente: equipos listos y siempre hay apoyo de los profes",
  "✅ Muy buena, cumple con lo que necesito",
  "⚠️ Regular: a veces faltan equipos o apoyo en horas punta",
  "🔧 Me gustaría mayor variedad de modificadores y acompañamiento técnico"
]'::jsonb, 'espacios_recursos', 3, 10),

-- 11. Mejora Inmediata
('b8000000-0000-0000-0000-000000000011', 'c8888888-8888-8888-8888-888888888888', 'ESP_11', 'Si pudieras elegir una mejora inmediata en los nuevos espacios, ¿cuál te gustaría ver primero?', 'OPCION_MULTIPLE', '[
  "🔓 Más turnos de estudio libre para practicar a mi ritmo",
  "💡 Workshops prácticos intensivos de esquemas de luz y poses",
  "📸 Mayor variedad de modificadores, fondos y ópticas",
  "📱 Protocolo rápido y simple de reserva por WhatsApp o web",
  "🌟 Salidas y prácticas de producción con clientes reales"
]'::jsonb, 'espacios_mejoras', 3, 11),

-- 12. Nombre y/o Sugerencia Final (100% Opcional - No bloquea)
('b8000000-0000-0000-0000-000000000012', 'c8888888-8888-8888-8888-888888888888', 'ESP_12', '¿Cuál es tu nombre o sugerencia final para la Escuela? (Opcional — puedes poner solo tu nombre, tu idea o dejarlo en blanco 🤫✨)', 'CORTA', '[]'::jsonb, 'espacios_mejoras', 3, 12);

-- 6. Insertar o reiniciar Asignación Grupal en estado limpio (Capacidad 5000 respuestas)
INSERT INTO asignacion (id, cuestionario_id, token, tipo_sujeto, identificador_sujeto, muestra_esperada, estado, completado_en, guardado_parcial) VALUES
('a8888888-8888-8888-8888-888888888888', 'c8888888-8888-8888-8888-888888888888', 'token-espacios-alumnos', 'GRUPAL', 'Alumnos Escuela RunaFoto', 5000, 'LANZADO', NULL, FALSE)
ON CONFLICT (token) DO UPDATE SET
  cuestionario_id = EXCLUDED.cuestionario_id,
  identificador_sujeto = EXCLUDED.identificador_sujeto,
  muestra_esperada = 5000,
  estado = 'LANZADO',
  completado_en = NULL,
  guardado_parcial = FALSE;
