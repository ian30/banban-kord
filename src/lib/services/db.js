// IndexedDB service for Kanban board

const DB_NAME = 'kanban_db';
const DB_VERSION = 2; // Increment version for schema update
const STORES = {
  boards: 'boards',
  columns: 'columns',
  cards: 'cards',
  settings: 'settings' // Add settings store
};

// Initialize the database
export function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      reject('Error opening database: ' + event.target.error);
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores with auto-incrementing IDs
      if (!db.objectStoreNames.contains(STORES.boards)) {
        const boardsStore = db.createObjectStore(STORES.boards, { keyPath: 'id', autoIncrement: true });
        boardsStore.createIndex('name', 'name', { unique: false });
      }
      
      if (!db.objectStoreNames.contains(STORES.columns)) {
        const columnsStore = db.createObjectStore(STORES.columns, { keyPath: 'id', autoIncrement: true });
        columnsStore.createIndex('boardId', 'boardId', { unique: false });
        columnsStore.createIndex('order', 'order', { unique: false });
        // Add color field
        columnsStore.createIndex('color', 'color', { unique: false });
      }
      
      if (!db.objectStoreNames.contains(STORES.cards)) {
        const cardsStore = db.createObjectStore(STORES.cards, { keyPath: 'id', autoIncrement: true });
        cardsStore.createIndex('columnId', 'columnId', { unique: false });
        cardsStore.createIndex('order', 'order', { unique: false });
        // Add color field
        cardsStore.createIndex('color', 'color', { unique: false });
      }
      
      // Add settings store for themes and other app settings
      if (!db.objectStoreNames.contains(STORES.settings)) {
        const settingsStore = db.createObjectStore(STORES.settings, { keyPath: 'id' });
      }
    };
  });
}

// Generic function to perform a database operation
function dbOperation(storeName, mode, operation) {
  return new Promise((resolve, reject) => {
    initDB().then(db => {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      
      const request = operation(store);
      
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
      
      request.onerror = (event) => {
        reject('Error in database operation: ' + event.target.error);
      };
    }).catch(error => reject(error));
  });
}

// Board operations
export function getBoards() {
  return dbOperation(STORES.boards, 'readonly', store => store.getAll());
}

export function addBoard(board) {
  return dbOperation(STORES.boards, 'readwrite', store => store.add(board));
}

export function updateBoard(board) {
  return dbOperation(STORES.boards, 'readwrite', store => store.put(board));
}

export function deleteBoard(id) {
  return dbOperation(STORES.boards, 'readwrite', store => store.delete(id));
}

// Column operations
export function getColumns(boardId) {
  return dbOperation(STORES.columns, 'readonly', store => {
    const index = store.index('boardId');
    return index.getAll(boardId);
  });
}

export function addColumn(column) {
  return dbOperation(STORES.columns, 'readwrite', store => store.add(column));
}

export function updateColumn(column) {
  return dbOperation(STORES.columns, 'readwrite', store => store.put(column));
}

export function deleteColumn(id) {
  return dbOperation(STORES.columns, 'readwrite', store => store.delete(id));
}

// Card operations
export function getCards(columnId) {
  return dbOperation(STORES.cards, 'readonly', store => {
    const index = store.index('columnId');
    return index.getAll(columnId);
  });
}

export function addCard(card) {
  return dbOperation(STORES.cards, 'readwrite', store => store.add(card));
}

export function updateCard(card) {
  return dbOperation(STORES.cards, 'readwrite', store => store.put(card));
}

export function deleteCard(id) {
  return dbOperation(STORES.cards, 'readwrite', store => store.delete(id));
}

// Settings operations
export function getSetting(id) {
  return dbOperation(STORES.settings, 'readonly', store => store.get(id));
}

export function saveSetting(setting) {
  return dbOperation(STORES.settings, 'readwrite', store => store.put(setting));
}

// Initialize with default data if empty
export async function initializeDefaultData() {
  const boards = await getBoards();
  
  if (boards.length === 0) {
    // Create a default board
    const boardId = await addBoard({ name: 'My First Board' });
    
    // Create default columns with colors
    const columns = [
      { name: 'To Do', boardId, order: 0, color: 'blue' },
      { name: 'In Progress', boardId, order: 1, color: 'orange' },
      { name: 'Done', boardId, order: 2, color: 'green' }
    ];
    
    const columnIds = [];
    for (const column of columns) {
      const columnId = await addColumn(column);
      columnIds.push(columnId);
    }
    
    // Add some sample cards with colors
    const sampleCards = [
      { title: 'Research project requirements', description: 'Gather all necessary information', columnId: columnIds[0], order: 0, color: 'blue' },
      { title: 'Create project plan', description: 'Define milestones and timeline', columnId: columnIds[0], order: 1, color: 'purple' },
      { title: 'Design UI mockups', description: 'Create wireframes for all screens', columnId: columnIds[1], order: 0, color: 'teal' },
      { title: 'Set up development environment', description: 'Install all required tools', columnId: columnIds[2], order: 0, color: 'green' }
    ];
    
    for (const card of sampleCards) {
      await addCard(card);
    }
    
    // Initialize default settings
    await saveSetting({ id: 'theme', value: 'light' });
    
    return boardId;
  }
  
  return boards[0].id;
}