# Especificación de Componentes UI (UI Component Specification) - FASE 3
## Sistema de Levantamiento Estratégico de Información - Grupo RunaFoto

Este documento define la especificación técnica de todos los componentes interactivos reutilizables que formarán parte del frontend de la aplicación. Cada componente se detalla con sus propiedades (`props`), eventos emitidos, estados de ciclo de vida e interactivos, responsabilidades y variantes visuales bajo la línea estética de alto contraste y Glassmorphism definida.

---

## 1. COMPONENTES DE CUESTIONARIO MÓVIL (COLECTOR)

### A. Componente: `ProgressBar`
*   **Responsabilidad:** Mostrar el progreso visual del cuestionario de forma fluida y animada en la parte superior de la pantalla.
*   **Propiedades (Props):**
    *   `value: number` (Porcentaje actual de avance, de `0` a `100`).
    *   `showLabel: boolean` (Por defecto `false`. Indica si se debe renderizar el texto del porcentaje al lado).
*   **Eventos:** Ninguno.
*   **Estados:**
    *   *Idle:* Estado por defecto.
    *   *Transitioning:* Cuando el ancho de la barra cambia de un valor a otro (aplica easing de transición).
*   **Variantes Visuales:**
    *   `slim` (Línea delgada de `4px` de alto, pegada al borde superior móvil. Efecto de brillo animado continuo).
    *   `thick` (Barra redondeada de `12px` de alto con contenedor de fondo gris traslúcido, utilizada dentro de tarjetas o el dashboard).

---

### B. Componente: `QuestionCard`
*   **Responsabilidad:** Contener y enmarcar la pregunta actual, gestionando la transición elástica de entrada y salida cuando el usuario navega por el cuestionario.
*   **Propiedades (Props):**
    *   `questionText: string` (Texto completo de la pregunta estratégica).
    *   `code: string` (Identificador único de la pregunta, ej. `P1`, `L3`).
    *   `dimensionName: string` (Nombre de la dimensión, ej. `Dimensión 3: Información`).
*   **Eventos:**
    *   `on:transitionOutStart` (Se dispara cuando el componente inicia su animación de salida).
    *   `on:transitionInComplete` (Se dispara al concluir la animación de entrada).
*   **Estados:**
    *   *Active:* Visible y clickable.
    *   *Entering:* Deslizándose en el eje X desde `+100%` a `0%` con rebote elástico.
    *   *Exiting:* Deslizándose en el eje X hacia `-100%` con desvanecimiento de opacidad a `0`.
*   **Variantes Visuales:**
    *   `standard` (Fondo de cristal esmerilado con desenfoque de fondo y borde blanco semitransparente).
    *   `highlighted` (Borde sutilmente coloreado con degradado primario para preguntas de alta prioridad).

---

### C. Componente: `AnswerButton`
*   **Responsabilidad:** Representar una opción de respuesta interactiva en cuestionarios de opción múltiple o booleanos, ofreciendo retroalimentación táctil y visual al tocarla.
*   **Propiedades (Props):**
    *   `label: string` (Texto de la alternativa).
    *   `selected: boolean` (Si esta opción está seleccionada actualmente).
    *   `disabled: boolean` (Para desactivar interacciones si la tarjeta está transicionando).
*   **Eventos:**
    *   `on:click` (Emite una señal con el valor seleccionado al ser pulsado).
*   **Estados:**
    *   *Default:* Fondo blanco traslúcido (`rgba(255,255,255,0.7)`), borde gris claro.
    *   *Hover/Focus:* Escala `1.01`, borde primario violeta sutil, sombra paralela difuminada.
    *   *Selected:* Fondo violeta ultra claro (`hsla(250,75%,95%,0.8)`), borde primario violeta grueso, checkmark SVG visible en el extremo derecho.
    *   *Active/Tap:* Micro-escala `0.98` instantánea para feedback físico de clic.
*   **Variantes Visuales:**
    *   `default` (Tarjeta de respuesta vertical ancha).
    *   `compact` (Dos columnas para opciones cortas tipo Sí/No).

---

### D. Componente: `DragSortList`
*   **Responsabilidad:** Permitir el ordenamiento táctil (Drag and Drop) de una lista de elementos para preguntas de priorización (ej. prioridades de Dirección).
*   **Propiedades (Props):**
    *   `items: Array<{ id: string, label: string }>` (Lista ordenada de elementos).
