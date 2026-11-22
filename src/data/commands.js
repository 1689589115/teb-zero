export const TERMINAL_COMMANDS = [
  {
    id: 'help',
    names: ['help', '帮助', '?'],
    usage: 'help',
    label: '帮助',
    description: '显示可用命令与中文说明。',
  },
  {
    id: 'status',
    names: ['status', '状态'],
    usage: 'status',
    label: '系统状态',
    description: '读取回声信任、恐惧与系统稳定度。',
  },
  {
    id: 'tabs',
    names: ['tabs', '页面', '标签'],
    usage: 'tabs',
    label: '页面索引',
    description: '列出七个页面的访问与开关状态。',
  },
  {
    id: 'log',
    names: ['log', '记录'],
    usage: 'log',
    label: '行为记录',
    description: '读取最近五条真实行为记录。',
  },
  {
    id: 'echo',
    names: ['echo', '回声'],
    usage: 'echo',
    label: '呼叫回声',
    description: '主动触发一条回声消息，并留下记录。',
  },
  {
    id: 'whoami',
    names: ['whoami', '身份', '我是谁'],
    usage: 'whoami',
    label: '访客身份',
    description: '读取当前访客编号与接入信息。',
  },
  {
    id: 'clear',
    names: ['clear', '清屏'],
    usage: 'clear',
    label: '清空屏幕',
    description: '清空终端显示，但不会删除行为记录。',
  },
];

export const COMMAND_BY_ID = Object.fromEntries(
  TERMINAL_COMMANDS.map((command) => [command.id, command]),
);

export const INITIAL_TERMINAL_LINES = [
  {
    kind: 'system',
    text: '零号系统终端已连接。',
  },
  {
    kind: 'muted',
    text: '输入「帮助」查看命令与中文说明。所有输入都会写入观察者记录。',
  },
];