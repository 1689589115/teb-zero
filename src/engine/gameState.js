import { ARCHIVE_FILE_BY_ID, ARCHIVE_FILES } from '../data/archive';
import { INITIAL_TERMINAL_LINES } from '../data/commands';
import { PAGE_IDS } from '../data/pages';

export const GAME_STATE_VERSION = 1;

export const STORY_STAGES = {
  WAITING: '等待接入',
  ORIENTATION: '接入阶段',
};

export const INITIAL_METRICS = {
  echoTrust: 42,
  echoFear: 12,
  memoryIntegrity: 76,
  systemStability: 91,
};

export const METRIC_DEFINITIONS = [
  {
    key: 'echoTrust',
    label: '回声信任',
    code: 'TRUST',
    tone: 'green',
  },
  {
    key: 'echoFear',
    label: '回声恐惧',
    code: 'FEAR',
    tone: 'violet',
  },
  {
    key: 'memoryIntegrity',
    label: '记忆完整度',
    code: 'MEMORY',
    tone: 'green',
  },
  {
    key: 'systemStability',
    label: '系统稳定度',
    code: 'STABILITY',
    tone: 'green',
  },
];

export function clampMetric(value) {
  const numericValue = Number.isFinite(value) ? value : 0;
  return Math.min(100, Math.max(0, Math.round(numericValue)));
}

function createPageLifecycle(nowIso) {
  const isHomeOpen = true;
  return PAGE_IDS.reduce((pages, pageId) => {
    const isHome = pageId === 'home';
    pages[pageId] = {
      status: isHome ? 'open' : 'unvisited',
      openedEver: isHome,
      openCount: isHome ? 1 : 0,
      closeCount: 0,
      visitCount: isHome ? 1 : 0,
      lastOpenedAt: isHome ? nowIso : null,
      lastClosedAt: null,
      lastVisitedAt: isHome ? nowIso : null,
    };
    return pages;
  }, {});
}

function createInitialTerminalLine(line, nowIso, index) {
  return {
    id: `terminal-initial-${index}`,
    at: nowIso,
    ...line,
  };
}

