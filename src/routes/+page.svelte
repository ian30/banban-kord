<script>
  import { onMount } from 'svelte';
  import { 
    loadData, 
    currentBoard, 
    currentColumns, 
    cards, 
    createColumn, 
    createCard, 
    updateCard,
    updateColumn,
    updateBoardName,
    deleteCard, 
    moveCard,
    moveColumn,
    deleteColumn  // Add this import
  } from '$lib/stores/kanbanStore.js';
  
  import { currentTheme, themes, loadTheme, saveTheme } from '$lib/stores/themeStore.js';
  
  // State for drag and drop
  let draggedCard = null;
  let dragOverColumn = null;
  // Add column drag state
  let draggedColumn = null;
  let dragOverColumnIndex = null;
  
  // State for modals
  let showNewColumnModal = false;
  let showNewCardModal = false;
  let showEditCardModal = false;
  let showEditColumnModal = false;
  let newColumnName = '';
  let newColumnColor = 'blue';
  let newCardTitle = '';
  let newCardDescription = '';
  let newCardColor = 'blue';
  let editingCard = null;
  let editingColumn = null;
  let targetColumnId = null;
  
  // Available colors
  const colorOptions = [
    { value: 'blue', label: 'Blue' },
    { value: 'green', label: 'Green' },
    { value: 'red', label: 'Red' },
    { value: 'purple', label: 'Purple' },
    { value: 'orange', label: 'Orange' },
    { value: 'teal', label: 'Teal' }
  ];
  
  // Add icon options
  const iconOptions = [
    { value: '', label: 'None' },
    { value: 'exclamation-triangle-fill', label: 'Warning' },
    { value: 'exclamation-circle-fill', label: 'Danger' },
    { value: 'info-circle-fill', label: 'Info' },
    { value: 'star-fill', label: 'Star' },
    { value: 'flag-fill', label: 'Flag' }
  ];
  
  // Add a new state variable for card icon
  let newCardIcon = '';
  
  // Remove this duplicate declaration
  // const iconOptions = [
  //   { value: '', label: 'None' },
  //   { value: 'exclamation-triangle-fill', label: 'Warning' },
  //   { value: 'exclamation-circle-fill', label: 'Danger' },
  //   { value: 'info-circle-fill', label: 'Info' },
  //   { value: 'star-fill', label: 'Star' },
  //   { value: 'flag-fill', label: 'Flag' }
  // ];
  
  // Add a flag to identify the Done column
  let doneColumnId = null;
  
  onMount(async () => {
    await loadData();
    await loadTheme();
    
    // Check if a Done column already exists, otherwise create one
    ensureDoneColumn();
  });
  
  // Function to ensure a Done column exists
  async function ensureDoneColumn() {
    const doneColumn = $currentColumns.find(col => col.name === 'Done' && col.isFixed);
    
    if (!doneColumn) {
      // Create a fixed Done column
      const id = await createColumn('Done', $currentBoard.id, 'green', true);
      doneColumnId = id;
    } else {
      doneColumnId = doneColumn.id;
    }
  }
  
  // Get cards for a specific column
  function getColumnCards(columnId) {
    return $cards
      .filter(card => card.columnId === columnId)
      .sort((a, b) => a.order - b.order);
  }
  
  // Handle drag start
  // Handle drag start for cards
  function handleDragStart(card, event) {
    // Stop event propagation to prevent column drag
    event.stopPropagation();
    draggedCard = card;
  }
  
  // Handle drag over
  function handleDragOver(e, columnId) {
    e.preventDefault();
    dragOverColumn = columnId;
  }
  
  // Handle drop
  function handleDrop(e, columnId) {
    e.preventDefault();
    if (draggedCard && dragOverColumn) {
      const columnCards = getColumnCards(columnId);
      const newOrder = columnCards.length;
      moveCard(draggedCard.id, columnId, newOrder);
      draggedCard = null;
      dragOverColumn = null;
    }
  }
  
  // Handle adding a new column
  function handleAddColumn() {
    if (newColumnName.trim()) {
      createColumn(newColumnName.trim(), $currentBoard.id, newColumnColor, false);
      newColumnName = '';
      newColumnColor = 'blue';
      showNewColumnModal = false;
    }
  }
  
  // Handle adding a new card
  function handleAddCard() {
    if (newCardTitle.trim()) {
      createCard(
        newCardTitle.trim(), 
        newCardDescription.trim(), 
        targetColumnId, 
        newCardColor,
        newCardIcon // Add the icon
      );
      newCardTitle = '';
      newCardDescription = '';
      newCardColor = 'blue';
      newCardIcon = '';
      showNewCardModal = false;
    }
  }
  
  // Handle editing a card
  function handleEditCard() {
    if (editingCard && newCardTitle.trim()) {
      updateCard({
        ...editingCard,
        title: newCardTitle.trim(),
        description: newCardDescription.trim(),
        color: newCardColor,
        icon: newCardIcon // Add the icon
      });
      showEditCardModal = false;
    }
  }
  
  // Handle editing a column
  function handleEditColumn() {
    if (editingColumn && newColumnName.trim()) {
      updateColumn({
        ...editingColumn,
        name: newColumnName.trim(),
        color: newColumnColor
      });
      showEditColumnModal = false;
    }
  }
  
  // Open edit card modal
  function openEditCardModal(card) {
    editingCard = card;
    newCardTitle = card.title;
    newCardDescription = card.description;
    newCardColor = card.color || 'blue';
    newCardIcon = card.icon || ''; // Add this line
    showEditCardModal = true;
  }
  
  // Open edit column modal
  function openEditColumnModal(column) {
    editingColumn = column;
    newColumnName = column.name;
    newColumnColor = column.color || 'blue';
    showEditColumnModal = true;
  }
  
  // Open new card modal for a specific column
  function openNewCardModal(columnId) {
    // Reset form fields
    newCardTitle = '';
    newCardDescription = '';
    newCardColor = 'blue';
    newCardIcon = '';
    
    // Set the target column ID
    targetColumnId = columnId;
    
    showNewCardModal = true;
  }
  
  // Open global new card modal
  function openGlobalNewCardModal() {
    // Reset form fields
    newCardTitle = '';
    newCardDescription = '';
    newCardColor = 'blue';
    newCardIcon = '';
    
    // Set default target column to the first available non-fixed column
    const regularColumns = $currentColumns.filter(col => !col.isFixed);
    if (regularColumns && regularColumns.length > 0) {
      targetColumnId = regularColumns[0].id;
    }
    
    showNewCardModal = true;
  }
  
  // State for board title editing
  let isEditingBoardTitle = false;
  let editedBoardTitle = '';
  
  // Start editing board title
  function startEditingBoardTitle() {
    editedBoardTitle = $currentBoard.name;
    isEditingBoardTitle = true;
    // Focus the input after the DOM updates
    setTimeout(() => {
      document.getElementById('boardTitleInput').focus();
    }, 0);
  }
  
  // Save board title
  function saveBoardTitle() {
    if (editedBoardTitle.trim() && editedBoardTitle !== $currentBoard.name) {
      updateBoardName($currentBoard.id, editedBoardTitle.trim());
    } else {
      editedBoardTitle = $currentBoard.name;
    }
    isEditingBoardTitle = false;
  }
  
  // Handle Enter key press on board title input
  function handleBoardTitleKeydown(event) {
    if (event.key === 'Enter') {
      saveBoardTitle();
    } else if (event.key === 'Escape') {
      editedBoardTitle = $currentBoard.name;
      isEditingBoardTitle = false;
    }
  }
  
  // Handle column drag start
  function handleColumnDragStart(column, event) {
    // Only allow column drag if we're not dragging a card
    if (draggedCard) {
      event.preventDefault();
      return;
    }
    
    draggedColumn = column;
    // Set data transfer for Firefox compatibility
    event.dataTransfer.setData('text/plain', column.id);
  }
  
  // Handle column drag end
  function handleColumnDragEnd(event) {
    // Remove visual indicators
    const columns = document.querySelectorAll('.kanban-column');
    columns.forEach(col => col.classList.remove('column-drag-over'));
    
    draggedColumn = null;
    dragOverColumnIndex = null;
  }
  
  // Handle column drag over
  function handleColumnDragOver(e, columnIndex) {
    e.preventDefault();
    if (!draggedColumn) return;
    
    dragOverColumnIndex = columnIndex;
    
    // Add visual indicator for drop position
    const columns = document.querySelectorAll('.kanban-column');
    columns.forEach((col, idx) => {
      if (idx === columnIndex && idx !== $currentColumns.findIndex(c => c.id === draggedColumn.id)) {
        col.classList.add('column-drag-over');
      } else {
        col.classList.remove('column-drag-over');
      }
    });
  }
  
  // Handle column drop
  function handleColumnDrop(e, columnIndex) {
    e.preventDefault();
    if (!draggedColumn) return;
    
    // Remove visual indicators
    const columns = document.querySelectorAll('.kanban-column');
    columns.forEach(col => col.classList.remove('column-drag-over'));
    
    const sourceIndex = $currentColumns.findIndex(c => c.id === draggedColumn.id);
    if (sourceIndex !== columnIndex) {
      // Call the moveColumn function from the store
      moveColumn(draggedColumn.id, columnIndex);
    }
    
    draggedColumn = null;
    dragOverColumnIndex = null;
  }
  
  // Handle column deletion
  function handleDeleteColumn(column) {
    if (column.id === doneColumnId) {
      alert('The Done column cannot be deleted.');
      return;
    }
    
    const columnCards = getColumnCards(column.id);
    if (columnCards.length === 0) {
      // Only delete if the column has no cards
      deleteColumn(column.id);
    } else {
      alert('Cannot delete a column that contains cards. Please move or delete all cards first.');
    }
  }

  // Add this near the top of your script section
  let themeDropdownOpen = false;
  
  // Function to toggle theme dropdown
  function toggleThemeDropdown() {
    themeDropdownOpen = !themeDropdownOpen;
  }
  
  // Function to close dropdown when clicking outside
  function handleClickOutside(event) {
    if (themeDropdownOpen && !event.target.closest('#themeDropdown') && !event.target.closest('.theme-dropdown-menu')) {
      themeDropdownOpen = false;
    }
  }
  
  // Remove this duplicate onMount function
  // onMount(async () => {
  //   await loadData();
  //   await loadTheme();
  //   
  //   // Check if a Done column already exists, otherwise create one
  //   ensureDoneColumn();
  //   
  //   // Add event listener for clicks outside dropdown
  //   document.addEventListener('click', handleClickOutside);
  //   
  //   return () => {
  //     document.removeEventListener('click', handleClickOutside);
  //   };
  // });

  // Update the original onMount function to include the click handler
  onMount(async () => {
    await loadData();
    await loadTheme();
    
    // Check if a Done column already exists, otherwise create one
    ensureDoneColumn();
    
    // Add event listener for clicks outside dropdown
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });
</script>