*   **Eventos:**
    *   `on:reorder` (Emite la nueva lista ordenada cada vez que el usuario suelta un elemento en su nueva posición).
*   **Estados:**
    *   *Idle:* Lista en reposo.
    *   *Dragging:* Cuando un elemento es pulsado y arrastrado; el elemento seleccionado se escala `2%`, aumenta su sombra y la opacidad de los otros disminuye a `0.6`.
*   **Variantes Visuales:**
    *   `default` (Lista vertical con manejadores táctiles de agarre representados por iconos de dos líneas horizontales).

---

### E. Componente: `BottomNavigation`
*   **Responsabilidad:** Proveer la botonera inferior para navegar entre preguntas y guardar el avance.
*   **Propiedades (Props):**
    *   `showBack: boolean` (Indica si debe mostrar el botón "Atrás").
    *   `isLastQuestion: boolean` (Si es verdadero, el botón principal cambia su texto a "Enviar Cuestionario").
    *   `nextDisabled: boolean` (Desactiva el botón de avance si el usuario no ha seleccionado respuesta).
*   **Eventos:**
    *   `on:next` (Usuario avanza a la siguiente pregunta).
    *   `on:back` (Usuario retrocede).
*   **Estados:**
    *   *FixedBottom:* Sticky en la parte inferior de la pantalla móvil con efecto de difuminado por detrás (`backdrop-filter`).
*   **Variantes Visuales:**
    *   `default` (Botonera móvil-first con "Atrás" a la izquierda y "Siguiente" en ancho del 70% a la derecha).

---

### F. Componente: `CompletionScreen`
*   **Responsabilidad:** Mostrar la pantalla de agradecimiento una vez enviado el cuestionario con éxito.
*   **Propiedades (Props):**
    *   `title: string` (Ej. "¡Muchas gracias!").
    *   `message: string` (Texto descriptivo del hito completado).
    *   `showHomeButton: boolean` (Indica si se provee botón de redirección o no).
*   **Eventos:** Ninguno.
*   **Estados:**
    *   *SuccessAnimation:* Ejecución de una animación SVG de checkmark en cascada que se dibuja sola (`stroke-dasharray`).
*   **Variantes Visuales:**
    *   `default` (Diseño centrado con fondo sutil e ilustración vectorial abstracta).

---

## 2. COMPONENTES DE ADMINISTRACIÓN (DASHBOARD)

### G. Componente: `MetricCard`
*   **Responsabilidad:** Mostrar una métrica agregada en el panel de analíticas de Dirección.
*   **Propiedades (Props):**
    *   `title: string` (Etiqueta del KPI, ej. "Tasa de Respuesta").
    *   `value: string | number` (Valor numérico o porcentual a renderizar).
    *   `trend: string` (Texto o badge de cambio, ej. "+12% esta semana").
    *   `status: 'normal' | 'success' | 'alert'` (Define el color del badge y bordes de la métrica).
*   **Eventos:**
    *   `on:click` (Filtra los datos del dashboard principal según la métrica seleccionada).
*   **Estados:**
    *   *Default:* Cristal oscuro con bordes atenuados.
    *   *Hover:* Elevación tridimensional y borde de color según el estado (`status`).
*   **Variantes Visuales:**
    *   `default` (Panel de visualización cuadrado).
    *   `condensed` (Formato horizontal para listas de KPI en barra lateral).

---

### H. Componente: `ConfirmationDialog` (Modal)
*   **Responsabilidad:** Solicitar confirmación del usuario para acciones críticas (ej. reiniciar cuestionarios, exportar datos).
*   **Propiedades (Props):**
    *   `isOpen: boolean` (Muestra u oculta el modal).
    *   `title: string` (Cabecera del diálogo).
    *   `message: string` (Cuerpo descriptivo).
    *   `confirmLabel: string` (Texto del botón de confirmación).
    *   `cancelLabel: string` (Texto del botón de cancelación).
*   **Eventos:**
    *   `on:confirm` (Se acepta la acción).
    *   `on:cancel` (Se rechaza la acción).
*   **Estados:**
    *   *Open:* Animación de opacidad en el fondo (`overlay`) y escalado elástico del contenedor central modal.
    *   *Closed:* Oculto del DOM.
*   **Variantes Visuales:**
    *   `standard` (Fondo blanco o gris oscuro según el tema).
    *   `danger` (Botón de confirmación con color rojo/coral destructivo).
