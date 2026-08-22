# Design

## Theme
Minimalista y corporativo, con foco en el alto contraste, tipografía con presencia e interactividad refinada. El color de fondo es limpio y claro para reducir fatiga visual en móvil, adaptándose a un tema oscuro en el panel de analíticas.

## Color System
La paleta está controlada para evitar el cliché de gradientes multicolor ("AI slop"). Se utiliza un acento para elementos interactivos principales y tonos neutros (Slate) para la estructura.

### Neutrals
- **Background App (Claro)**: `hsl(220, 30%, 97%)` (Slate suave, off-white)
- **Background App (Oscuro)**: `hsl(220, 40%, 6%)` (Charcoal Slate profundo, nunca negro puro `#000000`)
- **Surface Card**: `hsla(0, 0%, 100%, 0.7)` con desenfoque de fondo (glassmorphism restringido)
- **Text Main (Claro)**: `hsl(220, 60%, 15%)` (Slate oscuro para alto contraste)
- **Text Main (Oscuro)**: `hsl(220, 15%, 93%)` (Blanco grisáceo de alta legibilidad)
- **Text Muted**: `hsl(220, 20%, 45%)` (Para leyendas secundarias)
- **Border Glass**: `hsla(0, 0%, 100%, 0.5)`

### Accents
- **Primary Color**: `hsl(250, 80%, 58%)` (Violeta Eléctrico, limitado a botones de acción, progreso e indicadores activos)
- **Accent Color**: `hsl(330, 85%, 55%)` (Magenta, utilizado con moderación como acento complementario)
- **Success**: `hsl(150, 80%, 40%)` (Checkmarks y estados completados)
- **Danger**: `hsl(0, 85%, 60%)` (Alertas y errores)

## Typography
El emparejamiento de fuentes aporta carácter profesional y jerarquía clara.

- **Headings (h1, h2, h3, h4, display)**: `Outfit` (sans-serif geométrico con presencia, peso 600–700, letter-spacing de display min `-0.02em` para evitar letras encimadas).
- **Body & Controls**: `Inter` (peso 400–500, line-height `1.5` para fácil lectura).
- **Data & Numbers**: `tabular-nums` habilitado para evitar saltos en timers, contadores de progreso o cifras del dashboard.

## Components

### QuestionCard
- **Estilo**: Fondo de cristal esmerilado (`backdrop-filter: blur(12px)`), radio de borde de `16px`.
- **Efectos**: Transición suave de entrada/salida (`fly` en el eje X) para guiar la continuidad espacial.

### AnswerButton
- **Normal**: Contenedor claro traslúcido, radio de borde de `12px`.
- **Hover**: Escala sutil `1.01`, borde primario, sombra muy ligera.
- **Selected**: Fondo violeta muy claro, borde primario de 2px, checkmark SVG animado en el extremo derecho.
- **Tap/Active**: Microescala a `0.98` instantánea para feedback físico.
- **Variant Compact**: Para cuadrículas (Sí/No), con padding reducido.

### BottomNavigation
- **Estilo**: Barra inferior sticky con `backdrop-filter: blur(16px)` y padding inferior dinámico que respeta `env(safe-area-inset-bottom)` en iOS.

### DragSortList
- **Estilo**: Lista vertical de elementos reordenables con IDs estables para transiciones `flip` nativas suaves.

## Layout & Rhythm
- Spacing basado en múltiplos de 4px / 8px.
- Contenedor móvil con un ancho máximo de `600px` y centrado en pantallas más grandes.
- Spacing vertical en el cuestionario usa `justify-content: flex-start` para evitar brincos en layouts móviles cuando el teclado o las opciones cambian de tamaño.
