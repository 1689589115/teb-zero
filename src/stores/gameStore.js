import { create } from 'zustand';
import { ARCHIVE_FILE_BY_ID } from '../data/archive';
import { COMMAND_BY_ID, TERMINAL_COMMANDS } from '../data/commands';
import { EVENT_TYPES } from '../data/events';
import { getPageDefinition, PAGE_IDS } from '../data/pages';
import {
  createBehaviorEvent,
  formatEventTime,
  summarizeEvent,
} from '../engine/behaviorTracker';
import { parseCommand } from '../engine/commandParser';
import { createEchoReply } from '../engine/dialogueEngine';
import { evaluateEnding } from '../engine/endingEngine';
import { BUS_EVENTS, eventBus } from '../engine/eventBus';
import {
  clampMetric,
  createInitialState,
  normalizeRestoredState,
  STORY_STAGES,
  toPersistedState,
} from '../engine/gameState';
import {
  loadPersistedGame,
  persistEventsAndSnapshot,
  persistSnapshot,
  resetPersistedGame,
  scheduleSnapshotSave,
} from '../storage/persistence';

const initialState = createInitialState();
let terminalLineCounter = 0;
let hasReportedStorageError = false;

function createTerminalLine(kind, text) {
  terminalLineCounter += 1;
  return {
    id: `terminal-line-${Date.now()}-${terminalLineCounter}`,
    at: new Date().toISOString(),
    kind,
    text,
  };
}

function reportPersistenceError(error) {
  console.error('[TAB ZERO] 本地记忆保存失败', error);
  if (hasReportedStorageError) {
    return;
  }

  hasReportedStorageError = true;
  useGameStore.setState({
    storageError: '本地记忆保存失败，当前进度可能无法在刷新后恢复。',
  });
}

function persistAction(state, events = []) {
  const snapshot = toPersistedState(state);
  const request = events.length
    ? persistEventsAndSnapshot(events, snapshot)
    : persistSnapshot(snapshot);

  request.catch(reportPersistenceError);
}

function scheduleStateSave() {
  scheduleSnapshotSave(() => toPersistedState(useGameStore.getState()));
}

function publishEvents(events) {
  events.forEach((event) => {
    eventBus.emit(BUS_EVENTS.GAME_EVENT, event);
  });
}

function replaceTerminalLines(pageData, lines) {
  return {
    ...pageData,
    terminal: {
      ...pageData.terminal,
      lines: lines.slice(-180),
    },
  };
}

