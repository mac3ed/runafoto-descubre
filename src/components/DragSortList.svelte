<script lang="ts">
  import { flip } from 'svelte/animate';
  import { fade } from 'svelte/transition';

  // Props de Svelte 5
  let { 
    items = [],
    onchange // Callback para cuando cambia el orden
  }: { 
    items: string[];
    onchange?: (newItems: string[]) => void;
  } = $props();

  // Genera un ID estable basado en el contenido del label (no en el índice)
  // Esto asegura que las animaciones flip funcionen correctamente al reordenar
  function stableId(label: string): string {
    let hash = 0;
    for (let i = 0; i < label.length; i++) {
      hash = ((hash << 5) - hash) + label.charCodeAt(i);
      hash |= 0; // Convertir a entero 32-bit
    }
    return `item-${Math.abs(hash)}`;
  }

  // Inicializar con IDs estables. El {#key preguntaActual.id} en el padre
  // ya recrea este componente cuando cambia la pregunta, así que no
  // necesitamos un $effect para sincronizar cambios externos.
  let listItems = $state(items.map((item) => ({ id: stableId(item), label: item })));

  let draggedIndex = $state<number | null>(null);

  // Mover elemento hacia arriba
  function moveUp(index: number) {
    if (index === 0) return;
    const newList = [...listItems];
    const temp = newList[index];
    newList[index] = newList[index - 1];
    newList[index - 1] = temp;
    listItems = newList;
    
    // Notificar cambio con el array plano
    if (onchange) {
      onchange(listItems.map(item => item.label));
    }
  }

  // Mover elemento hacia abajo
  function moveDown(index: number) {
    if (index === listItems.length - 1) return;
    const newList = [...listItems];
    const temp = newList[index];
    newList[index] = newList[index + 1];
    newList[index + 1] = temp;
    listItems = newList;
    
    // Notificar cambio
    if (onchange) {
      onchange(listItems.map(item => item.label));
    }
  }

  // Manejo de arrastre de mouse (Desktop Drag & Drop)
  function handleDragStart(e: DragEvent, index: number) {
    draggedIndex = index;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index.toString());
    }
  }

  function handleDragOver(e: DragEvent, index: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    // Intercambiar elementos al vuelo
    const newList = [...listItems];
    const temp = newList[draggedIndex];
    newList[draggedIndex] = newList[index];
    newList[index] = temp;
    listItems = newList;
    draggedIndex = index;
    
    // Notificar cambio
    if (onchange) {
      onchange(listItems.map(item => item.label));
    }
  }

  function handleDragEnd() {
    draggedIndex = null;
  }
</script>

<div class="drag-sort-list" transition:fade>
  {#each listItems as item, index (item.id)}
    <div 
      class="sort-item glass"
      class:dragging={draggedIndex === index}
      animate:flip={{ duration: 300 }}
      draggable="true"
      ondragstart={(e) => handleDragStart(e, index)}
      ondragover={(e) => handleDragOver(e, index)}
      ondragend={handleDragEnd}
      style="cursor: grab;"
    >
      <div class="item-index font-display">{index + 1}</div>
      <div class="item-content">{item.label}</div>
      
      <div class="controls-area">
        <!-- Botón Subir -->
        <button 
          type="button" 
          class="control-btn" 
          disabled={index === 0} 
          onclick={() => moveUp(index)}
          aria-label="Mover elemento arriba"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        </button>
        
        <!-- Botón Bajar -->
        <button 
          type="button" 
          class="control-btn" 
          disabled={index === listItems.length - 1} 
          onclick={() => moveDown(index)}
          aria-label="Mover elemento abajo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>
    </div>
  {/each}
</div>

<style>
  .drag-sort-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    margin-top: 8px;
  }

  .sort-item {
    display: flex;
    align-items: center;
    min-height: 52px;
    padding: 10px 16px;
    border-radius: var(--radius-button);
    background: var(--surface-card);
    border: 1px solid var(--border-glass);
    gap: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04);
    transition: box-shadow 0.25s ease, border-color 0.25s ease;
  }

  .sort-item.dragging {
    opacity: 0.5;
    border-style: dashed;
    border-color: var(--primary-color);
    background: rgba(15, 108, 189, 0.03);
  }

  .sort-item:hover {
    border-color: hsla(var(--hue-primary), 70%, 65%, 0.25);
    box-shadow: 0 6px 12px -3px hsla(var(--hue-primary), 35%, 15%, 0.05);
  }

  .item-index {
    width: 26px;
    height: 26px;
    border-radius: 9999px;
    background-color: var(--primary-color);
    color: white;
    font-size: 13px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .item-content {
    flex: 1;
    font-size: 15px;
    font-weight: 500;
    color: var(--text-main);
    line-height: 1.3;
  }

  .controls-area {
    display: flex;
    gap: 4px;
  }

  .control-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background-color: hsla(var(--hue-neutral), 20%, 90%, 0.4);
    border: 1px solid var(--border-glass);
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .control-btn svg {
    width: 14px;
    height: 14px;
  }

  .control-btn:hover:not(:disabled) {
    background-color: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
  }

  .control-btn:active:not(:disabled) {
    transform: scale(0.9);
  }

  .control-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  /* Tema Oscuro */
  :global(.dark-theme) .control-btn {
    background-color: hsla(var(--hue-neutral), 30%, 18%, 0.4);
  }
</style>
