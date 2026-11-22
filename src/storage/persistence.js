const DB_NAME = 'tab-zero-memory';
const DB_VERSION = 1;
const STATE_STORE = 'game_state';
const EVENT_STORE = 'game_events';
const STATE_KEY = 'current';
const SNAPSHOT_DEBOUNCE_MS = 250;

let databasePromise = null;
let writeQueue = Promise.resolve();
let pendingSnapshotTimer = null;

function openDatabase() {
  if (databasePromise) {
    return databasePromise;
  }

  databasePromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('当前环境不支持 IndexedDB'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STATE_STORE)) {
        database.createObjectStore(STATE_STORE);
      }
      if (!database.objectStoreNames.contains(EVENT_STORE)) {
        const eventStore = database.createObjectStore(EVENT_STORE, {
          keyPath: 'id',
        });
        eventStore.createIndex('occurredAt', 'occurredAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('无法打开本地记忆数据库'));
    request.onblocked = () =>
      reject(new Error('本地记忆数据库被其他页面占用'));
  });

  return databasePromise;
}

function waitForTransaction(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('本地记忆写入失败'));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('本地记忆写入已中止'));
  });
}

function enqueueWrite(task) {
  const queued = writeQueue.then(task, task);
  writeQueue = queued.catch(() => {});
  return queued;
}

function cancelScheduledSnapshot() {
  if (pendingSnapshotTimer) {
    clearTimeout(pendingSnapshotTimer);
    pendingSnapshotTimer = null;
  }
}

async function writeSnapshotOnly(snapshot) {
  const database = await openDatabase();
  const transaction = database.transaction(STATE_STORE, 'readwrite');
  transaction.objectStore(STATE_STORE).put(snapshot, STATE_KEY);
  await waitForTransaction(transaction);
}

export async function loadPersistedGame() {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      [STATE_STORE, EVENT_STORE],
      'readonly',
    );
    const stateRequest = transaction.objectStore(STATE_STORE).get(STATE_KEY);
    const eventRequest = transaction.objectStore(EVENT_STORE).getAll();

    transaction.oncomplete = () => {
      const events = Array.isArray(eventRequest.result)
        ? [...eventRequest.result].sort((left, right) => {
            const leftTime = Number(left.timestamp) || 0;
            const rightTime = Number(right.timestamp) || 0;
            return leftTime - rightTime;
          })
        : [];

      resolve({
        state: stateRequest.result ?? null,
        events,
      });
    };
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('读取本地记忆失败'));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('读取本地记忆已中止'));
  });
}

export function persistSnapshot(snapshot) {
  cancelScheduledSnapshot();
  return enqueueWrite(() => writeSnapshotOnly(snapshot));
}

export function scheduleSnapshotSave(getSnapshot) {
  cancelScheduledSnapshot();
  pendingSnapshotTimer = setTimeout(() => {
    pendingSnapshotTimer = null;
    const snapshot = getSnapshot();
    enqueueWrite(() => writeSnapshotOnly(snapshot)).catch((error) => {
      console.error('[TAB ZERO] 延迟保存失败', error);
    });
  }, SNAPSHOT_DEBOUNCE_MS);
}

export function persistEventsAndSnapshot(events, snapshot) {
  cancelScheduledSnapshot();

  return enqueueWrite(async () => {
    const database = await openDatabase();
    const transaction = database.transaction(
      [STATE_STORE, EVENT_STORE],
      'readwrite',
    );
    const eventStore = transaction.objectStore(EVENT_STORE);

    events.forEach((event) => {
      eventStore.put(event);
    });
    transaction.objectStore(STATE_STORE).put(snapshot, STATE_KEY);

    await waitForTransaction(transaction);
  });
}

export function resetPersistedGame(snapshot) {
  cancelScheduledSnapshot();

  return enqueueWrite(async () => {
    const database = await openDatabase();
    const transaction = database.transaction(
      [STATE_STORE, EVENT_STORE],
      'readwrite',
    );
    transaction.objectStore(EVENT_STORE).clear();
    transaction.objectStore(STATE_STORE).clear();
    transaction.objectStore(STATE_STORE).put(snapshot, STATE_KEY);
    await waitForTransaction(transaction);
  });
}