import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  Database,
  Lock,
  Plus,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import BrowserTab from '../components/BrowserTab';
import ConfirmDialog from '../components/ConfirmDialog';
import PageLauncher from '../components/PageLauncher';
import SystemMessage from '../components/SystemMessage';
import { getPageDefinition } from '../data/pages';
import {
  getEventVisual,
  summarizeEvent,
} from '../engine/behaviorTracker';
import { BUS_EVENTS, eventBus } from '../engine/eventBus';
import { useGameStore } from '../stores/gameStore';
import Archive from '../pages/Archive';
import Echo from '../pages/Echo';
import Error404 from '../pages/Error404';
import Home from '../pages/Home';
import Observer from '../pages/Observer';
import TabZero from '../pages/TabZero';
import Terminal from '../pages/Terminal';

const PAGE_COMPONENTS = {
  home: Home,
  observer: Observer,
  terminal: Terminal,
  archive: Archive,
  error404: Error404,
  echo: Echo,
  tabzero: TabZero,
};

const TOAST_EVENT_TYPES = new Set([
  'TAB_CLOSED',
  'FILE_DELETED',
  'FILE_RESTORED',
  'ECHO_MESSAGE_TRIGGERED',
  'GAME_STARTED',
]);

export default function BrowserShell() {
  const activePageId = useGameStore((state) => state.activePageId);
  const openTabs = useGameStore((state) => state.openTabs);
  const pages = useGameStore((state) => state.pages);
  const events = useGameStore((state) => state.events);
  const storyStage = useGameStore((state) => state.storyStage);
  const unlockedPages = useGameStore((state) => state.unlockedPages);
  const storageError = useGameStore((state) => state.storageError);
  const switchPage = useGameStore((state) => state.switchPage);
  const closePage = useGameStore((state) => state.closePage);
  const openPage = useGameStore((state) => state.openPage);
  const resetGame = useGameStore((state) => state.resetGame);
  const clearStorageError = useGameStore((state) => state.clearStorageError);

  const [launcherOpen, setLauncherOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const viewportRef = useRef(null);

  const activeDefinition = activePageId
    ? getPageDefinition(activePageId)
    : null;
  const ActivePage = activePageId ? PAGE_COMPONENTS[activePageId] : null;

  const showToast = useCallback((notice) => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    setToast(notice);
    toastTimer.current = setTimeout(() => {
      setToast(null);
    }, 3200);
  }, []);

  useEffect(() => {
    const unsubscribeEvents = eventBus.on(BUS_EVENTS.GAME_EVENT, (event) => {
      if (!TOAST_EVENT_TYPES.has(event.type)) {
        return;
      }

      const visual = getEventVisual(event);
      showToast({
        tone:
          visual.tone === 'red'
            ? 'warning'
            : event.type === 'TAB_CLOSED'
              ? 'info'
              : 'success',
        title: `已记录 · ${visual.label}`,
        message: summarizeEvent(event),
      });
    });

    const unsubscribeLauncher = eventBus.on(
      BUS_EVENTS.OPEN_PAGE_CENTER,
      () => setLauncherOpen(true),
    );
    const unsubscribeNotice = eventBus.on(BUS_EVENTS.NOTICE, (notice) => {
      showToast(notice);
    });

    return () => {
      unsubscribeEvents();
      unsubscribeLauncher();
      unsubscribeNotice();
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, [showToast]);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = 0;
    }
  }, [activePageId]);

  const handleReset = async () => {
    setResetBusy(true);
    await resetGame();
    setResetBusy(false);
    setResetOpen(false);
    setLauncherOpen(false);
  };

  return (
    <div className="browser-shell">
      <a className="skip-link" href="#browser-main">
        跳到页面内容
      </a>

      <header className="browser-chrome">
        <div className="browser-titlebar">
          <div className="browser-brand">
            <span className="browser-brand-mark" aria-hidden="true">
              零
            </span>
            <div className="browser-brand-copy">
              <strong>零号标签</strong>
              <span>TAB ZERO</span>
            </div>
            <span className="browser-brand-divider" aria-hidden="true" />
            <span className="browser-brand-caption">浏览器记忆实验 / 第一阶段</span>
          </div>

          <div className="browser-window-meta">
            <span className="chrome-meta">
              <Activity size={13} />
              {storyStage}
            </span>
            <span className="chrome-meta chrome-meta-events">
              <Database size={13} />
              {events.length} 条记录
            </span>
            <button
              type="button"
              className="chrome-reset"
              onClick={() => setResetOpen(true)}
            >
              <RotateCcw size={14} />
              重新开始
            </button>
          </div>
        </div>

        <div className="browser-tabbar">
          <div
            className="browser-tabs"
            role="tablist"
            aria-label="已打开的页面"
          >
            {openTabs.length === 0 ? (
              <span className="browser-tabs-empty">没有打开的页面</span>
            ) : (
              openTabs.map((pageId) => {
                const page = getPageDefinition(pageId);
                if (!page) {
                  return null;
                }

                return (
                  <BrowserTab
                    key={pageId}
                    page={page}
                    active={activePageId === pageId}
                    locked={
                      page.locked && !unlockedPages.includes(pageId)
                    }
                    onSelect={() =>
                      switchPage(pageId, { source: 'browser-tab' })
                    }
                    onClose={() => closePage(pageId)}
                  />
                );
              })
            )}
          </div>

          <button
            type="button"
            className="tabbar-add"
            onClick={() => setLauncherOpen(true)}
            aria-label="打开页面中心"
            title="页面中心"
          >
            <Plus size={17} />
            <span>页面中心</span>
          </button>
        </div>
      </header>

      {storageError ? (
        <div className="storage-warning">
          <SystemMessage
            tone="error"
            title="本地记忆异常"
            message={storageError}
            onClose={clearStorageError}
          />
        </div>
      ) : null}

      <main className="browser-viewport" id="browser-main" ref={viewportRef}>
        {ActivePage ? (
          <div className="page-stage" key={activePageId}>
            <ActivePage />
          </div>
        ) : (
          <div className="browser-empty-stage">
            <div className="empty-stage-mark">
              <Lock size={28} />
            </div>
            <span className="panel-kicker">NO ACTIVE TAB</span>
            <h1>这里暂时没有打开的页面</h1>
            <p>标签页已经关闭，但它们的记忆仍然保存在本地。</p>
            <button
              type="button"
              className="button button-primary"
              onClick={() => setLauncherOpen(true)}
            >
              <Plus size={16} />
              打开页面中心
            </button>
          </div>
        )}
      </main>

      <footer className="browser-statusbar">
        <span className="status-address">
          <ShieldCheck size={13} />
          {activeDefinition?.url ?? 'zero://empty'}
        </span>
        <span className="status-divider" aria-hidden="true" />
        <span className="status-local">
          <span className="live-dot" />
          本地记忆 {storageError ? '异常' : '已连接'}
        </span>
        <span className="status-spacer" />
        <span className="status-tab-count">
          已打开 {openTabs.length} / 7 个页面
        </span>
        <span className="status-pages-state">
          {Object.values(pages).reduce(
            (total, page) => total + page.closeCount,
            0,
          )}{' '}
          次页面关闭
        </span>
      </footer>

      <PageLauncher
        open={launcherOpen}
        onClose={() => setLauncherOpen(false)}
      />

      <ConfirmDialog
        open={resetOpen}
        title="重新开始游戏？"
        description="系统将清除当前游戏进度，并把七个页面恢复为初始状态。"
        confirmLabel="确认重新开始"
        cancelLabel="保留进度"
        busy={resetBusy}
        onConfirm={handleReset}
        onCancel={() => setResetOpen(false)}
      />

      {toast ? (
        <div className="toast-stack" aria-live="polite">
          <SystemMessage
            tone={toast.tone ?? 'info'}
            title={toast.title}
            message={toast.message ?? toast.text}
            onClose={() => setToast(null)}
          />
        </div>
      ) : null}
    </div>
  );
}