export const useGameStore = create((set, get) => ({
  ...initialState,
  events: [],
  hydrated: false,
  hydrating: false,
  storageError: null,

  hydrate: async () => {
    if (get().hydrated || get().hydrating) {
      return;
    }

    set({ hydrating: true });

    try {
      const saved = await loadPersistedGame();

      if (saved.state) {
        const restored = normalizeRestoredState(saved.state);
        set({
          ...restored,
          events: Array.isArray(saved.events) ? saved.events : [],
          hydrated: true,
          hydrating: false,
          storageError: null,
        });
        return;
      }

      const fresh = createInitialState();
      set({
        ...fresh,
        events: [],
        hydrated: true,
        hydrating: false,
        storageError: null,
      });

      try {
        await persistSnapshot(toPersistedState(fresh));
      } catch (error) {
        hasReportedStorageError = true;
        console.error('[TAB ZERO] 初始记忆写入失败', error);
        set({
          storageError: '本地记忆不可用，本次进度可能无法保存。',
        });
      }
    } catch (error) {
      console.error('[TAB ZERO] 读取本地记忆失败', error);
      const fresh = createInitialState();
      set({
        ...fresh,
        events: [],
        hydrated: true,
        hydrating: false,
        storageError: '本地记忆读取失败，本次进度可能无法保存。',
      });
    }
  },

  startGame: () => {
    const state = get();
    if (state.gameStarted) {
      return false;
    }

    const nowIso = new Date().toISOString();
    const pageId = state.activePageId ?? 'home';
    const event = createBehaviorEvent({
      type: EVENT_TYPES.GAME_STARTED,
      pageId,
      params: {
        stageFrom: state.storyStage,
        stageTo: STORY_STAGES.ORIENTATION,
      },
      stage: STORY_STAGES.ORIENTATION,
      occurredAt: nowIso,
    });

    set({
      gameStarted: true,
      storyStage: STORY_STAGES.ORIENTATION,
      updatedAt: nowIso,
      events: [...state.events, event],
    });

    const nextState = get();
    persistAction(nextState, [event]);
    publishEvents([event]);
    return true;
  },

  openPage: (pageId, options = {}) => {
    const page = getPageDefinition(pageId);
    if (!page) {
      return false;
    }

    const state = get();
    const isOpen = state.openTabs.includes(pageId);
    if (isOpen && state.activePageId === pageId) {
      return false;
    }

    const nowIso = new Date().toISOString();
    const pageLifecycle = state.pages[pageId];
    const events = [];
    let openTabs = state.openTabs;
    let pages = state.pages;

    if (!isOpen) {
      const isReopen =
        pageLifecycle.closeCount > 0 || pageLifecycle.visitedCount > 0;
      openTabs = [...state.openTabs, pageId];
      pages = {
        ...state.pages,
        [pageId]: {
          ...pageLifecycle,
          status: 'open',
          openedEver: true,
          openCount: pageLifecycle.openCount + 1,
          visitCount: pageLifecycle.visitCount + 1,
          lastOpenedAt: nowIso,
          lastVisitedAt: nowIso,
        },
      };

      events.push(
        createBehaviorEvent({
          type: isReopen ? EVENT_TYPES.TAB_REOPENED : EVENT_TYPES.TAB_OPENED,
          pageId,
          params: {
            pageCode: page.code,
            source: options.source ?? 'tab',
            previousCloseCount: pageLifecycle.closeCount,
            openCount: pageLifecycle.openCount + 1,
          },
          stage: state.storyStage,
          occurredAt: nowIso,
        }),
      );
    } else {
      pages = {
        ...state.pages,
        [pageId]: {
          ...pageLifecycle,
          status: 'open',
          visitCount: pageLifecycle.visitCount + 1,
          lastVisitedAt: nowIso,
        },
      };
    }

    events.push(
      createBehaviorEvent({
        type: EVENT_TYPES.PAGE_VISITED,
        pageId,
        params: {
          source: options.source ?? 'tab',
          wasClosed: !isOpen,
        },
        stage: state.storyStage,
        occurredAt: nowIso,
      }),
    );

    set({
      activePageId: pageId,
      openTabs,
      pages,
      updatedAt: nowIso,
      events: [...state.events, ...events],
    });

    const nextState = get();
    persistAction(nextState, events);
    publishEvents(events);
    return true;
  },

  switchPage: (pageId, options = {}) => {
    const state = get();
    if (!state.openTabs.includes(pageId) || state.activePageId === pageId) {
      return false;
    }

    const nowIso = new Date().toISOString();
    const pageLifecycle = state.pages[pageId];
    const event = createBehaviorEvent({
      type: EVENT_TYPES.PAGE_VISITED,
      pageId,
      params: {
        source: options.source ?? 'tab',
        wasClosed: false,
      },
      stage: state.storyStage,
      occurredAt: nowIso,
    });

    set({
      activePageId: pageId,
      pages: {
        ...state.pages,
        [pageId]: {
          ...pageLifecycle,
          status: 'open',
          visitCount: pageLifecycle.visitCount + 1,
          lastVisitedAt: nowIso,
        },
      },
      updatedAt: nowIso,
      events: [...state.events, event],
    });

    const nextState = get();
    persistAction(nextState, [event]);
    publishEvents([event]);
    return true;
  },

  closePage: (pageId) => {
    const state = get();
    if (!state.openTabs.includes(pageId)) {
      return false;
    }

    const nowIso = new Date().toISOString();
    const closingIndex = state.openTabs.indexOf(pageId);
    const remainingTabs = state.openTabs.filter((tabId) => tabId !== pageId);
    const activeBefore = state.activePageId;
    const nextActivePageId =
      activeBefore === pageId
        ? (remainingTabs[closingIndex] ??
          remainingTabs[closingIndex - 1] ??
          null)
        : activeBefore;
    const pageLifecycle = state.pages[pageId];
    const event = createBehaviorEvent({
      type: EVENT_TYPES.TAB_CLOSED,
      pageId,
      params: {
        activeBefore,
        activeAfter: nextActivePageId,
        remainingTabCount: remainingTabs.length,
        closeCount: pageLifecycle.closeCount + 1,
      },
      stage: state.storyStage,
      occurredAt: nowIso,
    });

    set({
      openTabs: remainingTabs,
      activePageId: nextActivePageId,
      pages: {
        ...state.pages,
        [pageId]: {
          ...pageLifecycle,
          status: 'closed',
          closeCount: pageLifecycle.closeCount + 1,
          lastClosedAt: nowIso,
        },
      },
      updatedAt: nowIso,
      events: [...state.events, event],
    });

    const nextState = get();
    persistAction(nextState, [event]);
    publishEvents([event]);
    return true;
  },

  setTerminalDraft: (draft) => {
    const state = get();
    set({
      pageData: {
        ...state.pageData,
        terminal: {
          ...state.pageData.terminal,
          draft,
        },
      },
      updatedAt: new Date().toISOString(),
    });
    scheduleStateSave();
  },

  setObserverFilter: (filter) => {
    const state = get();
    if (!['all', 'tab', 'command', 'file', 'echo', 'system'].includes(filter)) {
      return;
    }

    set({
      pageData: {
        ...state.pageData,
        observer: {
          filter,
        },
      },
      updatedAt: new Date().toISOString(),
    });
    scheduleStateSave();
  },

  selectArchiveFile: (fileId) => {
    if (!ARCHIVE_FILE_BY_ID[fileId]) {
      return;
    }

    const state = get();
    set({
      pageData: {
        ...state.pageData,
        archive: {
          selectedFileId: fileId,
        },
      },
      updatedAt: new Date().toISOString(),
    });
    scheduleStateSave();
  },

  toggleFileQuarantine: (fileId) => {
    const file = ARCHIVE_FILE_BY_ID[fileId];
    const state = get();
    if (!file || file.status === 'sealed') {
      return false;
    }

    const isQuarantined = state.quarantinedFiles.includes(fileId);
    const nowIso = new Date().toISOString();
    const nextMemory = clampMetric(
      state.metrics.memoryIntegrity +
        (isQuarantined ? file.integrityCost : -file.integrityCost),
    );
    const event = createBehaviorEvent({
      type: isQuarantined
        ? EVENT_TYPES.FILE_RESTORED
        : EVENT_TYPES.FILE_DELETED,
      pageId: 'archive',
      params: {
        fileId,
        fileName: file.name,
        previousState: isQuarantined ? 'quarantined' : 'active',
        nextState: isQuarantined ? 'active' : 'quarantined',
        memoryBefore: state.metrics.memoryIntegrity,
        memoryAfter: nextMemory,
      },
      stage: state.storyStage,
      occurredAt: nowIso,
    });

    set({
      quarantinedFiles: isQuarantined
        ? state.quarantinedFiles.filter((id) => id !== fileId)
        : [...state.quarantinedFiles, fileId],
      metrics: {
        ...state.metrics,
        memoryIntegrity: nextMemory,
      },
      updatedAt: nowIso,
      events: [...state.events, event],
    });

    const nextState = get();
    persistAction(nextState, [event]);
    publishEvents([event]);
    return true;
  },

  executeTerminalCommand: (rawInput) => {
    const input = String(rawInput ?? '').trim();
    if (!input) {
      return {
        ok: false,
        empty: true,
      };
    }

    const state = get();
    const parsed = parseCommand(input);
    const nowIso = new Date().toISOString();
    const events = [];
    const outputLines = [];
    let nextMetrics = state.metrics;
    let nextTriggeredMessages = state.triggeredEchoMessages;
    let clearDisplay = false;

    if (!parsed.ok) {
      outputLines.push(
        createTerminalLine(
          'error',
          '未知命令。输入「帮助」查看可用的中文指令说明。',
        ),
      );
    } else {
      switch (parsed.command.id) {
        case 'help': {
          outputLines.push(
            createTerminalLine('system', '可用命令与中文说明：'),
          );
          TERMINAL_COMMANDS.forEach((command) => {
            outputLines.push(
              createTerminalLine(
                'muted',
                `${command.usage}  /  ${command.label}：${command.description}`,
              ),
            );
          });
          break;
        }
        case 'status': {
          outputLines.push(
            createTerminalLine(
              'system',
              `回声信任：${nextMetrics.echoTrust}%　回声恐惧：${nextMetrics.echoFear}%`,
            ),
          );
          outputLines.push(
            createTerminalLine(
              'system',
              `记忆完整度：${nextMetrics.memoryIntegrity}%　系统稳定度：${nextMetrics.systemStability}%`,
            ),
          );
          outputLines.push(
            createTerminalLine('muted', `当前剧情阶段：${state.storyStage}`),
          );
          break;
        }
        case 'tabs': {
          PAGE_IDS.forEach((pageId) => {
            const lifecycle = state.pages[pageId];
            const page = getPageDefinition(pageId);
            const stateLabel =
              lifecycle.status === 'open'
                ? '打开'
                : lifecycle.status === 'closed'
                  ? '关闭'
                  : '未访问';
            const lockLabel =
              page?.locked && !state.unlockedPages.includes(pageId)
                ? '（未解锁）'
                : '';
            outputLines.push(
              createTerminalLine(
                'muted',
                `[${stateLabel}] ${page?.label ?? pageId} ${page?.code ?? ''}${lockLabel} · 访问 ${lifecycle.visitCount} 次 / 关闭 ${lifecycle.closeCount} 次`,
              ),
            );
          });
          break;
        }
        case 'log': {
          const recentEvents = state.events.slice(-5).reverse();
          if (recentEvents.length === 0) {
            outputLines.push(
              createTerminalLine('muted', '暂无行为记录。打开一个页面后，记录会出现在这里。'),
            );
          } else {
            recentEvents.forEach((event) => {
              outputLines.push(
                createTerminalLine(
                  'muted',
                  `${formatEventTime(event.occurredAt)} · ${summarizeEvent(event)}`,
                ),
              );
            });
          }
          break;
        }
        case 'echo': {
          const reply = createEchoReply(state.triggeredEchoMessages.length);
          nextTriggeredMessages = [...state.triggeredEchoMessages, reply];
          nextMetrics = {
            ...state.metrics,
            echoTrust: clampMetric(state.metrics.echoTrust + 2),
            echoFear: clampMetric(state.metrics.echoFear + 1),
          };
          outputLines.push(createTerminalLine('echo', `回声：${reply.text}`));
          outputLines.push(
            createTerminalLine(
              'muted',
              '回声信任 +2　回声恐惧 +1　消息已写入回声页面。',
            ),
          );
          events.push(
            createBehaviorEvent({
              type: EVENT_TYPES.ECHO_MESSAGE_TRIGGERED,
              pageId: 'echo',
              params: {
                messageId: reply.id,
                text: reply.text,
                trigger: 'terminal',
                trustAfter: nextMetrics.echoTrust,
                fearAfter: nextMetrics.echoFear,
              },
              stage: state.storyStage,
              occurredAt: nowIso,
            }),
          );
          break;
        }
        case 'whoami': {
          outputLines.push(
            createTerminalLine('system', '访客编号：ZERO-0001'),
          );
          outputLines.push(
            createTerminalLine(
              'muted',
              '接入方式：本地浏览器　状态：沙盒只读镜像',
            ),
          );
          outputLines.push(
            createTerminalLine(
              'muted',
              `已解锁页面：${state.unlockedPages.length} / 7　当前阶段：${state.storyStage}`,
            ),
          );
          break;
        }
        case 'clear': {
          clearDisplay = true;
          break;
        }
        default: {
          outputLines.push(
            createTerminalLine('error', '命令暂不可用。'),
          );
        }
      }
    }

    const commandId = parsed.command?.id ?? null;
    const commandName = commandId ? COMMAND_BY_ID[commandId]?.label : null;
    const commandEvent = createBehaviorEvent({
      type: EVENT_TYPES.COMMAND_EXECUTED,
      pageId: 'terminal',
      params: {
        input,
        commandId,
        commandName,
        success: parsed.ok,
      },
      stage: state.storyStage,
      occurredAt: nowIso,
    });
    const allEvents = [commandEvent, ...events];
    const commandLine = createTerminalLine(
      'input',
      `访客@tabzero:~$ ${input}`,
    );
    const nextLines = clearDisplay
      ? [createTerminalLine('system', '屏幕已清空。行为记录不会被删除。')]
      : [...state.pageData.terminal.lines, commandLine, ...outputLines];
    const nextPageData = replaceTerminalLines(state.pageData, nextLines);

    set({
      metrics: nextMetrics,
      triggeredEchoMessages: nextTriggeredMessages,
      pageData: {
        ...nextPageData,
        terminal: {
          ...nextPageData.terminal,
          draft: '',
          commandHistory: [
            ...state.pageData.terminal.commandHistory,
            input,
          ].slice(-30),
        },
      },
      events: [...state.events, ...allEvents],
      updatedAt: nowIso,
      ending: evaluateEnding(state) ?? state.ending,
    });

    const nextState = get();
    persistAction(nextState, allEvents);
    publishEvents(allEvents);

    return {
      ok: parsed.ok,
      commandId,
    };
  },

  resetGame: async () => {
    const fresh = createInitialState();
    hasReportedStorageError = false;

    set({
      ...fresh,
      events: [],
      hydrated: true,
      hydrating: false,
      storageError: null,
    });

    eventBus.emit(BUS_EVENTS.GAME_RESET);

    try {
      await resetPersistedGame(toPersistedState(fresh));
      eventBus.emit(BUS_EVENTS.NOTICE, {
        tone: 'success',
        text: '游戏已重置，所有页面与行为记录恢复初始状态。',
      });
      return true;
    } catch (error) {
      console.error('[TAB ZERO] 重置本地记忆失败', error);
      set({
        storageError: '重置时未能清理本地记忆，刷新后可能恢复旧进度。',
      });
      eventBus.emit(BUS_EVENTS.NOTICE, {
        tone: 'error',
        text: '重置未能完全写入本地记忆。',
      });
      return false;
    }
  },

  clearStorageError: () => {
    set({ storageError: null });
  },
}));