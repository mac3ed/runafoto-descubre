<script lang="ts">
  // Usar la runa $props() de Svelte 5 para definir propiedades
  let { 
    value = 0, 
    variant = 'slim' 
  }: { 
    value: number; 
    variant?: 'slim' | 'thick' 
  } = $props();

  // Asegurar que el porcentaje esté entre 0 y 100
  let percentage = $derived(Math.min(100, Math.max(0, value)));
</script>

<div class="progress-container {variant}">
  <div 
    class="progress-bar shine-effect" 
    style="width: {percentage}%"
    role="progressbar" 
    aria-valuenow={percentage} 
    aria-valuemin="0" 
    aria-valuemax="100"
  ></div>
</div>

<style>
  .progress-container {
    width: 100%;
    background-color: var(--border-glass);
    overflow: hidden;
    position: relative;
    transition: background-color 0.3s ease;
  }

  /* Variante delgada fija al tope */
  .progress-container.slim {
    height: 6px;
    background-color: hsla(var(--hue-neutral), 20%, 90%, 0.5);
  }
  
  .progress-container.slim .progress-bar {
    height: 100%;
    border-radius: 0 4px 4px 0;
  }

  /* Variante gruesa para uso dentro de cards */
  .progress-container.thick {
    height: 14px;
    border-radius: 9999px;
    background-color: hsla(var(--hue-neutral), 30%, 85%, 0.3);
    border: 1px solid var(--border-glass);
  }

  .progress-container.thick .progress-bar {
    height: 100%;
    border-radius: 9999px;
  }

  /* Barra interna interactiva */
  .progress-bar {
    height: 100%;
    background: var(--primary-glow);
    transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 0 10px hsla(var(--hue-primary), 80%, 58%, 0.25);
  }

  /* Tema Oscuro */
  :global(.dark-theme) .progress-container.slim {
    background-color: hsla(var(--hue-neutral), 30%, 15%, 0.5);
  }

  :global(.dark-theme) .progress-container.thick {
    background-color: hsla(var(--hue-neutral), 35%, 10%, 0.4);
  }
</style>
