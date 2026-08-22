<script lang="ts">
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import type { Snippet } from 'svelte';

  // Props de Svelte 5 con children snippet (reemplaza <slot>)
  let { 
    questionText = '', 
    code = '', 
    dimensionName = '', 
    variant = 'standard',
    children
  }: { 
    questionText: string; 
    code: string; 
    dimensionName: string; 
    variant?: 'standard' | 'highlighted';
    children?: Snippet;
  } = $props();
</script>

<!--
  Contenedor animado. Cuando la clave cambia en el padre (usando {#key}), 
  Svelte recrea el componente ejecutando fly in/out automáticamente.
-->
<div 
  in:fly={{ x: 60, duration: 350, easing: cubicOut }}
  out:fly={{ x: -60, duration: 250, easing: cubicOut }}
  class="question-card glass {variant}"
>

  
  <h2 class="question-title font-display">
    {questionText}
  </h2>
  
  <!-- Snippet children (Svelte 5) reemplaza <slot /> -->
  <div class="options-container">
    {@render children?.()}
  </div>
</div>

<style>
  .question-card {
    width: 100%;
    max-width: 600px;
    padding: 24px;
    border-radius: var(--radius-card);
    margin: 16px auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
    transition: box-shadow 0.3s ease;
  }

  /* Variante destacada */
  .question-card.highlighted {
    border-color: hsla(var(--hue-primary), 70%, 65%, 0.4);
    box-shadow: 0 10px 40px 0 hsla(var(--hue-primary), 35%, 15%, 0.1);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-glass);
    padding-bottom: 12px;
  }

  .question-code {
    font-size: 13px;
    font-weight: 700;
    color: var(--primary-color);
    background-color: hsla(var(--hue-primary), 80%, 58%, 0.1);
    padding: 3px 10px;
    border-radius: 9999px;
    letter-spacing: 0.5px;
    border: 1px solid hsla(var(--hue-primary), 80%, 58%, 0.2);
  }

  .dimension-tag {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
    background-color: hsla(var(--hue-neutral), 20%, 90%, 0.5);
    padding: 3px 10px;
    border-radius: 9999px;
    letter-spacing: 0.3px;
  }

  :global(.dark-theme) .dimension-tag {
    background-color: hsla(var(--hue-neutral), 30%, 20%, 0.4);
  }

  .question-title {
    font-size: 19px;
    font-weight: 600;
    color: var(--text-main);
    line-height: 1.45;
    text-align: left;
  }

  .options-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 4px;
  }
</style>

