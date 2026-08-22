<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  // Props de Svelte 5
  let { 
    title = '¡Muchas gracias!',
    message = 'Tus respuestas se han registrado con éxito. Ya puedes cerrar esta pestaña.',
    identificadorSujeto = ''
  }: { 
    title?: string;
    message?: string;
    identificadorSujeto?: string;
  } = $props();

  let animated = $state(false);

  onMount(() => {
    // Activar la animación de checkmark tras montar el componente
    setTimeout(() => {
      animated = true;
    }, 100);
  });
</script>

<div class="completion-screen" transition:fade>
  <div class="completion-card glass">
    <!-- Icono Checkmark animado -->
    <div class="checkmark-wrapper" class:animated={animated}>
      <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
        <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
        <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
      </svg>
    </div>

    <h1 class="completion-title font-display">
      {title}
    </h1>

    {#if identificadorSujeto}
      <p class="completion-subtitle font-display">
        Completado por: <span class="highlight">{identificadorSujeto}</span>
      </p>
    {/if}

    <p class="completion-message">
      {message}
    </p>
  </div>
</div>

<style>
  .completion-screen {
    width: 100%;
    min-height: calc(100vh - 40px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
  }

  .completion-card {
    width: 100%;
    max-width: 500px;
    padding: 40px 24px;
    border-radius: var(--radius-card);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    box-shadow: var(--shadow-premium);
  }

  .completion-title {
    font-size: 26px;
    font-weight: 700;
    color: var(--text-main);
    line-height: 1.2;
  }

  .completion-subtitle {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-muted);
    background-color: hsla(var(--hue-primary), 80%, 58%, 0.08);
    padding: 6px 14px;
    border-radius: 9999px;
  }

  .completion-subtitle .highlight {
    color: var(--primary-color);
  }

  .completion-message {
    font-size: 16px;
    color: var(--text-muted);
    line-height: 1.5;
  }

  .info-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 13px;
    color: var(--text-muted);
    background-color: hsla(var(--hue-neutral), 20%, 90%, 0.3);
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px dashed var(--border-glass);
    margin-top: 8px;
    width: 100%;
  }

  :global(.dark-theme) .info-footer {
    background-color: hsla(var(--hue-neutral), 30%, 14%, 0.3);
  }

  .info-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    color: var(--success-color);
  }

  /* Animación sofisticada del Checkmark SVG */
  .checkmark-wrapper {
    width: 80px;
    height: 80px;
    display: block;
  }

  .checkmark {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: block;
    stroke-width: 2.5;
    stroke: var(--success-color);
    stroke-miterlimit: 10;
    box-shadow: inset 0px 0px 0px var(--success-color);
    transition: box-shadow 0.4s ease-in-out;
  }

  .checkmark__circle {
    stroke-dasharray: 166;
    stroke-dashoffset: 166;
    stroke-width: 2.5;
    stroke-miterlimit: 10;
    stroke: var(--success-color);
    fill: none;
    animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
  }

  .checkmark__check {
    transform-origin: 50% 50%;
    stroke-dasharray: 48;
    stroke-dashoffset: 48;
    stroke: var(--success-color);
    animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards;
  }

  .animated .checkmark {
    animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  @keyframes stroke {
    100% {
      stroke-dashoffset: 0;
    }
  }

  @keyframes scale {
    0%, 100% {
      transform: none;
    }
    50% {
      transform: scale3d(1.1, 1.1, 1);
    }
  }

  @keyframes fill {
    100% {
      box-shadow: inset 0px 0px 0px 40px hsla(150, 80%, 40%, 0.1);
    }
  }
</style>
