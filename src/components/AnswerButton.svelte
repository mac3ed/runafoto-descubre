<script lang="ts">
  // Props de Svelte 5
  let { 
    label = '', 
    selected = false, 
    disabled = false, 
    variant = 'default',
    onclick // Prop de evento clic en Svelte 5 (sustituye on:click en Svelte 5)
  }: { 
    label: string; 
    selected?: boolean; 
    disabled?: boolean; 
    variant?: 'default' | 'compact';
    onclick?: () => void;
  } = $props();
</script>

<button 
  type="button"
  class="answer-button {variant}" 
  class:selected={selected} 
  disabled={disabled}
  {onclick}
>
  <span class="btn-label">{label}</span>
  
  {#if selected}
    <div class="checkmark-icon">
      <!-- Checkmark SVG premium animado -->
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </div>
  {/if}
</button>

<style>
  .answer-button {
    width: 100%;
    min-height: 52px;
    padding: 14px 20px;
    border-radius: var(--radius-button);
    background: var(--surface-card);
    border: 1px solid var(--border-glass);
    color: var(--text-main);
    font-family: inherit;
    font-size: 16px;
    font-weight: 500;
    text-align: left;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
    outline: none;
    user-select: none;
  }

  .answer-button:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: hsla(var(--hue-primary), 70%, 65%, 0.4);
    box-shadow: 0 8px 15px -3px hsla(var(--hue-primary), 35%, 15%, 0.08);
  }

  .answer-button:active:not(:disabled) {
    transform: scale(0.98);
  }

  .answer-button:focus-visible {
    box-shadow: var(--shadow-focus);
  }

  /* Estado seleccionado */
  .answer-button.selected {
    background: hsla(var(--hue-primary), 75%, 96%, 0.85);
    border-color: var(--primary-color);
    box-shadow: 0 8px 20px -3px hsla(var(--hue-primary), 50%, 40%, 0.12);
    border-width: 2px;
    padding: 13px 19px; /* Compensar grosor del borde */
  }

  :global(.dark-theme) .answer-button.selected {
    background: hsla(var(--hue-primary), 50%, 16%, 0.4);
    border-color: var(--primary-color);
  }

  /* Variante compacta para cuadrículas */
  .answer-button.compact {
    padding: 10px 16px;
    min-height: 44px;
    font-size: 15px;
    border-radius: 10px;
  }
  
  .answer-button.compact.selected {
    padding: 9px 15px;
  }

  .btn-label {
    flex: 1;
    line-height: 1.3;
  }

  .checkmark-icon {
    width: 20px;
    height: 20px;
    color: var(--primary-color);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .checkmark-icon svg {
    width: 16px;
    height: 16px;
  }

  @keyframes scaleIn {
    0% {
      transform: scale(0);
    }
    100% {
      transform: scale(1);
    }
  }

  .answer-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
