<script lang="ts">
  import { onMount } from 'svelte';
  import ProgressBar from './ProgressBar.svelte';
  import QuestionCard from './QuestionCard.svelte';
  import AnswerButton from './AnswerButton.svelte';
  import DragSortList from './DragSortList.svelte';
  import BottomNavigation from './BottomNavigation.svelte';
  import CompletionScreen from './CompletionScreen.svelte';



  // Props de Svelte 5
  let { 
    asignacion, 
    cuestionario, 
    preguntas,
    respuestasExistentes = {},
    preview = false
  }: { 
    asignacion: any; 
    cuestionario: any; 
    preguntas: any[]; 
    respuestasExistentes?: Record<string, any>;
    preview?: boolean;
  } = $props();

  // Estados reactivos ($state en Svelte 5)
  let paso = $state<'bienvenida' | 'cuestionario' | 'exito'>('bienvenida');
  let preguntaActualIndex = $state(0);
  let respuestas = $state<Record<string, any>>({});
  let cargando = $state(false);
  let errorMsg = $state('');
  let toastMsg = $state('');
  let toastTimer: ReturnType<typeof setTimeout>;

  // ID único de sesión/intento (generado en el cliente para consolidar respuestas en encuestas grupales)
  let sesionId = $state('');
  let deviceId = $state('');
  let fingerprint = $state('');

  const safeParseOptions = (opciones: any): string[] => {
    if (!opciones) return [];
    if (Array.isArray(opciones)) return opciones;
    if (typeof opciones === 'string') {
      try {
        const parsed = JSON.parse(opciones);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
      return opciones.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    return [];
  };

  let preguntaActualRaw = $derived(preguntas[preguntaActualIndex]);
  let preguntaActual = $derived(preguntaActualRaw ? {
    ...preguntaActualRaw,
    opciones: safeParseOptions(preguntaActualRaw.opciones)
  } : null);
  
  // Bug fix: progreso 1-indexed → en pregunta 1 ya muestra progreso visible (no 0%)
  let progreso = $derived(preguntas.length > 0 ? Math.round(((preguntaActualIndex + 1) / preguntas.length) * 100) : 0);
  let respuestaDada = $derived(preguntaActual ? respuestas[preguntaActual.id] : undefined);
  let nextDisabled = $derived(respuestaDada === undefined || respuestaDada === null || respuestaDada === '');

  // Tiempo estimado de completado basado en cantidad de preguntas
  let tiempoEstimado = $derived(Math.ceil(preguntas.length * 0.75));

  // Bug fix: formatear dimensionId correctamente (ej: 'comercial' → 'Comercial')
  function formatDimensionName(id: string): string {
    if (!id) return '';
    return id.charAt(0).toUpperCase() + id.slice(1);
  }

  // Sistema de Toast para feedback visual de autosave
  function showToast(msg: string) {
    toastMsg = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastMsg = ''; }, 2000);
  }

  // Scroll al inicio de la página al cambiar de pregunta
  $effect(() => {
    if (paso === 'cuestionario') {
      // Acceder al índice para registrar la dependencia reactiva
      const _idx = preguntaActualIndex;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  // Función de huella digital de terminal ligera (Canvas + System Metadata)
  function generateFingerprint(): string {
    const parts = [
      navigator.userAgent,
      `${screen.width}x${screen.height}x${screen.colorDepth}`,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.language
    ];
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = 200;
        canvas.height = 50;
        ctx.textBaseline = "top";
        ctx.font = "14px 'Outfit', Arial";
        ctx.fillStyle = "#f60";
        ctx.fillRect(10, 10, 150, 30);
        ctx.fillStyle = "#069";
        ctx.fillText("RunaFoto strategic 2026 😃", 15, 17);
        parts.push(canvas.toDataURL());
      }
    } catch (e) {
      // Ignorar errores si el navegador bloquea canvas
    }
    
    const raw = parts.join('||');
    
    // FNV-1a Hash de 32 bits
    let hash = 2166136261;
    for (let i = 0; i < raw.length; i++) {
      hash ^= raw.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return (hash >>> 0).toString(16);
  }

  onMount(() => {
    // 1. Obtener o generar el deviceId global de este celular
    const globalDeviceKey = 'runafoto-device-id';
    let savedDeviceId = localStorage.getItem(globalDeviceKey);
    if (!savedDeviceId) {
      savedDeviceId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      localStorage.setItem(globalDeviceKey, savedDeviceId!);
    }
    deviceId = savedDeviceId!;

    // 2. Generar huella digital del dispositivo
    fingerprint = generateFingerprint();

    // 3. Generar o cargar el sesionId para este cuestionario particular
    const localSesionKey = `sesion-${asignacion.token}`;
    let savedSesionId = localStorage.getItem(localSesionKey);
    if (!savedSesionId) {
      savedSesionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      localStorage.setItem(localSesionKey, savedSesionId!);
    }
    sesionId = savedSesionId!;

    // 4. Recuperar respuestas guardadas en localStorage (autosave) y del servidor
    const localDataKey = `respuestas-${asignacion.token}`;
    const saved = localStorage.getItem(localDataKey);
    let respuestasLocales = {};
    if (saved) {
      try {
        respuestasLocales = JSON.parse(saved);
      } catch (e) {
        console.error('Error cargando respuestas locales:', e);
      }
    }

    // Combinar: preferir el local, de lo contrario el del servidor
    respuestas = {
      ...respuestasExistentes,
      ...respuestasLocales
    };

    // Determinar las preguntas faltantes (sin contestar)
    const indices = preguntas.map((p, idx) => ({ id: p.id, idx }));
    const faltantes = indices.filter(item => respuestas[item.id] === undefined || respuestas[item.id] === null || respuestas[item.id] === '');
    
    // Si ya ha respondido al menos una pregunta (o tiene respuestas cargadas del servidor), lo llevamos directo a la primera que falte
    if (faltantes.length > 0 && faltantes.length < preguntas.length) {
      preguntaActualIndex = faltantes[0].idx;
      paso = 'cuestionario';
    }
  });



  let autosaveTimer: ReturnType<typeof setTimeout>;

  // Sincronizar con el servidor con debounce (800ms)
  function sincronizarConServidor(respuestasSync: Record<string, any>) {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      if (paso !== 'cuestionario' || cargando) return;

      const formatoRespuestas = Object.entries(respuestasSync).map(([preguntaId, valor]) => ({
        preguntaId,
        valor
      }));
      
      fetch('/api/submit-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: asignacion.token,
          respuestas: formatoRespuestas,
          completar: false,
          sesionId,
          deviceId,
          fingerprint
        })
      }).catch(err => console.warn('Error en autosave background:', err));
    }, 800);
  }

  // Guardar en localStorage y hacer sincronización parcial silenciosa
  function guardarLocalmente(nuevasRespuestas: Record<string, any>) {
    respuestas = nuevasRespuestas;
    
    if (preview) {
      console.log('[Vista Previa] Guardado local omitido. Respuestas:', respuestas);
      return;
    }

    localStorage.setItem(`respuestas-${asignacion.token}`, JSON.stringify(respuestas));
    showToast('✓ Guardado');

    sincronizarConServidor(respuestas);
  }

  // Manejar el cambio de respuesta para una pregunta específica
  function handleRespuesta(valor: any) {
    const copia = { ...respuestas, [preguntaActual.id]: valor };
    guardarLocalmente(copia);
    
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  }

  // Avanzar en el cuestionario
  async function irSiguiente() {
    if (preguntaActualIndex < preguntas.length - 1) {
      preguntaActualIndex++;
    } else {
      await enviarCuestionario();
    }
  }

  // Retroceder
  function irAtras() {
    if (preguntaActualIndex > 0) {
      preguntaActualIndex--;
    }
  }

  // Enviar el cuestionario de forma definitiva
  async function enviarCuestionario() {
    clearTimeout(autosaveTimer);
    cargando = true;
    errorMsg = '';
    
    if (preview) {
      // Simular retraso y éxito en vista previa
      setTimeout(() => {
        cargando = false;
        paso = 'exito';
        console.log('[Vista Previa] Envío finalizado de forma simulada. Respuestas:', respuestas);
      }, 600);
      return;
    }

    const formatoRespuestas = Object.entries(respuestas).map(([preguntaId, valor]) => ({
      preguntaId,
      valor
    }));

    try {
      const response = await fetch('/api/submit-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: asignacion.token,
          respuestas: formatoRespuestas,
          completar: true,
          sesionId,
          deviceId,
          fingerprint
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.removeItem(`respuestas-${asignacion.token}`);
        localStorage.removeItem(`sesion-${asignacion.token}`);
        paso = 'exito';
      } else {
        errorMsg = data.error || 'Error al enviar las respuestas. Inténtalo de nuevo.';
      }
    } catch (err) {
      console.error('Error al enviar:', err);
      errorMsg = 'Error de conexión con el servidor. Verifica tu internet y vuelve a intentar.';
    } finally {
      cargando = false;
    }
  }
