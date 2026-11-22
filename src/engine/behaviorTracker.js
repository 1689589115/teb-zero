import { getEventDefinition } from '../data/events';
import { getPageLabel } from '../data/pages';

let eventSequence = 0;

function createEventId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  eventSequence += 1;
  return `event-${Date.now()}-${eventSequence}`;
}

export function createBehaviorEvent({
  type,
  pageId,
  params = {},
  stage = '等待接入',
  occurredAt = new Date().toISOString(),
}) {
  return {
    id: createEventId(),
    type,
    occurredAt,
    timestamp: new Date(occurredAt).getTime(),
    pageId,
    pageLabel: getPageLabel(pageId),
    params,
    stage,
  };
}

export function formatEventTime(occurredAt) {
  const date = new Date(occurredAt);
  if (Number.isNaN(date.getTime())) {
    return '时间未知';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

export function summarizeEvent(event) {
  const page = event.pageLabel || getPageLabel(event.pageId);
  const params = event.params ?? {};

  switch (event.type) {
    case 'TAB_OPENED':
      return `打开「${page}」标签页`;
    case 'TAB_CLOSED':
      return `关闭「${page}」标签页`;
    case 'TAB_REOPENED':
      return `重新打开「${page}」标签页`;
    case 'PAGE_VISITED':
      return `访问「${page}」页面`;
    case 'COMMAND_EXECUTED':
      return params.success === false
        ? `输入了无法识别的命令「${params.input ?? ''}」`
        : `执行终端命令「${params.input ?? ''}」`;
    case 'FILE_DELETED':
      return `将档案「${params.fileName ?? '未知档案'}」移入隔离区`;
    case 'FILE_RESTORED':
      return `从隔离区恢复档案「${params.fileName ?? '未知档案'}」`;
    case 'ECHO_MESSAGE_TRIGGERED':
      return `触发回声消息：${params.text ?? '一段系统回应'}`;
    case 'ENDING_UNLOCKED':
      return `解锁结局「${params.endingName ?? '未知结局'}」`;
    case 'GAME_STARTED':
      return '开始探索零号标签系统';
    default:
      return `${getEventDefinition(event.type).label} · ${page}`;
  }
}

export function getEventVisual(event) {
  return getEventDefinition(event.type);
}