const channels = new Map();

export const BUS_EVENTS = {
  GAME_EVENT: 'game:event',
  OPEN_PAGE_CENTER: 'ui:open-page-center',
  NOTICE: 'ui:notice',
  GAME_RESET: 'game:reset',
};

export const eventBus = {
  on(channel, handler) {
    if (!channels.has(channel)) {
      channels.set(channel, new Set());
    }
    channels.get(channel).add(handler);
    return () => eventBus.off(channel, handler);
  },

  off(channel, handler) {
    channels.get(channel)?.delete(handler);
  },

  emit(channel, detail) {
    const handlers = channels.get(channel);
    if (!handlers) {
      return;
    }

    handlers.forEach((handler) => {
      try {
        handler(detail);
      } catch (error) {
        console.error(`[TAB ZERO] 事件总线处理失败：${channel}`, error);
      }
    });
  },
};