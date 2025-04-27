import { writable, derived } from 'svelte/store';
import * as db from '../services/db.js';

// Create stores for our data
export const boards = writable([]);
export const columns = writable([]);
export const cards = writable([]);
export const currentBoardId = writable(null);

// Derived store for the current board
export const currentBoard = derived(
  [boards, currentBoardId],
  ([$boards, $currentBoardId]) => {
    return $boards.find(board => board.id === $currentBoardId) || null;
  }
);

// Derived store for columns of the current board
export const currentColumns = derived(
  [columns, currentBoardId],
  ([$columns, $currentBoardId]) => {
    // First get all columns for the current board
    const boardColumns = $columns.filter(column => column.boardId === $currentBoardId);
    
    // Separate fixed columns from regular columns
    const fixedColumns = boardColumns.filter(col => col.isFixed);
    const regularColumns = boardColumns.filter(col => !col.isFixed);
    
    // Sort regular columns by order
    const sortedRegularColumns = regularColumns.sort((a, b) => a.order - b.order);
    
    // Return regular columns first, then fixed columns
    return [...sortedRegularColumns, ...fixedColumns];
  }
);

// Load all data
export async function loadData() {
  try {
    // Initialize default data if needed
    const defaultBoardId = await db.initializeDefaultData();
    
    // Load boards
    const boardsData = await db.getBoards();
    boards.set(boardsData);
    
    // Set current board
    currentBoardId.set(defaultBoardId);
    
    // Load columns for the current board
    const columnsData = await db.getColumns(defaultBoardId);
    columns.set(columnsData);
    
    // Load cards for all columns
    const allCards = [];
    for (const column of columnsData) {
      const columnCards = await db.getCards(column.id);
      allCards.push(...columnCards);
    }
    cards.set(allCards);
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// Board operations
export async function createBoard(name) {
  try {
    const id = await db.addBoard({ name });
    boards.update(boards => [...boards, { id, name }]);
    return id;
  } catch (error) {
    console.error('Error creating board:', error);
    throw error;
  }
}

export async function updateBoardName(id, name) {
  try {
    await db.updateBoard({ id, name });
    boards.update(boards => 
      boards.map(board => board.id === id ? { ...board, name } : board)
    );
  } catch (error) {
    console.error('Error updating board:', error);
    throw error;
  }
}

export async function deleteBoard(id) {
  try {
    await db.deleteBoard(id);
    boards.update(boards => boards.filter(board => board.id !== id));
  } catch (error) {
    console.error('Error deleting board:', error);
    throw error;
  }
}

// Column operations
export async function createColumn(name, boardId, color = 'blue', isFixed = false) {
  try {
    // Get the highest order value
    let maxOrder = 0;
    columns.update(cols => {
      const boardColumns = cols.filter(col => col.boardId === boardId);
      if (boardColumns.length > 0) {
        maxOrder = Math.max(...boardColumns.map(col => col.order)) + 1;
      }
      return cols;
    });
    
    const column = { name, boardId, order: maxOrder, color, isFixed };
    const id = await db.addColumn(column);
    
    columns.update(cols => [...cols, { ...column, id }]);
    return id;
  } catch (error) {
    console.error('Error creating column:', error);
    throw error;
  }
}

// Card operations
export async function createCard(title, description, columnId, color = 'blue', icon = '') {
  try {
    // Get the highest order value
    let maxOrder = 0;
    cards.update(cards => {
      const columnCards = cards.filter(card => card.columnId === columnId);
      if (columnCards.length > 0) {
        maxOrder = Math.max(...columnCards.map(card => card.order)) + 1;
      }
      return cards;
    });
    
    const card = { title, description, columnId, order: maxOrder, color, icon };
    const id = await db.addCard(card);
    
    cards.update(cards => [...cards, { ...card, id }]);
    return id;
  } catch (error) {
    console.error('Error creating card:', error);
    throw error;
  }
}

export async function updateColumn(column) {
  try {
    await db.updateColumn(column);
    columns.update(cols => 
      cols.map(col => col.id === column.id ? { ...col, ...column } : col)
    );
  } catch (error) {
    console.error('Error updating column:', error);
    throw error;
  }
}

// Add this new function to move/reorder columns
export async function moveColumn(columnId, newIndex) {
  try {
    columns.update(cols => {
      const columnToMove = cols.find(col => col.id === columnId);
      if (!columnToMove) return cols;
      
      const boardId = columnToMove.boardId;
      const boardColumns = cols.filter(col => col.boardId === boardId)
        .sort((a, b) => a.order - b.order);
      
      const oldIndex = boardColumns.findIndex(col => col.id === columnId);
      
      // Remove the column from its current position
      const [removed] = boardColumns.splice(oldIndex, 1);
      // Insert it at the new position
      boardColumns.splice(newIndex, 0, removed);
      
      // Update the order of all columns
      const updatedColumns = cols.map(col => {
        if (col.boardId !== boardId) return col;
        
        const indexInBoard = boardColumns.findIndex(c => c.id === col.id);
        if (indexInBoard === -1) return col;
        
        const updatedCol = { ...col, order: indexInBoard };
        // Update in database
        db.updateColumn(updatedCol);
        return updatedCol;
      });
      
      return updatedColumns;
    });
  } catch (error) {
    console.error('Error moving column:', error);
    throw error;
  }
}

export async function deleteColumn(columnId) {
  try {
    // Delete the column from the database
    await db.deleteColumn(columnId);
    
    // Update the store
    columns.update(cols => cols.filter(col => col.id !== columnId));
  } catch (error) {
    console.error('Error deleting column:', error);
    throw error;
  }
}

// Card operations

export async function updateCard(card) {
  try {
    await db.updateCard(card);
    cards.update(cards => 
      cards.map(c => c.id === card.id ? { ...c, ...card } : c)
    );
  } catch (error) {
    console.error('Error updating card:', error);
    throw error;
  }
}

export async function deleteCard(id) {
  try {
    await db.deleteCard(id);
    cards.update(cards => cards.filter(card => card.id !== id));
  } catch (error) {
    console.error('Error deleting card:', error);
    throw error;
  }
}

export async function moveCard(cardId, targetColumnId, newOrder) {
  try {
    cards.update(cards => {
      const cardToMove = cards.find(card => card.id === cardId);
      if (!cardToMove) return cards;
      
      const updatedCard = { 
        ...cardToMove, 
        columnId: targetColumnId, 
        order: newOrder 
      };
      
      // Update in database
      db.updateCard(updatedCard);
      
      // Update in store
      return cards.map(card => card.id === cardId ? updatedCard : card);
    });
  } catch (error) {
    console.error('Error moving card:', error);
    throw error;
  }
}