export function createInitialState(now = Date.now()) {
  const nowIso = new Date(now).toISOString();

  return {
    version: GAME_STATE_VERSION,
    gameStarted: false,
    activePageId: 'home',
    openTabs: ['home'],
    pages: createPageLifecycle(nowIso),
    metrics: { ...INITIAL_METRICS },
    discoveredClues: [],
    unlockedPages: PAGE_IDS.filter((pageId) => pageId !== 'tabzero'),
    storyStage: STORY_STAGES.WAITING,
    ending: null,
    consumedClues: [],
    pageData: {
      terminal: {
        draft: '',
        lines: INITIAL_TERMINAL_LINES.map((line, index) =>
          createInitialTerminalLine(line, nowIso, index),
        ),
        commandHistory: [],
      },
      archive: {
        selectedFileId: ARCHIVE_FILES[0].id,
      },
      observer: {
        filter: 'all',
      },
    },
    triggeredEchoMessages: [],
    quarantinedFiles: [],
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export function toPersistedState(state) {
  return {
    version: GAME_STATE_VERSION,
    gameStarted: Boolean(state.gameStarted),
    activePageId: state.activePageId,
    openTabs: [...state.openTabs],
    pages: state.pages,
    metrics: state.metrics,
    discoveredClues: state.discoveredClues,
    unlockedPages: state.unlockedPages,
    storyStage: state.storyStage,
    ending: state.ending,
    consumedClues: state.consumedClues,
    pageData: state.pageData,
    triggeredEchoMessages: state.triggeredEchoMessages,
    quarantinedFiles: state.quarantinedFiles,
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
    savedAt: new Date().toISOString(),
  };
}

function normalizePageLifecycle(rawPages, openTabs, freshPages) {
  const normalized = {};

  PAGE_IDS.forEach((pageId) => {
    const fallback = freshPages[pageId];
    const saved = rawPages?.[pageId];
    normalized[pageId] = {
      ...fallback,
      ...(saved && typeof saved === 'object' ? saved : {}),
      status: openTabs.includes(pageId)
        ? 'open'
        : saved?.status === 'closed' || saved?.closeCount > 0
          ? 'closed'
          : saved?.status === 'open'
            ? 'closed'
            : fallback.status,
      openCount: Math.max(0, Number(saved?.openCount) || 0),
      closeCount: Math.max(0, Number(saved?.closeCount) || 0),
      visitCount: Math.max(0, Number(saved?.visitCount) || 0),
      openedEver: Boolean(saved?.openedEver),
    };
  });

  openTabs.forEach((pageId) => {
    normalized[pageId].status = 'open';
    normalized[pageId].openedEver = true;
  });

  return normalized;
}

function normalizeOpenTabs(rawTabs) {
  if (!Array.isArray(rawTabs)) {
    return ['home'];
  }

  return [...new Set(rawTabs.filter((pageId) => PAGE_IDS.includes(pageId)))];
}

export function normalizeRestoredState(rawState) {
  const fresh = createInitialState();
  if (!rawState || typeof rawState !== 'object') {
    return fresh;
  }

  const openTabs = normalizeOpenTabs(rawState.openTabs);
  const activePageId = openTabs.includes(rawState.activePageId)
    ? rawState.activePageId
    : openTabs[0] ?? null;
  const savedTerminal = rawState.pageData?.terminal ?? {};
  const savedArchive = rawState.pageData?.archive ?? {};
  const savedObserver = rawState.pageData?.observer ?? {};

  return {
    ...fresh,
    gameStarted: Boolean(rawState.gameStarted),
    activePageId,
    openTabs,
    pages: normalizePageLifecycle(rawState.pages, openTabs, fresh.pages),
    metrics: {
      echoTrust: clampMetric(rawState.metrics?.echoTrust ?? fresh.metrics.echoTrust),
      echoFear: clampMetric(rawState.metrics?.echoFear ?? fresh.metrics.echoFear),
      memoryIntegrity: clampMetric(
        rawState.metrics?.memoryIntegrity ?? fresh.metrics.memoryIntegrity,
      ),
      systemStability: clampMetric(
        rawState.metrics?.systemStability ?? fresh.metrics.systemStability,
      ),
    },
    discoveredClues: Array.isArray(rawState.discoveredClues)
      ? rawState.discoveredClues
      : [],
    unlockedPages: Array.isArray(rawState.unlockedPages)
      ? [...new Set([...rawState.unlockedPages, 'home'])].filter((pageId) =>
          PAGE_IDS.includes(pageId),
        )
      : fresh.unlockedPages,
    storyStage:
      typeof rawState.storyStage === 'string'
        ? rawState.storyStage
        : fresh.storyStage,
    ending: rawState.ending ?? null,
    consumedClues: Array.isArray(rawState.consumedClues)
      ? rawState.consumedClues
      : [],
    pageData: {
      terminal: {
        draft: typeof savedTerminal.draft === 'string' ? savedTerminal.draft : '',
        lines: Array.isArray(savedTerminal.lines)
          ? savedTerminal.lines
          : fresh.pageData.terminal.lines,
        commandHistory: Array.isArray(savedTerminal.commandHistory)
          ? savedTerminal.commandHistory
          : [],
      },
      archive: {
        selectedFileId: ARCHIVE_FILE_BY_ID[savedArchive.selectedFileId]
          ? savedArchive.selectedFileId
          : fresh.pageData.archive.selectedFileId,
      },
      observer: {
        filter:
          savedObserver.filter &&
          ['all', 'tab', 'command', 'file', 'echo', 'system'].includes(
            savedObserver.filter,
          )
            ? savedObserver.filter
            : 'all',
      },
    },
    triggeredEchoMessages: Array.isArray(rawState.triggeredEchoMessages)
      ? rawState.triggeredEchoMessages
      : [],
    quarantinedFiles: Array.isArray(rawState.quarantinedFiles)
      ? rawState.quarantinedFiles.filter((fileId) => ARCHIVE_FILE_BY_ID[fileId])
      : [],
    createdAt:
      typeof rawState.createdAt === 'string' ? rawState.createdAt : fresh.createdAt,
    updatedAt:
      typeof rawState.updatedAt === 'string' ? rawState.updatedAt : fresh.updatedAt,
  };
}