<script lang="ts">
  // Props de Svelte 5
  let { 
    showBack = false, 
    isLastQuestion = false, 
    nextDisabled = false,
    onnext, // Evento avanzar
    onback  // Evento retroceder
  }: { 
    showBack?: boolean; 
    isLastQuestion?: boolean; 
    nextDisabled?: boolean;
    onnext?: () => void;
    onback?: () => void;
  } = $props();
</script>

<div class="bottom-nav glass">
  <div class="nav-content">
    {#if showBack}
      <button 
        type="button" 
        class="back-button" 
        onclick={onback}
        aria-label="Pregunta anterior"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>Atrás</span>
      </button>
    {:else}
      <!-- Espacio en blanco para empujar el botón Siguiente a la derecha si no hay botón Atrás -->
      <div></div>
    {/if}

    <button 
      type="button" 
      class="next-button shine-effect" 
      class:primary-glow={!nextDisabled}
      disabled={nextDisabled} 
      onclick={onnext}
    >
      <span>{isLastQuestion ? 'Finalizar Investigación' : 'Siguiente'}</span>
      {#if !isLastQuestion}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      {/if}
    </button>
  </div>
</div>

<style>
  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    min-height: 80px;
    height: calc(80px + env(safe-area-inset-bottom, 0px));
    background: hsla(var(--hue-neutral), 30%, 97%, 0.8);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-top: 1px solid var(--border-glass);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 16px 16px env(safe-area-inset-bottom, 0px);
    z-index: 100;
  }

  :global(.dark-theme) .bottom-nav {
    background: hsla(var(--hue-neutral), 40%, 6%, 0.8);
  }

  .nav-content {
    width: 100%;
    max-width: 600px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }

  /* Botón Atrás */
  .back-button {
    height: 48px;
    padding: 0 20px;
    border-radius: var(--radius-button);
    background-color: transparent;
    border: 1px solid var(--text-muted);
    color: var(--text-main);
    font-family: inherit;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;
  }

  .back-button svg {
    width: 18px;
    height: 18px;
  }

  .back-button:hover {
    background-color: var(--border-glass);
  }
  
  .back-button:active {
    transform: scale(0.95);
  }

  /* Botón Siguiente (Principal) */
  .next-button {
    height: 48px;
    padding: 0 24px;
    border-radius: var(--radius-button);
    background-color: var(--text-muted);
    border: none;
    color: white;
    font-family: inherit;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    flex: 1; /* Ocupa el espacio disponible */
    max-width: 320px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  .next-button svg {
    width: 18px;
    height: 18px;
  }

  .next-button.primary-glow {
    background: var(--primary-glow);
    box-shadow: 0 4px 15px hsla(var(--hue-primary), 80%, 58%, 0.3);
  }

  .next-button.primary-glow:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 25px hsla(var(--hue-primary), 80%, 58%, 0.45);
  }

  .next-button:active:not(:disabled) {
    transform: scale(0.97);
  }

  .next-button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    box-shadow: none;
  }
</style>
