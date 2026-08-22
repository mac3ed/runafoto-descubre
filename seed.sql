-- 1. Limpiar datos existentes (manteniendo administradores)
DELETE FROM respuesta;
DELETE FROM asignacion;
DELETE FROM pregunta;
DELETE FROM cuestionario;
DELETE FROM dimension;
DELETE FROM hito;

-- 2. Insertar Hito de Descubrimiento Organizacional
INSERT INTO hito (id, nombre, fecha_inicio, fecha_fin, activo) VALUES
('aa345b10-67a8-4bb9-bdff-c0dd01234567', 'Descubrimiento Organizacional RunaFoto', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '15 days', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 3. Insertar Dimensiones Estratégicas vinculadas al Hito
INSERT INTO dimension (id, hito_id, codigo, nombre, descripcion, color) VALUES
('negocio_crecimiento', 'aa345b10-67a8-4bb9-bdff-c0dd01234567', 'D1', 'Negocio y Crecimiento', 'Diagnóstico por línea (potencial, esfuerzo, dependencia de Douglas, quién financia a quién) + decisión de crecimiento (duplicar, digitalizar, vender manuales, descontinuar)', 'hsl(24, 90%, 55%)'),
('comercial', 'aa345b10-67a8-4bb9-bdff-c0dd01234567', 'D2', 'Comercial', 'Diferencias reales de vender Bodas vs. Empresas vs. Escuela vs. Promofest vs. XV — ya no cómo venden, sino qué distingue a cada una', 'hsl(142, 70%, 45%)'),
('operaciones', 'aa345b10-67a8-4bb9-bdff-c0dd01234567', 'D3', 'Operaciones', 'Diferencias operativas entre líneas, conflictos de recursos, estacionalidad, capacidad instalada', 'hsl(200, 80%, 45%)'),
('informacion', 'aa345b10-67a8-4bb9-bdff-c0dd01234567', 'D4', 'Información', 'Dónde nace y dónde debería vivir el dato maestro, quién lo modifica — la capa de datos', 'hsl(270, 70%, 55%)'),
('organizacion', 'aa345b10-67a8-4bb9-bdff-c0dd01234567', 'D5', 'Organización', 'Dependencia, sucesión, entrenamiento, documentación — foco en escalar, no en organigrama', 'hsl(330, 85%, 55%)'),
('tecnologia_automatizacion', 'aa345b10-67a8-4bb9-bdff-c0dd01234567', 'D6', 'Tecnología y Automatización', 'Qué herramienta específica integra cada dato — WhatsApp, Contasis, CRM, IA — la capa de sistema (RunaCore)', 'hsl(190, 90%, 40%)')
ON CONFLICT (id) DO NOTHING;

-- 4. Insertar Cuestionarios por Rol vinculados al Hito
INSERT INTO cuestionario (id, hito_id, nombre, descripcion, version) VALUES
('c1111111-1111-1111-1111-111111111111', 'aa345b10-67a8-4bb9-bdff-c0dd01234567', 'Gerencia General y Desarrollo de Producto', 'Cuestionario estratégico nivel dirección sobre toma de decisiones, flujo de negocio y crecimiento.', 1),
('c2222222-2222-2222-2222-222222222222', 'aa345b10-67a8-4bb9-bdff-c0dd01234567', 'Administración General', 'Cuestionario estratégico nivel dirección y administración general sobre finanzas y control de activos.', 1),
('c3333333-3333-3333-3333-333333333333', 'aa345b10-67a8-4bb9-bdff-c0dd01234567', 'Coordinación Académica', 'Cuestionario enfocado en la coordinación académica y flujos de finanzas de Escuela.', 1),
('c4444444-4444-4444-4444-444444444444', 'aa345b10-67a8-4bb9-bdff-c0dd01234567', 'Coordinación Operativa (Norte)', 'Cuestionario enfocado en escalamiento operativo y coordinación (Trujillo/Norte).', 1),
('c7777777-7777-7777-7777-777777777777', 'aa345b10-67a8-4bb9-bdff-c0dd01234567', 'Coordinación Operativa (Lima/Sur)', 'Cuestionario sobre operation en Lima, aptitud comercial y documentación.', 1),
('c5555555-5555-5555-5555-555555555555', 'aa345b10-67a8-4bb9-bdff-c0dd01234567', 'Producción', 'Cuestionario de descubrimiento operativo para realizadores, postproducción y diseño.', 1),
('c6666666-6666-6666-6666-666666666666', 'aa345b10-67a8-4bb9-bdff-c0dd01234567', 'Contabilidad y Finanzas', 'Cuestionario sobre flujo financiero y conciliación de información contable.', 1)
ON CONFLICT (id) DO NOTHING;

-- 5. Insertar Preguntas para Dirección Creativa (c1111111-1111-1111-1111-111111111111)
INSERT INTO pregunta (cuestionario_id, codigo, texto, tipo, opciones, dimension_id, version) VALUES
('c1111111-1111-1111-1111-111111111111', 'DOU_01', 'Si solo pudieras duplicar una línea de negocio durante los próximos 12 meses, ¿cuál elegirías y por qué?', 'CORTA', '[]'::jsonb, 'negocio_crecimiento', 1),
('c1111111-1111-1111-1111-111111111111', 'DOU_02', '¿Qué parte de tu forma de vender consideras que marca la mayor diferencia frente a la competencia, y por qué crees que funciona?', 'CORTA', '[]'::jsonb, 'comercial', 1),
('c1111111-1111-1111-1111-111111111111', 'DOU_03', '¿Qué parte de tu experiencia vendiendo todavía depende de ti y aún no está documentada en ninguno de tus manuales?', 'CORTA', '[]'::jsonb, 'organizacion', 1),
('c1111111-1111-1111-1111-111111111111', 'DOU_04', 'Si mañana contrataras tres vendedores nuevos, ¿en qué orden los entrenarías, y por qué ese orden?', 'CORTA', '[]'::jsonb, 'organizacion', 1),
('c1111111-1111-1111-1111-111111111111', 'DOU_05', '¿Qué línea dejarías crecer sola, sin supervisión tuya, y cuál seguirías supervisando personalmente?', 'CORTA', '[]'::jsonb, 'negocio_crecimiento', 1),
('c1111111-1111-1111-1111-111111111111', 'DOU_06', 'Cuando el nuevo equipo de ventas de Escuela empiece a recibir los leads directamente, ¿qué tendría que pasar para que confíes plenamente en que pueden trabajar sin tu intervención?', 'CORTA', '[]'::jsonb, 'organizacion', 1),
('c1111111-1111-1111-1111-111111111111', 'DOU_07', '¿Qué decisión te gustaría dejar de tomar este año?', 'CORTA', '[]'::jsonb, 'organizacion', 1),
('c1111111-1111-1111-1111-111111111111', 'DOU_08', 'Si desaparecieras un mes, ¿qué dejaría de hacerse?', 'CORTA', '[]'::jsonb, 'organizacion', 1),
('c1111111-1111-1111-1111-111111111111', 'DOU_UNI', 'Cuéntanos, en tus palabras, cualquier fallo, reclamo o eventualidad no deseada — con un cliente, con la organización interna, con la agenda, o con el equipo.', 'CORTA', '[]'::jsonb, 'organizacion', 1);

-- 6. Insertar Preguntas para Administración General (c2222222-2222-2222-2222-222222222222)
INSERT INTO pregunta (cuestionario_id, codigo, texto, tipo, opciones, dimension_id, version) VALUES
('c2222222-2222-2222-2222-222222222222', 'BET_01', 'De todas las responsabilidades que manejas hoy, ¿cuál tendría el mayor impacto si pudiera delegarse o automatizarse primero?', 'CORTA', '[]'::jsonb, 'negocio_crecimiento', 1),
('c2222222-2222-2222-2222-222222222222', 'BET_02', 'Si pudieras aprobar de antemano un tipo de pago (con una regla o límite) para no revisarlo uno por uno, ¿cuál soltarías primero?', 'CORTA', '[]'::jsonb, 'tecnologia_automatizacion', 1),
('c2222222-2222-2222-2222-222222222222', 'BET_03', '¿Qué es lo que siempre revisas para asegurarte de que un pago está conforme antes de aprobarlo?', 'CORTA', '[]'::jsonb, 'informacion', 1),
('c2222222-2222-2222-2222-222222222222', 'BET_04', 'Con el operador de almacén/logístico por entrar, ¿qué necesitarías tener ya documentado para que asuma el control de activos sin depender de tu memoria?', 'CORTA', '[]'::jsonb, 'organizacion', 1),
('c2222222-2222-2222-2222-222222222222', 'BET_05', 'Si cada lunes recibieras un único reporte sobre Escuela, ¿qué información no debería faltar?', 'CORTA', '[]'::jsonb, 'negocio_crecimiento', 1),
('c2222222-2222-2222-2222-222222222222', 'BET_06', 'Con el nuevo vendedor de Escuela por entrar, ¿qué más ayudaría a revertir la caída en 6 meses — mejor contenido, capacitación del vendedor, o más publicidad?', 'CORTA', '[]'::jsonb, 'comercial', 1),
('c2222222-2222-2222-2222-222222222222', 'BET_07', '¿Existe hoy un lugar único donde pueda conocerse qué equipos tiene la empresa, en qué estado están, quién los tiene y cuándo les corresponde mantenimiento, o esa información depende principalmente de la experiencia del equipo?', 'CORTA', '[]'::jsonb, 'informacion', 1),
('c2222222-2222-2222-2222-222222222222', 'BET_UNI', 'Cuéntanos, en tus palabras, cualquier fallo, reclamo o eventualidad no deseada — con un cliente, con la organización interna, con la agenda, o con el equipo.', 'CORTA', '[]'::jsonb, 'organizacion', 1);

-- 7. Insertar Preguntas para Coordinación Académica (c3333333-3333-3333-3333-333333333333)
INSERT INTO pregunta (cuestionario_id, codigo, texto, tipo, opciones, dimension_id, version) VALUES
('c3333333-3333-3333-3333-333333333333', 'KAR_01', '¿Cuál es la capacidad máxima de alumnos que Escuela podría atender hoy, con la infraestructura actual (salones, profesores)?', 'CORTA', '[]'::jsonb, 'operaciones', 1),
('c3333333-3333-3333-3333-333333333333', 'KAR_02', '¿Qué porcentaje de alumnos no termina el programa completo y cuál suele ser la principal razón por la que abandonan?', 'CORTA', '[]'::jsonb, 'negocio_crecimiento', 1),
('c3333333-3333-3333-3333-333333333333', 'KAR_03', 'De los cursos que ofrece Escuela, ¿cuál deja mejor margen y cuál consume más tiempo administrativo en proporción a lo que genera?', 'CORTA', '[]'::jsonb, 'negocio_crecimiento', 1),
('c3333333-3333-3333-3333-333333333333', 'KAR_04', 'Cuando preparas los Proyectados, ¿en qué parte del proceso suelen aparecer diferencias entre lo proyectado y lo que finalmente se cobra o registra?', 'CORTA', '[]'::jsonb, 'informacion', 1),
('c3333333-3333-3333-3333-333333333333', 'KAR_05', '¿Qué indicador de Escuela deberías poder ver cada semana, y hoy tienes que calcularlo a mano?', 'CORTA', '[]'::jsonb, 'tecnologia_automatizacion', 1),
('c3333333-3333-3333-3333-333333333333', 'KAR_06', 'Para que el nuevo vendedor pueda trabajar bien desde el día uno, ¿qué información tuya necesitaría tener siempre a la mano?', 'CORTA', '[]'::jsonb, 'organizacion', 1),
('c3333333-3333-3333-3333-333333333333', 'KAR_07', '¿Cuáles son los errores que más probablemente cometería un vendedor nuevo si no conociera bien cómo funciona Escuela?', 'CORTA', '[]'::jsonb, 'organizacion', 1),
('c3333333-3333-3333-3333-333333333333', 'KAR_08', 'Si mañana ingresara un nuevo vendedor, ¿qué conocimientos consideras indispensables para que pueda atender correctamente a un prospecto desde el primer día?', 'CORTA', '[]'::jsonb, 'comercial', 1),
('c3333333-3333-3333-3333-333333333333', 'KAR_UNI', 'Cuéntanos, en tus palabras, cualquier fallo, reclamo o eventualidad no deseada — con un cliente, con la organización interna, con la agenda, o con el equipo.', 'CORTA', '[]'::jsonb, 'organizacion', 1);

-- 8. Insertar Preguntas para Coordinación Operativa (Norte) (c4444444-4444-4444-4444-444444444444)
INSERT INTO pregunta (cuestionario_id, codigo, texto, tipo, opciones, dimension_id, version) VALUES
('c4444444-4444-4444-4444-444444444444', 'JEN_01', 'De todo lo que haces, ¿qué actividad dejaría de depender del criterio de cada persona si existiera un checklist claro?', 'CORTA', '[]'::jsonb, 'organizacion', 1),
('c4444444-4444-4444-4444-444444444444', 'JEN_02', '¿Qué de lo que haces hoy debería generar el sistema automáticamente, sin que tú lo armes?', 'CORTA', '[]'::jsonb, 'tecnologia_automatizacion', 1),
('c4444444-4444-4444-4444-444444444444', 'JEN_03', 'Si tuvieras que estandarizar un solo proceso entre Trujillo y Lima este año, ¿cuál elegirías?', 'CORTA', '[]'::jsonb, 'operaciones', 1),
('c4444444-4444-4444-4444-444444444444', 'JEN_04', '¿Qué proveedor sería más difícil de reemplazar si dejara de trabajar con ustedes?', 'CORTA', '[]'::jsonb, 'negocio_crecimiento', 1),
('c4444444-4444-4444-4444-444444444444', 'JEN_05', 'Si enseñaras a alguien en Lima a coordinar exactamente como tú, ¿qué le explicarías primero?', 'CORTA', '[]'::jsonb, 'organizacion', 1),
('c4444444-4444-4444-4444-444444444444', 'JEN_UNI', 'Cuéntanos, en tus palabras, cualquier fallo, reclamo o eventualidad no deseada — con un cliente, con la organización interna, con la agenda, o con el equipo.', 'CORTA', '[]'::jsonb, 'organizacion', 1);

-- 9. Insertar Preguntas para Coordinación Operativa (Lima/Sur) (c7777777-7777-7777-7777-777777777777)
INSERT INTO pregunta (cuestionario_id, codigo, texto, tipo, opciones, dimension_id, version) VALUES
('c7777777-7777-7777-7777-777777777777', 'JOS_01', 'Manejando Lima y el sur sin oficina física, ¿qué es distinto en tu día a día comparado con cómo opera Jenne desde Trujillo?', 'CORTA', '[]'::jsonb, 'organizacion', 1),
('c7777777-7777-7777-7777-777777777777', 'JOS_02', 'Se sabe que ayudas de alguna forma en la venta de Bodas — ¿en qué momento del proceso intervienes exactamente (primer contacto, seguimiento, cierre)?', 'CORTA', '[]'::jsonb, 'comercial', 1),
('c7777777-7777-7777-7777-777777777777', 'JOS_03', 'Si ambas sedes siguieran exactamente el mismo procedimiento, ¿en qué actividades Lima necesitaría trabajar de una manera distinta y por qué?', 'CORTA', '[]'::jsonb, 'organizacion', 1),
('c7777777-7777-7777-7777-777777777777', 'JOS_04', 'De lo que ya haces hoy en venta de Bodas, ¿qué parte sientes más natural y cuál más forzada?', 'CORTA', '[]'::jsonb, 'comercial', 1),
('c7777777-7777-7777-7777-777777777777', 'JOS_UNI', 'Cuéntanos, en tus palabras, cualquier fallo, reclamo o eventualidad no deseada — con un cliente, con la organización interna, con la agenda, o con el equipo.', 'CORTA', '[]'::jsonb, 'organizacion', 1);

-- 10. Insertar Preguntas para Producción (c5555555-5555-5555-5555-555555555555)
INSERT INTO pregunta (cuestionario_id, codigo, texto, tipo, opciones, dimension_id, version) VALUES
('c5555555-5555-5555-5555-555555555555', 'PRO_01', '¿Qué tan seguido esperas aprobación para continuar un trabajo?', 'OPCION_MULTIPLE', '["Todos los días", "Varias veces por semana", "Rara vez", "Nunca"]'::jsonb, 'operaciones', 1),
('c5555555-5555-5555-5555-555555555555', 'PRO_02', '¿Qué tan seguido cambia el alcance de un trabajo ya iniciado?', 'OPCION_MULTIPLE', '["Todos los días", "Varias veces por semana", "Rara vez", "Nunca"]'::jsonb, 'operaciones', 1),
('c5555555-5555-5555-5555-555555555555', 'PRO_03', '¿Qué tan seguido repites un trabajo que ya habías hecho?', 'OPCION_MULTIPLE', '["Todos los días", "Varias veces por semana", "Rara vez", "Nunca"]'::jsonb, 'operaciones', 1),
('c5555555-5555-5555-5555-555555555555', 'PRO_04', '¿Cuál es la capacidad máxima de eventos simultáneos que podrían cubrir con el equipo y personal actual?', 'CORTA', '[]'::jsonb, 'operaciones', 1),
('c5555555-5555-5555-5555-555555555555', 'PRO_05', '¿Qué parte de tu trabajo te consume más tiempo y te gustaría automatizar o simplificar primero?', 'CORTA', '[]'::jsonb, 'tecnologia_automatizacion', 1),
('c5555555-5555-5555-5555-555555555555', 'PRO_06', '¿Usan plantillas o procesos ya estandarizados, como los "6 momentos" de Promofest, en otras líneas, o es exclusivo de esa línea?', 'CORTA', '[]'::jsonb, 'organizacion', 1),
('c5555555-5555-5555-5555-555555555555', 'PRO_07', 'Si mañana tuvieran una nueva herramienta para trabajar, ¿qué tendría que hacer para que realmente les facilitara el trabajo y no se convirtiera en una carga más?', 'CORTA', '[]'::jsonb, 'tecnologia_automatizacion', 1),
('c5555555-5555-5555-5555-555555555555', 'PRO_08', '¿Qué equipo o recurso se reutiliza entre líneas, y cuál está siempre disponible sin conflicto?', 'CORTA', '[]'::jsonb, 'operaciones', 1),
('c5555555-5555-5555-5555-555555555555', 'PRO_UNI', 'Cuéntanos, en tus palabras, cualquier fallo, reclamo o eventualidad no deseada — con un cliente, con la organización interna, con la agenda, o con el equipo.', 'CORTA', '[]'::jsonb, 'organizacion', 1);

-- 11. Insertar Preguntas para Contabilidad y Finanzas (c6666666-6666-6666-6666-666666666666)
INSERT INTO pregunta (cuestionario_id, codigo, texto, tipo, opciones, dimension_id, version) VALUES
('c6666666-6666-6666-6666-666666666666', 'YER_01', '¿Qué tan seguido el mismo pago te obliga a revisar más de un lugar?', 'OPCION_MULTIPLE', '["Todos los días", "Varias veces por semana", "Rara vez", "Nunca"]'::jsonb, 'informacion', 1),
('c6666666-6666-6666-6666-666666666666', 'YER_02', '¿Qué reporte necesita hoy la Dirección/Gerencia y todavía no existe o requiere demasiado trabajo para elaborarlo?', 'CORTA', '[]'::jsonb, 'negocio_crecimiento', 1),
('c6666666-6666-6666-6666-666666666666', 'YER_03', '¿Qué indicador financiero debería poder verse a diario, y hoy solo se calcula de vez en cuando?', 'CORTA', '[]'::jsonb, 'tecnologia_automatizacion', 1),
('c6666666-6666-6666-6666-666666666666', 'YER_04', '¿Qué datos deberían alimentar automáticamente un dashboard gerencial, si pudieras elegir 3?', 'CORTA', '[]'::jsonb, 'tecnologia_automatizacion', 1),
('c6666666-6666-6666-6666-666666666666', 'YER_05', 'Usando Contasis, ¿qué tareas te consumen más tiempo durante el cierre contable?', 'CORTA', '[]'::jsonb, 'operaciones', 1),
('c6666666-6666-6666-6666-666666666666', 'YER_06', '¿Cómo coordinas hoy el cierre contable con la asesoría externa y qué parte del proceso suele generar más demoras?', 'CORTA', '[]'::jsonb, 'organizacion', 1),
('c6666666-6666-6666-6666-666666666666', 'YER_07', 'Si hoy la Gerencia quisiera conocer el margen real de cada línea de negocio, ¿podrían obtenerlo? ¿Qué información necesitarían y cuánto tiempo tomaría?', 'CORTA', '[]'::jsonb, 'negocio_crecimiento', 1),
('c6666666-6666-6666-6666-666666666666', 'YER_UNI', 'Cuéntanos, en tus palabras, cualquier fallo, reclamo o eventualidad no deseada — con un cliente, con la organización interna, con la agenda, o con el equipo.', 'CORTA', '[]'::jsonb, 'organizacion', 1);

-- 12. Insertar Asignaciones de Ejemplo para Pruebas (Douglas, Betty, Karla, Jenne, Josefh, Producción, Yeri)
INSERT INTO asignacion (id, cuestionario_id, token, tipo_sujeto, identificador_sujeto, muestra_esperada, estado) VALUES
('a0000000-0000-0000-0000-000000000001', 'c1111111-1111-1111-1111-111111111111', 'token-douglas-dir', 'INDIVIDUAL', 'Dirección Creativa', 1, 'LANZADO'),
('a0000000-0000-0000-0000-000000000002', 'c2222222-2222-2222-2222-222222222222', 'token-betty-dir', 'INDIVIDUAL', 'Administración General', 1, 'LANZADO'),
('a0000000-0000-0000-0000-000000000003', 'c3333333-3333-3333-3333-333333333333', 'token-karla-acad', 'INDIVIDUAL', 'Coordinación Académica', 1, 'LANZADO'),
('a0000000-0000-0000-0000-000000000004', 'c4444444-4444-4444-4444-444444444444', 'token-jenne-coor', 'INDIVIDUAL', 'Coordinación Operativa (Norte)', 1, 'LANZADO'),
('a0000000-0000-0000-0000-000000000005', 'c7777777-7777-7777-7777-777777777777', 'token-josefh-coor', 'INDIVIDUAL', 'Coordinación Operativa (Lima/Sur)', 1, 'LANZADO'),
('a0000000-0000-0000-0000-000000000006', 'c5555555-5555-5555-5555-555555555555', 'token-produccion-grupo', 'GRUPAL', 'Equipo de Producción', 5, 'LANZADO'),
('a0000000-0000-0000-0000-000000000007', 'c6666666-6666-6666-6666-666666666666', 'token-yeri-cont', 'INDIVIDUAL', 'Contabilidad y Finanzas', 1, 'LANZADO')
ON CONFLICT (id) DO NOTHING;

-- 13. Insertar Administrador por Defecto
INSERT INTO administrador (id, email, password_hash) VALUES
('ad111111-1111-1111-1111-111111111111', 'maycol.ac@gmail.com', '88bd79bd53130f3fc08c0d7ba7afe131:cf7e1bca5b47d988bef242fd66d28c0f60bc0ea6fb1547dd227068c72152719530e306ff599d48e9c6703e645354a26fbf4be20bca04033319e210d058c2b4c3')
ON CONFLICT (email) DO NOTHING;
