export const EVENT_TYPES = {
  TAB_OPENED: 'TAB_OPENED',
  TAB_CLOSED: 'TAB_CLOSED',
  TAB_REOPENED: 'TAB_REOPENED',
  PAGE_VISITED: 'PAGE_VISITED',
  COMMAND_EXECUTED: 'COMMAND_EXECUTED',
  FILE_DELETED: 'FILE_DELETED',
  FILE_RESTORED: 'FILE_RESTORED',
  ECHO_MESSAGE_TRIGGERED: 'ECHO_MESSAGE_TRIGGERED',
  ENDING_UNLOCKED: 'ENDING_UNLOCKED',
  GAME_STARTED: 'GAME_STARTED',
};

export const EVENT_CATEGORIES = {
  all: '全部记录',
  tab: '标签页',
  command: '终端',
  file: '档案',
  echo: '回声',
  system: '系统',
};

export const EVENT_DEFINITIONS = {
  [EVENT_TYPES.TAB_OPENED]: {
    label: '打开页面',
    shortLabel: '打开',
    category: 'tab',
    tone: 'green',
  },
  [EVENT_TYPES.TAB_CLOSED]: {
    label: '关闭页面',
    shortLabel: '关闭',
    category: 'tab',
    tone: 'muted',
  },
  [EVENT_TYPES.TAB_REOPENED]: {
    label: '重新打开页面',
    shortLabel: '重开',
    category: 'tab',
    tone: 'green',
  },
  [EVENT_TYPES.PAGE_VISITED]: {
    label: '访问页面',
    shortLabel: '访问',
    category: 'tab',
    tone: 'green',
  },
  [EVENT_TYPES.COMMAND_EXECUTED]: {
    label: '执行终端命令',
    shortLabel: '命令',
    category: 'command',
    tone: 'green',
  },
  [EVENT_TYPES.FILE_DELETED]: {
    label: '隔离档案',
    shortLabel: '隔离',
    category: 'file',
    tone: 'red',
  },
  [EVENT_TYPES.FILE_RESTORED]: {
    label: '恢复档案',
    shortLabel: '恢复',
    category: 'file',
    tone: 'green',
  },
  [EVENT_TYPES.ECHO_MESSAGE_TRIGGERED]: {
    label: '触发回声',
    shortLabel: '回声',
    category: 'echo',
    tone: 'violet',
  },
  [EVENT_TYPES.ENDING_UNLOCKED]: {
    label: '解锁结局',
    shortLabel: '结局',
    category: 'system',
    tone: 'violet',
  },
  [EVENT_TYPES.GAME_STARTED]: {
    label: '开始探索',
    shortLabel: '开始',
    category: 'system',
    tone: 'green',
  },
};

export function getEventDefinition(type) {
  return (
    EVENT_DEFINITIONS[type] ?? {
      label: type || '未知事件',
      shortLabel: '未知',
      category: 'system',
      tone: 'muted',
    }
  );
}