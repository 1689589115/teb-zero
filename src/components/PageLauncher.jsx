import { useEffect, useId } from 'react';
import { ArrowUpRight, Check, ChevronRight, Layers, Lock, X } from 'lucide-react';
import { PAGE_DEFINITIONS } from '../data/pages';
import { useGameStore } from '../stores/gameStore';
import PageIcon from './PageIcon';

function getPageStatus(page, activePageId, openTabs, pageLifecycle) {
  const isOpen = openTabs.includes(page.id);
  if (page.id === activePageId) {
    return {
      key: 'active',
      label: '当前页面',
      detail: `访问 ${pageLifecycle.visitCount} 次`,
      action: '当前页面',
    };
  }
  if (isOpen) {
    return {
      key: 'open',
      label: '已打开',
      detail: `访问 ${pageLifecycle.visitCount} 次`,
      action: '切换页面',
    };
  }
  if (pageLifecycle.status === 'closed' || pageLifecycle.closeCount > 0) {
    return {
      key: 'closed',
      label: '已关闭',
      detail: `关闭 ${pageLifecycle.closeCount} 次 · 访问 ${pageLifecycle.visitCount} 次`,
      action: '重新打开',
    };
  }
  return {
    key: 'unvisited',
    label: '尚未访问',
    detail: '页面状态尚未建立',
    action: '打开页面',
  };
}

export default function PageLauncher({ open, onClose }) {
  const titleId = useId();
  const activePageId = useGameStore((state) => state.activePageId);
  const openTabs = useGameStore((state) => state.openTabs);
  const pages = useGameStore((state) => state.pages);
  const unlockedPages = useGameStore((state) => state.unlockedPages);
  const events = useGameStore((state) => state.events);
  const openPage = useGameStore((state) => state.openPage);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const closedCount = PAGE_DEFINITIONS.filter(
    (page) => pages[page.id]?.status === 'closed',
  ).length;
  const unvisitedCount = PAGE_DEFINITIONS.filter(
    (page) => pages[page.id]?.status === 'unvisited',
  ).length;

  const handleOpenPage = (pageId) => {
    openPage(pageId, { source: 'page-center' });
    onClose();
  };

  return (
    <div
      className="modal-layer launcher-layer"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="page-center-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="page-center-header">
          <div className="page-center-titleblock">
            <span className="page-center-mark">
              <Layers size={18} />
            </span>
            <div>
              <p className="modal-kicker">页面索引 / PAGE INDEX</p>
              <h2 id={titleId}>页面中心</h2>
              <p>所有页面都在这里。关闭标签页不会删除它的记忆。</p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label="关闭页面中心"
            onClick={onClose}
          >
            <X size={17} />
          </button>
        </header>

        <div className="page-center-summary" aria-label="页面统计">
          <span>
            <strong>{openTabs.length}</strong> 已打开
          </span>
          <span>
            <strong>{closedCount}</strong> 已关闭
          </span>
          <span>
            <strong>{unvisitedCount}</strong> 未访问
          </span>
          <span>
            <strong>{events.length}</strong> 条行为记录
          </span>
        </div>

        <div className="page-center-grid">
          {PAGE_DEFINITIONS.map((page, index) => {
            const status = getPageStatus(
              page,
              activePageId,
              openTabs,
              pages[page.id],
            );
            const isLocked = page.locked && !unlockedPages.includes(page.id);

            return (
              <article
                className={`page-center-card state-${status.key}${isLocked ? ' is-locked' : ''}`}
                key={page.id}
              >
                <div className="page-center-card-top">
                  <span className={`page-center-icon tone-${page.accent}`}>
                    <PageIcon name={page.icon} size={20} />
                  </span>
                  <span className="page-center-index">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {isLocked ? (
                    <span className="lock-badge">
                      <Lock size={11} />
                      未解锁
                    </span>
                  ) : (
                    <span className={`page-state-badge state-${status.key}`}>
                      {status.key === 'active' ? <Check size={11} /> : null}
                      {status.label}
                    </span>
                  )}
                </div>

                <div className="page-center-card-copy">
                  <h3>{page.label}</h3>
                  <span className="page-center-code">{page.code}</span>
                  <p>{page.description}</p>
                </div>

                <div className="page-center-card-footer">
                  <span className="page-center-detail">{status.detail}</span>
                  <button
                    type="button"
                    className={`page-center-open${status.key === 'active' ? ' is-current' : ''}`}
                    onClick={() => handleOpenPage(page.id)}
                    disabled={status.key === 'active'}
                  >
                    {isLocked && status.key !== 'active'
                      ? '查看锁定页'
                      : status.action}
                    {status.key === 'active' ? (
                      <Check size={13} />
                    ) : (
                      <ChevronRight size={13} />
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <footer className="page-center-footer">
          <span>
            <ArrowUpRight size={13} />
            重新打开已关闭的页面，会恢复上一次的状态。
          </span>
          <span>快捷键：Esc 关闭</span>
        </footer>
      </section>
    </div>
  );
}