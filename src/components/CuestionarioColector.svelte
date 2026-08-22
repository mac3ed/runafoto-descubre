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

  // Estados reactivos
  let paso = $state<'bienvenida' | 'cuestionario' | 'exito'>('bienvenida');
  let preguntaActualIndex = $state(0);
  let respuestas = $state<Record<string, any>>({});
  let cargando = $state(false);
  let errorMsg = $state('');
  let toastMsg = $state('');
  let toastTimer: ReturnType<typeof setTimeout>;

  // ID único de sesión/intento
  let sesionId = $state('');
  let deviceId = $state('');
  let fingerprint = $state('');

  const safeParseOptions = (opciones: any): any => {
    if (!opciones) return [];
    if (typeof opciones === 'object') return opciones;
    if (typeof opciones === 'string') {
      try {
        const parsed = JSON.parse(opciones);
        return parsed;
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
  
  let progreso = $derived(preguntas.length > 0 ? Math.round(((preguntaActualIndex + 1) / preguntas.length) * 100) : 0);
  let respuestaDada = $derived(preguntaActual ? respuestas[preguntaActual.id] : undefined);
  
  // Detección si la pregunta es opcional
  let esOpcional = $derived(
    preguntaActual?.tipo === 'CORTA' || 
    preguntaActual?.tipo === 'CORTA_OPCIONAL' ||
    (preguntaActual?.texto ? preguntaActual.texto.toLowerCase().includes('opcional') : false)
  );

  // Verificación de habilitación del botón Siguiente
  let nextDisabled = $derived.by(() => {
    if (!preguntaActual) return true;
    if (esOpcional) return false; // Las preguntas opcionales NUNCA bloquean

    if (preguntaActual.tipo === 'FORMACION_PERIODO') {
      if (!respuestaDada || typeof respuestaDada !== 'object') return true;
      return !respuestaDada.formacion || !respuestaDada.periodo;
    }

    return respuestaDada === undefined || respuestaDada === null || respuestaDada === '';
  });

  let tiempoEstimado = $derived(Math.max(2, Math.ceil(preguntas.length * 0.25)));

  function formatDimensionName(id: string): string {
    if (!id) return '';
    return id.replace('espacios_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  function showToast(msg: string) {
    toastMsg = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastMsg = ''; }, 2000);
  }

  $effect(() => {
    if (paso === 'cuestionario') {
      const _idx = preguntaActualIndex;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

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
    } catch (e) {}
    
    const raw = parts.join('||');
    let hash = 2166136261;
    for (let i = 0; i < raw.length; i++) {
      hash ^= raw.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return (hash >>> 0).toString(16);
  }

  function initSession() {
    const globalDeviceKey = 'runafoto-device-id';
    let savedDeviceId = localStorage.getItem(globalDeviceKey);
    if (!savedDeviceId) {
      savedDeviceId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      localStorage.setItem(globalDeviceKey, savedDeviceId!);
    }
    deviceId = savedDeviceId!;
    fingerprint = generateFingerprint();

    // Nueva sesión única por cada respuesta
    sesionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
  }

  onMount(() => {
    initSession();

    // Si hay respuestas guardadas parcialmente en esta sesión
    const localDataKey = `respuestas-${asignacion.token}`;
    const saved = localStorage.getItem(localDataKey);
    let respuestasLocales = {};
    if (saved) {
      try {
        respuestasLocales = JSON.parse(saved);
      } catch (e) {}
    }

    respuestas = {
      ...respuestasExistentes,
      ...respuestasLocales
    };

    const indices = preguntas.map((p, idx) => ({ id: p.id, idx }));
    const faltantes = indices.filter(item => respuestas[item.id] === undefined || respuestas[item.id] === null || respuestas[item.id] === '');
    
    if (faltantes.length > 0 && faltantes.length < preguntas.length) {
      preguntaActualIndex = faltantes[0].idx;
      paso = 'cuestionario';
    }
  });

  let autosaveTimer: ReturnType<typeof setTimeout>;

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
      }).catch(err => console.warn('Error en autosave:', err));
    }, 800);
  }

  function guardarLocalmente(nuevasRespuestas: Record<string, any>) {
    respuestas = nuevasRespuestas;
    
    if (preview) return;

    localStorage.setItem(`respuestas-${asignacion.token}`, JSON.stringify(respuestas));
    showToast('✓ Guardado');
    sincronizarConServidor(respuestas);
  }

  function handleRespuesta(valor: any) {
    const copia = { ...respuestas, [preguntaActual.id]: valor };
    guardarLocalmente(copia);
    
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  }

  async function irSiguiente() {
    if (preguntaActualIndex < preguntas.length - 1) {
      preguntaActualIndex++;
    } else {
      await enviarCuestionario();
    }
  }

  function irAtras() {
    if (preguntaActualIndex > 0) {
      preguntaActualIndex--;
    }
  }

  async function enviarCuestionario() {
    clearTimeout(autosaveTimer);
    cargando = true;
    errorMsg = '';
    
    if (preview) {
      setTimeout(() => {
        cargando = false;
        paso = 'exito';
      }, 500);
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

  function reiniciarEncuesta() {
    respuestas = {};
    preguntaActualIndex = 0;
    initSession();
    paso = 'bienvenida';
  }
</script>

<div class="colector-layout" class:has-preview={preview}>
  {#if preview}
    <div class="preview-banner font-display">
      <span>👁️ MODO VISTA PREVIA (Las respuestas no se guardarán)</span>
    </div>
  {/if}

  {#if toastMsg}
    <div class="toast-notification" role="status" aria-live="polite">
      {toastMsg}
    </div>
  {/if}

  {#if paso === 'bienvenida'}
    <!-- Pantalla 1: Bienvenida Amigable y Juvenil -->
    <div class="welcome-screen">
      <div class="welcome-card glass">
        <div class="logo-area">
          <img 
            src={cuestionario?.metadatos?.logoUrl || '/logo-escuela.png'} 
            alt="RunaFoto" 
            style="max-height: 80px; max-width: 260px; width: auto; height: auto; object-fit: contain;" 
          />
        </div>
        
        <h1 class="welcome-title font-display">
          {cuestionario.nombre}
        </h1>
        
        <p class="welcome-desc">
          {cuestionario.descripcion}
        </p>

        <button 
          type="button" 
          class="start-button font-display shine-effect" 
          onclick={() => paso = 'cuestionario'}
        >
          ¡Ayúdanos a mejorar! 🚀
        </button>

        <p class="anonym-note">
          🔒 Puedes responder de forma 100% anónima.
        </p>
      </div>
    </div>

  {:else if paso === 'cuestionario'}
    <!-- Pantalla 2: Cuestionario Dinámico con Buen Espaciado -->
    <div class="cuestionario-header">
      <ProgressBar value={progreso} variant="slim" />
      <div class="header-details">
        <img 
          src={cuestionario?.metadatos?.logoUrl || '/logo-escuela.png'} 
          alt="RunaFoto" 
          class="logo-header" 
          style="max-height: 28px; max-width: 120px; width: auto; object-fit: contain;" 
        />
        <span class="progress-txt font-display">Pregunta {preguntaActualIndex + 1} de {preguntas.length}</span>
      </div>
    </div>

    <div class="cuestionario-body">
      {#if errorMsg}
        <div class="error-banner">
          ⚠️ {errorMsg}
        </div>
      {/if}

      {#key preguntaActual.id}
        <QuestionCard 
          code={preguntaActual.codigo} 
          questionText={preguntaActual.texto} 
          dimensionName={formatDimensionName(preguntaActual.dimensionId)}
        >
          {#if preguntaActual.tipo === 'FORMACION_PERIODO'}
            <!-- Selector Visual y Dependiente de Formación y Período -->
            <div class="formacion-periodo-wrapper">
              <div class="sub-step-block">
                <p class="step-title font-display">1️⃣ Selecciona tu formación o curso:</p>
                <div class="options-vertical">
                  {#each (preguntaActual.opciones?.formaciones || []) as form}
                    <button 
                      type="button" 
                      class="custom-pill-btn glass" 
                      class:selected={(typeof respuestaDada === 'object' ? respuestaDada?.formacion : '') === form}
                      onclick={() => {
                        const cur = (typeof respuestaDada === 'object' && respuestaDada !== null) ? respuestaDada : {};
                        handleRespuesta({ 
                          ...cur, 
                          formacion: form, 
                          texto: `${form} — ${cur.periodo || '(período pendiente)'}` 
                        });
                      }}
                    >
                      <span class="radio-circle"></span>
                      <span class="pill-text">{form}</span>
                    </button>
                  {/each}
                </div>
              </div>

              <div class="sub-step-block" style="margin-top: 24px;">
                <p class="step-title font-display">2️⃣ Selecciona tu período o avance actual:</p>
                <div class="options-vertical">
                  {#each (preguntaActual.opciones?.periodos || []) as per}
                    <button 
                      type="button" 
                      class="custom-pill-btn glass" 
                      class:selected={(typeof respuestaDada === 'object' ? respuestaDada?.periodo : '') === per}
                      onclick={() => {
                        const cur = (typeof respuestaDada === 'object' && respuestaDada !== null) ? respuestaDada : {};
                        handleRespuesta({ 
                          ...cur, 
                          periodo: per, 
                          texto: `${cur.formacion || '(formación pendiente)'} — ${per}` 
                        });
                      }}
                    >
                      <span class="radio-circle"></span>
                      <span class="pill-text">{per}</span>
                    </button>
                  {/each}
                </div>
              </div>
            </div>

          {:else if preguntaActual.tipo === 'BOOLEAN'}
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
              {#each (Array.isArray(preguntaActual.opciones) ? preguntaActual.opciones : []) as opcion}
                <AnswerButton 
                  label={opcion} 
                  selected={respuestaDada === opcion} 
                  onclick={() => handleRespuesta(opcion)} 
                />
              {/each}
            </div>

          {:else if preguntaActual.tipo === 'ORDEN'}
            <p class="instruction-txt">Arrastra o usa las flechas para ordenar:</p>
            <DragSortList 
              items={respuestaDada || preguntaActual.opciones} 
              onchange={(nuevoOrden) => handleRespuesta(nuevoOrden)} 
            />

          {:else if preguntaActual.tipo === 'CORTA'}
            <div class="corta-wrapper">
              <textarea 
                class="text-input glass" 
                placeholder={preguntaActual.texto.toLowerCase().includes('nombre') ? 'Escribe tu nombre o apodo aquí (opcional)...' : 'Escribe tu respuesta aquí (opcional)...'}
                value={typeof respuestaDada === 'string' ? respuestaDada : (respuestaDada?.respuesta || '')}
                oninput={(e) => handleRespuesta((e.target as HTMLTextAreaElement).value)}
                rows="4"
              ></textarea>
              {#if esOpcional}
                <div class="optional-hint">
                  <span>💡 Esta respuesta es 100% opcional. Puedes dejarla en blanco y avanzar.</span>
                </div>
              {/if}
            </div>
          {/if}
        </QuestionCard>
      {/key}
    </div>

    {#if cargando}
      <div class="loading-overlay" role="status">
        <div class="loading-spinner"></div>
        <p class="loading-msg font-display">Guardando tus respuestas...</p>
      </div>
    {/if}

    <BottomNavigation 
      showBack={preguntaActualIndex > 0} 
      isLastQuestion={preguntaActualIndex === preguntas.length - 1} 
      nextDisabled={nextDisabled || cargando} 
      onnext={irSiguiente} 
      onback={irAtras} 
    />

  {:else if paso === 'exito'}
    <!-- Pantalla 3: Agradecimiento con Opción Multi-Alumno -->
    <CompletionScreen 
      identificadorSujeto={asignacion.identificadorSujeto} 
      onreset={reiniciarEncuesta}
    />
  {/if}
</div>

<style>
  .colector-layout {
    width: 100%;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding-bottom: 100px;
  }

  .welcome-screen {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    margin-top: 30px;
  }

  .welcome-card {
    width: 100%;
    max-width: 520px;
    padding: 40px 28px;
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
    line-height: 1.3;
  }

  .welcome-desc {
    font-size: 15px;
    color: var(--text-muted);
    line-height: 1.6;
  }

  .meta-row {
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .meta-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-muted);
    background-color: hsla(var(--hue-neutral), 20%, 90%, 0.5);
    padding: 6px 14px;
    border-radius: 9999px;
  }

  :global(.dark-theme) .meta-tag {
    background-color: hsla(var(--hue-neutral), 30%, 18%, 0.5);
  }

  .meta-icon {
    width: 15px;
    height: 15px;
  }

  .start-button {
    background: var(--primary-color);
    color: #fff;
    border: none;
    padding: 16px 24px;
    font-size: 16px;
    font-weight: 700;
    border-radius: var(--radius-button);
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .start-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  }

  .start-button:active {
    transform: translateY(0);
  }

  .anonym-note {
    font-size: 12px;
    color: var(--text-muted);
  }

  .cuestionario-header {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--bg-app);
    border-bottom: 1px solid var(--border-glass);
    padding-bottom: 12px;
  }

  .header-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px 0;
    max-width: 640px;
    margin: 0 auto;
  }

  .progress-txt {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-muted);
  }

  .cuestionario-body {
    flex: 1;
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .options-vertical {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .boolean-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .formacion-periodo-wrapper {
    display: flex;
    flex-direction: column;
    gap: 16px;
    text-align: left;
  }

  .step-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-main);
    margin-bottom: 10px;
  }

  .custom-pill-btn {
    width: 100%;
    padding: 14px 16px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-main);
    border: 1px solid var(--border-glass);
    background: var(--surface-card);
    transition: all 0.2s ease;
  }

  .custom-pill-btn:hover {
    border-color: var(--primary-color);
    background-color: hsla(var(--hue-primary), 80%, 58%, 0.04);
  }

  .custom-pill-btn.selected {
    border-color: var(--primary-color);
    background-color: hsla(var(--hue-primary), 80%, 58%, 0.12);
    font-weight: 700;
  }

  .radio-circle {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid var(--text-muted);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .custom-pill-btn.selected .radio-circle {
    border-color: var(--primary-color);
    background-color: var(--primary-color);
    box-shadow: inset 0 0 0 3px #fff;
  }

  .corta-wrapper {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .text-input {
    width: 100%;
    padding: 16px;
    border-radius: 10px;
    border: 1px solid var(--border-glass);
    background: var(--surface-card);
    font-family: inherit;
    font-size: 15px;
    color: var(--text-main);
    resize: vertical;
    outline: none;
    transition: border-color 0.2s;
  }

  .text-input:focus {
    border-color: var(--primary-color);
    box-shadow: var(--shadow-focus);
  }

  .optional-hint {
    font-size: 12px;
    color: var(--text-muted);
    background: hsla(var(--hue-neutral), 20%, 90%, 0.4);
    padding: 8px 12px;
    border-radius: 6px;
  }

  :global(.dark-theme) .optional-hint {
    background: hsla(var(--hue-neutral), 30%, 18%, 0.4);
  }

  .toast-notification {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--text-main);
    color: var(--bg-app);
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    z-index: 100;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .loading-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    z-index: 1000;
    color: #fff;
  }

  .loading-msg {
    font-size: 16px;
    font-weight: 600;
  }

  .instruction-txt {
    font-size: 13px;
    color: var(--text-muted);
    margin-bottom: 8px;
  }

  .error-banner {
    background-color: hsla(0, 80%, 50%, 0.1);
    color: var(--danger-color);
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    border: 1px solid hsla(0, 80%, 50%, 0.2);
  }

  .preview-banner {
    background: #ff9800;
    color: #000;
    text-align: center;
    padding: 8px 16px;
    font-weight: 700;
    font-size: 13px;
  }
</style>