<div class="container-fluid py-4">
  {#if $currentBoard}
    <div class="d-flex justify-content-between align-items-center mb-4">
      {#if isEditingBoardTitle}
        <div class="input-group" style="max-width: 500px;">
          <input 
            type="text" 
            class="form-control form-control-lg" 
            id="boardTitleInput"
            bind:value={editedBoardTitle} 
            on:blur={saveBoardTitle}
            on:keydown={handleBoardTitleKeydown}
          />
          <button class="btn btn-outline-secondary" type="button" on:click={saveBoardTitle}>
            <i class="bi bi-check-lg"></i>
          </button>
        </div>
      {:else}
        <h1 class="board-title" on:click={startEditingBoardTitle}>
          {$currentBoard.name}
          <small><i class="bi bi-pencil text-muted ms-2"></i></small>
        </h1>
      {/if}
      <div class="d-flex gap-2 align-items-center">
        <!-- Theme Switcher (custom implementation) -->
        <div class="dropdown position-relative">
          <button 
            class="btn btn-outline-secondary" 
            type="button" 
            id="themeDropdown" 
            on:click|stopPropagation={toggleThemeDropdown}
          >
            <i class="bi bi-palette"></i>
          </button>
          {#if themeDropdownOpen}
            <div class="theme-dropdown-menu dropdown-menu dropdown-menu-end show position-absolute" style="top: 100%; right: 0; z-index: 1000;">
              {#each themes as theme}
                <button 
                  class="dropdown-item" 
                  class:active={$currentTheme === theme.id}
                  on:click={() => {
                    saveTheme(theme.id);
                    themeDropdownOpen = false;
                  }}
                >
                  {theme.name}
                </button>
              {/each}
            </div>
          {/if}
        </div>
        
        <button class="btn btn-success" on:click={() => openGlobalNewCardModal()}>
          <i class="bi bi-plus-lg"></i> Add Card
        </button>
        <button class="btn btn-primary" on:click={() => showNewColumnModal = true}>
          <i class="bi bi-plus-lg"></i> Add Column
        </button>
      </div>
    </div>
    
    <div class="kanban-container">
      <!-- Regular columns (non-fixed) -->
      <div class="regular-columns">
        {#each $currentColumns.filter(col => !col.isFixed) as column, columnIndex (column.id)}
          <div 
            class="kanban-column column-{column.color || 'blue'}" 
            draggable="true"
            on:dragstart={(e) => handleColumnDragStart(column, e)}
            on:dragend={(e) => handleColumnDragEnd(e)}
            on:dragover={(e) => handleColumnDragOver(e, columnIndex)}
            on:drop={(e) => handleColumnDrop(e, columnIndex)}
            class:drag-over={dragOverColumn === column.id}
            class:column-dragging={draggedColumn && draggedColumn.id === column.id}
          >
            <div class="kanban-column-header d-flex justify-content-between align-items-center">
              <span class="column-handle"><i class="bi bi-grip-horizontal me-2"></i>{column.name}</span>
              <div>
                <button class="btn btn-sm btn-outline-danger me-1" on:click={() => handleDeleteColumn(column)} title="Delete column (only if empty)">
                  <i class="bi bi-trash"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary me-1" on:click={() => openEditColumnModal(column)}>
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-primary" on:click={() => openNewCardModal(column.id)}>
                  <i class="bi bi-plus"></i>
                </button>
              </div>
            </div>
            
            <div 
              class="kanban-cards"
              on:dragover={(e) => handleDragOver(e, column.id)}
              on:drop={(e) => handleDrop(e, column.id)}
            >
              {#each getColumnCards(column.id) as card (card.id)}
                <div 
                  class="kanban-card card-{card.color || 'blue'}" 
                  draggable="true"
                  on:dragstart={(e) => handleDragStart(card, e)}
                  on:click={() => openEditCardModal(card)}
                >
                  <div class="card-title">
                    {#if card.icon}
                      <i class="bi bi-{card.icon} me-1 card-icon"></i>
                    {/if}
                    {card.title}
                  </div>
                  {#if card.description}
                    <div class="card-description">{card.description}</div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
      
      <!-- Fixed columns -->
      <div class="fixed-columns">
        {#each $currentColumns.filter(col => col.isFixed) as column (column.id)}
          <div class="kanban-column column-{column.color || 'green'} fixed-column">
            <div class="kanban-column-header d-flex justify-content-between align-items-center">
              <span><i class="bi bi-check-circle me-2"></i>{column.name}</span>
              <div>
                <button class="btn btn-sm btn-outline-secondary me-1" on:click={() => openEditColumnModal(column)}>
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-primary" on:click={() => openNewCardModal(column.id)}>
                  <i class="bi bi-plus"></i>
                </button>
              </div>
            </div>
            
            <div 
              class="kanban-cards"
              on:dragover={(e) => handleDragOver(e, column.id)}
              on:drop={(e) => handleDrop(e, column.id)}
            >
              {#each getColumnCards(column.id) as card (card.id)}
                <div 
                  class="kanban-card card-green done-card" 
                  draggable="true"
                  on:dragstart={(e) => handleDragStart(card, e)}
                  on:click={() => openEditCardModal(card)}
                >
                  <div class="card-title">
                    <i class="bi bi-check-circle-fill text-success me-1"></i>
                    {#if card.icon}
                      <i class="bi bi-{card.icon} me-1 card-icon"></i>
                    {/if}
                    <span class="text-decoration-line-through">{card.title}</span>
                  </div>
                  {#if card.description}
                    <div class="card-description">{card.description}</div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="text-center my-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  {/if}
</div>

<!-- New Column Modal -->
<div class="modal fade" class:show={showNewColumnModal} class:d-block={showNewColumnModal} tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Add New Column</h5>
        <button type="button" class="btn-close" on:click={() => showNewColumnModal = false}></button>
      </div>
      <div class="modal-body">
        <div class="mb-3">
          <label for="columnName" class="form-label">Column Name</label>
          <input type="text" class="form-control" id="columnName" bind:value={newColumnName}>
        </div>
        <div class="mb-3">
          <label for="columnColor" class="form-label">Column Color</label>
          <select class="form-select" id="columnColor" bind:value={newColumnColor}>
            {#each colorOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" on:click={() => showNewColumnModal = false}>Cancel</button>
        <button type="button" class="btn btn-primary" on:click={handleAddColumn}>Add Column</button>
      </div>
    </div>
  </div>
</div>

<!-- Edit Column Modal -->
<div class="modal fade" class:show={showEditColumnModal} class:d-block={showEditColumnModal} tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Edit Column</h5>
        <button type="button" class="btn-close" on:click={() => showEditColumnModal = false}></button>
      </div>
      <div class="modal-body">
        <div class="mb-3">
          <label for="editColumnName" class="form-label">Column Name</label>
          <input type="text" class="form-control" id="editColumnName" bind:value={newColumnName}>
        </div>
        <div class="mb-3">
          <label for="editColumnColor" class="form-label">Column Color</label>
          <select class="form-select" id="editColumnColor" bind:value={newColumnColor}>
            {#each colorOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" on:click={() => showEditColumnModal = false}>Cancel</button>
        <button type="button" class="btn btn-primary" on:click={handleEditColumn}>Save Changes</button>
      </div>
    </div>
  </div>
</div>

<!-- Update the New Card Modal -->
<div class="modal fade" class:show={showNewCardModal} class:d-block={showNewCardModal} tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Add New Card</h5>
        <button type="button" class="btn-close" on:click={() => showNewCardModal = false}></button>
      </div>
      <div class="modal-body">
        <div class="mb-3">
          <label for="cardTitle" class="form-label">Card Title</label>
          <input type="text" class="form-control" id="cardTitle" bind:value={newCardTitle}>
        </div>
        <div class="mb-3">
          <label for="cardDescription" class="form-label">Description (optional)</label>
          <textarea class="form-control" id="cardDescription" rows="3" bind:value={newCardDescription}></textarea>
        </div>
        <div class="mb-3">
          <label for="cardColumn" class="form-label">Column</label>
          <select class="form-select" id="cardColumn" bind:value={targetColumnId}>
            {#each $currentColumns.filter(column => !column.isFixed) as column}
              <option value={column.id}>{column.name}</option>
            {/each}
          </select>
        </div>
        <div class="row">
          <div class="col-md-6 mb-3">
            <label for="cardColor" class="form-label">Card Color</label>
            <select class="form-select" id="cardColor" bind:value={newCardColor}>
              {#each colorOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </div>
          <div class="col-md-6 mb-3">
            <label for="cardIcon" class="form-label">Card Icon</label>
            <select class="form-select" id="cardIcon" bind:value={newCardIcon}>
              {#each iconOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </div>
        </div>
        {#if newCardIcon}
          <div class="mb-3 text-center">
            <div class="icon-preview p-2 border rounded">
              <i class="bi bi-{newCardIcon} fs-4"></i>
              <span class="ms-2">Icon Preview</span>
            </div>
          </div>
        {/if}
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" on:click={() => showNewCardModal = false}>Cancel</button>
        <button type="button" class="btn btn-primary" on:click={handleAddCard}>Add Card</button>
      </div>
    </div>
  </div>
</div>

<!-- Update the Edit Card Modal -->
<div class="modal fade" class:show={showEditCardModal} class:d-block={showEditCardModal} tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Edit Card</h5>
        <button type="button" class="btn-close" on:click={() => showEditCardModal = false}></button>
      </div>
      <div class="modal-body">
        <div class="mb-3">
          <label for="editCardTitle" class="form-label">Card Title</label>
          <input type="text" class="form-control" id="editCardTitle" bind:value={newCardTitle}>
        </div>
        <div class="mb-3">
          <label for="editCardDescription" class="form-label">Description</label>
          <textarea class="form-control" id="editCardDescription" rows="3" bind:value={newCardDescription}></textarea>
        </div>
        <div class="row">
          <div class="col-md-6 mb-3">
            <label for="editCardColor" class="form-label">Card Color</label>
            <select class="form-select" id="editCardColor" bind:value={newCardColor}>
              {#each colorOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </div>
          <div class="col-md-6 mb-3">
            <label for="editCardIcon" class="form-label">Card Icon</label>
            <select class="form-select" id="editCardIcon" bind:value={newCardIcon}>
              {#each iconOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </div>
        </div>
        {#if newCardIcon}
          <div class="mb-3 text-center">
            <div class="icon-preview p-2 border rounded">
              <i class="bi bi-{newCardIcon} fs-4"></i>
              <span class="ms-2">Icon Preview</span>
            </div>
          </div>
        {/if}
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-danger me-auto" on:click={() => { deleteCard(editingCard.id); showEditCardModal = false; }}>Delete</button>
        <button type="button" class="btn btn-secondary" on:click={() => showEditCardModal = false}>Cancel</button>
        <button type="button" class="btn btn-primary" on:click={handleEditCard}>Save Changes</button>
      </div>
    </div>
  </div>
</div>

<!-- Modal backdrop -->
{#if showNewColumnModal || showNewCardModal || showEditCardModal || showEditColumnModal}
  <div class="modal-backdrop fade show"></div>
{/if}

<!-- At the bottom of your file -->
<style lang="css">
  /* Modal styles for when Bootstrap JS is not initialized */
  .modal.show {
    display: block;
    background-color: rgba(0, 0, 0, 0.5);
  }
  
  /* Board title styles */
  .board-title {
    cursor: pointer;
    display: inline-flex;
    align-items: center;
  }
  
  .board-title small {
    font-size: 0.5em;
    opacity: 0.3;
    transition: opacity 0.2s;
  }
  
  .board-title:hover small {
    opacity: 1;
  }
  
  /* Column drag styles */
  .column-handle {
    cursor: grab;
    display: flex;
    align-items: center;
  }
  
  .column-dragging {
    opacity: 0.6;
    border: 2px dashed #666;
  }
  
  .column-drag-over {
    border-left: 3px solid #3498db;
    box-shadow: -5px 0 15px rgba(52, 152, 219, 0.3);
    background-color: rgba(52, 152, 219, 0.1);
    transform: translateX(5px);
    transition: all 0.2s ease;
  }
  
  /* When dragging a column, make sure cards don't interfere */
  .column-dragging .kanban-card {
    pointer-events: none;
  }
  
  /* Add a visual indicator for draggable columns */
  .kanban-column-header:hover .bi-grip-horizontal {
    opacity: 1;
  }
  
  .bi-grip-horizontal {
    opacity: 0.5;
    transition: opacity 0.2s;
  }
  
  /* Kanban layout */
  .kanban-container {
    display: flex;
    width: 100%;
    height: calc(100vh - 150px);
    overflow: hidden;
    flex-direction: row; /* Set to row by default for horizontal layout */
  }
  
  .regular-columns {
    display: flex; /* Use flex for horizontal layout */
    gap: 1rem;
    overflow-x: auto;
    flex-grow: 1;
    padding-right: 1rem;
    padding-bottom: 0;
  }
  
  .fixed-columns {
    width: 280px;
    margin-left: 1rem;
    border-left: 2px solid #ddd;
    flex-shrink: 0;
    height: 100%;
    overflow-y: auto;
  }
  
  .fixed-column {
    background-color: rgba(0, 128, 0, 0.05);
    height: 100%;
  }
  
  /* Ensure columns have proper sizing */
  .kanban-column {
    min-width: 280px;
    width: 280px;
    display: flex;
    flex-direction: column;
    background-color: #f8f9fa;
    border-radius: 0.25rem;
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    height: 100%;
  }
  
  .kanban-column-header {
    padding: 0.75rem;
    border-bottom: 1px solid #dee2e6;
    font-weight: bold;
    flex-shrink: 0;
  }
  
  .kanban-cards {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
  }
  
  .kanban-card {
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    background-color: white;
    border-radius: 0.25rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    cursor: pointer;
  }
  
  .kanban-card:hover {
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }
  
  .card-title {
    font-weight: bold;
    margin-bottom: 0.25rem;
  }
  
  .card-description {
    font-size: 0.875rem;
    color: #6c757d;
  }
  
  /* For smaller screens, switch to grid layout */
  @media (max-width: 1399px) {
    .kanban-container {
      flex-direction: column;
    }
    
    .regular-columns {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      padding-right: 0;
      padding-bottom: 1rem;
      overflow-y: auto;
    }
    
    .kanban-column {
      min-width: 0;
      width: auto;
      height: 300px;
    }
    
    .fixed-columns {
      width: 100%;
      margin-top: 1rem;
      margin-left: 0;
      border-left: none;
      border-top: 2px solid #ddd;
    }
  }
  
  /* For mobile, stack columns */
  @media (max-width: 767px) {
    .regular-columns {
      grid-template-columns: 1fr;
    }
  }
  
  /* Card colors */
  .card-blue { border-left: 4px solid #007bff; }
  .card-green { border-left: 4px solid #28a745; }
  .card-red { border-left: 4px solid #dc3545; }
  .card-purple { border-left: 4px solid #6f42c1; }
  .card-orange { border-left: 4px solid #fd7e14; }
  .card-teal { border-left: 4px solid #20c997; }
  
  /* Column colors */
  .column-blue .kanban-column-header { border-top: 3px solid #007bff; }
  .column-green .kanban-column-header { border-top: 3px solid #28a745; }
  .column-red .kanban-column-header { border-top: 3px solid #dc3545; }
  .column-purple .kanban-column-header { border-top: 3px solid #6f42c1; }
  .column-orange .kanban-column-header { border-top: 3px solid #fd7e14; }
  .column-teal .kanban-column-header { border-top: 3px solid #20c997; }
  
  /* Done card styling */
  .done-card {
    background-color: #f8fff8;
    opacity: 0.85;
    transition: opacity 0.2s;
  }
  
  .done-card:hover {
    opacity: 1;
  }
  
  .done-card .card-description {
    color: #8a8a8a;
  }

  /* Card icon styles */
  .card-icon {
    display: inline-block;
    margin-right: 0.25rem;
  }
  
  .icon-preview {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: #f8f9fa;
  }
  
  /* Icon colors based on type */
  .bi-exclamation-triangle-fill {
    color: #ffc107; /* warning yellow */
  }
  
  .bi-exclamation-circle-fill {
    color: #dc3545; /* danger red */
  }
  
  .bi-info-circle-fill {
    color: #0dcaf0; /* info blue */
  }
  
  .bi-star-fill {
    color: #fd7e14; /* orange */
  }
  
  .bi-flag-fill {
    color: #6f42c1; /* purple */
  }
  
  /* Add theme-specific overrides */
  :global(body) {
    transition: background-color 0.3s ease, color 0.3s ease;
  }
  
  :global(.kanban-column),
  :global(.kanban-card),
  :global(.modal-content) {
    transition: background-color 0.3s ease, box-shadow 0.3s ease, border 0.3s ease;
  }
</style>