</script>

<div class="colector-layout" class:has-preview={preview} class:has-test={asignacion.estado === 'TEST'}>
  {#if preview}
    <div class="preview-banner font-display">
      <span>👁️ MODO VISTA PREVIA (Las respuestas no se guardarán)</span>
    </div>
  {:else if asignacion.estado === 'TEST'}
    <div class="test-banner font-display">
      <span>🧪 MODO DE PRUEBA (Las respuestas no afectarán las estadísticas reales)</span>
    </div>
  {/if}

  <!-- Toast de autosave -->
  {#if toastMsg}
    <div class="toast-notification" role="status" aria-live="polite">
      {toastMsg}
    </div>
  {/if}

  {#if paso === 'bienvenida'}
    <!-- Pantalla 1: Bienvenida -->
    <div class="welcome-screen">
      <div class="welcome-card glass">
        <div class="logo-area">
          <img src="/logo-runafoto.svg" alt="RunaFoto" style="height: 48px; width: auto;" />
        </div>
        
        <h1 class="welcome-title font-display">
          Investigación: {cuestionario.nombre}
        </h1>
        
        <p class="welcome-desc">
          {cuestionario.descripcion}
        </p>


        
        <div class="meta-row">
          <div class="meta-tag">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="meta-icon">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            <span>{asignacion.tipoSujeto === 'GRUPAL' ? 'Grupal / Área' : 'Individual'}</span>
          </div>
          <div class="meta-tag">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="meta-icon">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>~{tiempoEstimado} min · {preguntas.length} preguntas</span>
          </div>
        </div>

        <button 
          type="button" 
          class="start-button font-display shine-effect" 
          onclick={() => paso = 'cuestionario'}
        >
          Comenzar Investigación
        </button>
      </div>
    </div>

  {:else if paso === 'cuestionario'}
    <!-- Pantalla 2: Cuestionario Dinámico -->
    <div class="cuestionario-header">
      <ProgressBar value={progreso} variant="slim" />
      <div class="header-details">
        <img src="/logo-runafoto.svg" alt="RunaFoto" class="logo-header" style="height: 22px; width: auto;" />
        <span class="progress-txt font-display">Pregunta {preguntaActualIndex + 1} de {preguntas.length}</span>
      </div>
    </div>

    <div class="cuestionario-body">
      {#if errorMsg}
        <div class="error-banner">
          ⚠️ {errorMsg}
        </div>
      {/if}

      <!-- Animación de llave basada en la ID de pregunta para forzar recreación de tarjetas -->
      {#key preguntaActual.id}
        <QuestionCard 
          code={preguntaActual.codigo} 
          questionText={preguntaActual.texto} 
          dimensionName={`Dimensión ${formatDimensionName(preguntaActual.dimensionId)}`}
        >
          {#if preguntaActual.tipo === 'BOOLEAN'}
            <!-- Bug fix: usar variant compact para botones Sí/No (spec UX) -->
            <div class="boolean-group">
              <AnswerButton 
                label="Sí" 
                selected={respuestaDada === true}
                variant="compact"
                onclick={() => handleRespuesta(true)} 
              />
              <AnswerButton 
                label="No" 
                selected={respuestaDada === false}
                variant="compact"
                onclick={() => handleRespuesta(false)} 
              />
            </div>
          {:else if preguntaActual.tipo === 'OPCION_MULTIPLE'}
            <div class="options-vertical">
              {#each preguntaActual.opciones as opcion}
                <AnswerButton 
                  label={opcion} 
                  selected={respuestaDada === opcion} 
                  onclick={() => handleRespuesta(opcion)} 
                />
              {/each}
            </div>
          {:else if preguntaActual.tipo === 'ORDEN'}
            <p class="instruction-txt">Arrastra o usa las flechas para ordenar de mayor a menor importancia:</p>
            <DragSortList 
              items={respuestaDada || preguntaActual.opciones} 
              onchange={(nuevoOrden) => handleRespuesta(nuevoOrden)} 
            />
          {:else if preguntaActual.tipo === 'CORTA'}
            <textarea 
              class="text-input glass" 
              placeholder="Escribe tu respuesta aquí de forma abierta..." 
              value={respuestaDada || ''}
              oninput={(e) => handleRespuesta((e.target as HTMLTextAreaElement).value)}
            ></textarea>
          {/if}
        </QuestionCard>
      {/key}
    </div>

    <!-- Overlay de carga durante el envío final -->
    {#if cargando}
      <div class="loading-overlay" role="status">
        <div class="loading-spinner"></div>
        <p class="loading-msg font-display">Enviando tus respuestas...</p>
      </div>
    {/if}

    <!-- Navegación inferior adaptada a una mano -->
    <BottomNavigation 
      showBack={preguntaActualIndex > 0} 
      isLastQuestion={preguntaActualIndex === preguntas.length - 1} 
      nextDisabled={nextDisabled || cargando} 
      onnext={irSiguiente} 
      onback={irAtras} 
    />

  {:else if paso === 'exito'}
    <!-- Pantalla 3: Agradecimiento -->
    <CompletionScreen identificadorSujeto={asignacion.identificadorSujeto} />
  {/if}
</div>

<style>
  .colector-layout {
    width: 100%;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding-bottom: 90px; /* Evitar que el BottomNavigation tape el contenido */
  }

  /* Estilos de Bienvenida */
  .welcome-screen {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px 16px;
    margin-top: 40px;
  }

  .welcome-card {
    width: 100%;
    max-width: 500px;
    padding: 36px 24px;
    border-radius: var(--radius-card);
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 24px;
    box-shadow: var(--shadow-premium);
  }

  .logo-area {
    display: flex;
    flex-direction: column;
    align-items: center;
  }


  .welcome-title {
    font-size: 24px;
    font-weight: 700;
    color: var(--text-main);
    line-height: 1.2;
  }

  .welcome-desc {
    font-size: 15px;
    color: var(--text-muted);
    line-height: 1.5;
  }


  .meta-tag {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 13px;
    color: var(--text-muted);
    background-color: hsla(var(--hue-primary), 80%, 58%, 0.05);
    padding: 8px 16px;
    border-radius: 9999px;
  }

  .meta-icon {
    width: 16px;
    height: 16px;
    color: var(--primary-color);
  }

  .start-button {
    height: 52px;
    width: 100%;
    border-radius: var(--radius-button);
    border: none;
    background: var(--primary-glow);
    color: white;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 15px hsla(var(--hue-primary), 80%, 58%, 0.3);
    transition: all 0.25s ease;
  }

  .start-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 25px hsla(var(--hue-primary), 80%, 58%, 0.45);
  }

  .start-button:active {
    transform: scale(0.98);
  }

  /* Estilos del Cuestionario Activo */
  .cuestionario-header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background-color: hsla(var(--hue-neutral), 30%, 97%, 0.9);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border-glass);
    z-index: 90;
  }

  :global(.dark-theme) .cuestionario-header {
    background-color: hsla(var(--hue-neutral), 40%, 6%, 0.9);
  }

  .header-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 48px;
    padding: 0 16px;
    max-width: 600px;
    margin: 0 auto;
  }

  .logo-header {
    font-size: 15px;
    font-weight: 800;
    letter-spacing: 1px;
    color: var(--primary-color);
  }

  .progress-txt {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-muted);
  }

  .cuestionario-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start; /* flex-start evita saltos en preguntas largas */
    padding: 80px 16px 24px 16px; /* 80px superior para no ser tapado por el header */
    max-width: 600px;
    width: 100%;
    margin: 0 auto;
  }

  .error-banner {
    background-color: hsla(0, 85%, 60%, 0.1);
    border: 1px solid var(--danger-color);
    color: var(--danger-color);
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 14px;
    text-align: center;
  }

  /* Contenedores de opciones */
  .boolean-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .options-vertical {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .instruction-txt {
    font-size: 13px;
    color: var(--text-muted);
    margin-bottom: 4px;
    text-align: left;
  }

  .text-input {
    width: 100%;
    min-height: 140px;
    padding: 16px;
    border-radius: var(--radius-button);
    background: var(--surface-card);
    border: 1px solid var(--border-glass);
    color: var(--text-main);
    font-family: inherit;
    font-size: 15px;
    resize: vertical;
    outline: none;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
    transition: all 0.25s ease;
  }

  .text-input:focus {
    border-color: var(--primary-color);
    box-shadow: var(--shadow-focus);
  }

  /* Estilos de Vista Previa */
  .preview-banner {
    background: linear-gradient(135deg, hsl(45, 90%, 50%), hsl(24, 90%, 50%));
    color: white;
    text-align: center;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 700;
    width: 100%;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    letter-spacing: 0.5px;
  }


  /* Estilos de Vista Previa y Test */
  .preview-banner,
  .test-banner {
    color: white;
    text-align: center;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 700;
    width: 100%;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    letter-spacing: 0.5px;
  }

  .preview-banner {
    background: linear-gradient(135deg, hsl(45, 90%, 50%), hsl(24, 90%, 50%));
  }

  .test-banner {
    background: linear-gradient(135deg, hsl(200, 80%, 45%), hsl(220, 80%, 45%));
  }

  .colector-layout.has-preview .cuestionario-header,
  .colector-layout.has-test .cuestionario-header {
    top: 33px; /* Desplazar cabecera para no taparse */
  }

  .colector-layout.has-preview .welcome-screen,
  .colector-layout.has-test .welcome-screen {
    margin-top: 75px;
  }

  .colector-layout.has-preview .cuestionario-body,
  .colector-layout.has-test .cuestionario-body {
    padding-top: 110px;
  }

  /* Layout de meta chips en la bienvenida */
  .meta-row {
    display: flex;
    justify-content: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  /* Toast de autosave */
  .toast-notification {
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--text-main);
    color: var(--bg-app);
    padding: 8px 20px;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 600;
    z-index: 200;
    white-space: nowrap;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    animation: toastIn 0.25s ease forwards;
    pointer-events: none;
  }

  /* Overlay de carga al enviar */
  .loading-overlay {
    position: fixed;
    inset: 0;
    background: hsla(var(--hue-neutral), 30%, 97%, 0.85);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    z-index: 150;
  }

  :global(.dark-theme) .loading-overlay {
    background: hsla(var(--hue-neutral), 40%, 6%, 0.85);
  }

  .loading-msg {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-muted);
  }
</style>
