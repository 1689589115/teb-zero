import {
  Activity,
  Archive,
  Clock3,
  Eye,
  Radio,
  Terminal,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import {
  formatEventTime,
  getEventVisual,
  summarizeEvent,
} from '../engine/behaviorTracker';
import { EVENT_CATEGORIES, EVENT_TYPES } from '../data/events';
import { BUS_EVENTS, eventBus } from '../engine/eventBus';
import { useGameStore } from '../stores/gameStore';

export default function Observer() {
  const events = useGameStore((state) => state.events);
  const filter = useGameStore((state) => state.pageData.observer.filter);
  const storyStage = useGameStore((state) => state.storyStage);
  const setObserverFilter = useGameStore((state) => state.setObserverFilter);

  const tabClosures = events.filter(
    (event) => event.type === EVENT_TYPES.TAB_CLOSED,
  ).length;
  const commandCount = events.filter(
    (event) => event.type === EVENT_TYPES.COMMAND_EXECUTED,
  ).length;
  const fileActions = events.filter(
    (event) =>
      event.type === EVENT_TYPES.FILE_DELETED ||
      event.type === EVENT_TYPES.FILE_RESTORED,
  ).length;

  const filteredEvents = [...events]
    .reverse()
    .filter((event) => {
      if (filter === 'all') {
        return true;
      }
      return getEventVisual(event).category === filter;
    });

  return (
    <section className="page page-observer">
      <PageHeader
        pageId="observer"
        aside={
          <div className="observer-live-chip">
            <span className="live-dot" />
            实时监视中
          </div>
        }
        actions={
          <button
            type="button"
            className="button button-ghost button-small"
            onClick={() => eventBus.emit(BUS_EVENTS.OPEN_PAGE_CENTER)}
          >
            <Eye size={15} />
            打开页面
          </button>
        }
      />

      <div className="stat-grid observer-stats">
        <article className="stat-card">
          <span className="stat-icon">
            <Activity size={17} />
          </span>
          <div>
            <strong>{events.length}</strong>
            <span>全部行为</span>
          </div>
          <small>真实记录</small>
        </article>
        <article className="stat-card">
          <span className="stat-icon">
            <Eye size={17} />
          </span>
          <div>
            <strong>{tabClosures}</strong>
            <span>关闭标签</span>
          </div>
          <small>不会删除记忆</small>
        </article>
        <article className="stat-card">
          <span className="stat-icon">
            <Terminal size={17} />
          </span>
          <div>
            <strong>{commandCount}</strong>
            <span>终端命令</span>
          </div>
          <small>包含失败输入</small>
        </article>
        <article className="stat-card">
          <span className="stat-icon">
            <Archive size={17} />
          </span>
          <div>
            <strong>{fileActions}</strong>
            <span>档案操作</span>
          </div>
          <small>隔离与恢复</small>
        </article>
      </div>

      <div className="observer-layout">
        <section className="panel observer-log-panel">
          <header className="panel-header observer-log-header">
            <div>
              <span className="panel-kicker">BEHAVIOR LOG</span>
              <h2>玩家行为记录</h2>
            </div>
            <div className="record-count">
              <span>{filteredEvents.length}</span>
              条可见
            </div>
          </header>

          <div className="filter-row" role="group" aria-label="行为记录筛选">
            {Object.entries(EVENT_CATEGORIES).map(([key, label]) => (
              <button
                type="button"
                key={key}
                className={`filter-chip${filter === key ? ' is-active' : ''}`}
                aria-pressed={filter === key}
                onClick={() => setObserverFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="event-log">
            {filteredEvents.length === 0 ? (
              <div className="event-empty">
                <span className="event-empty-icon">
                  <Radio size={24} />
                </span>
                <h3>{events.length === 0 ? '行为记录尚为空' : '此分类暂无记录'}</h3>
                <p>
                  {events.length === 0
                    ? '你打开的第一个页面、执行的第一条命令，都会从这里开始。'
                    : '切换筛选条件，或继续操作其他页面以生成新的记录。'}
                </p>
                <button
                  type="button"
                  className="button button-ghost button-small"
                  onClick={() => eventBus.emit(BUS_EVENTS.OPEN_PAGE_CENTER)}
                >
                  打开页面中心
                </button>
              </div>
            ) : (
              filteredEvents.map((event) => {
                const visual = getEventVisual(event);
                return (
                  <article className="event-record" key={event.id}>
                    <span
                      className={`event-marker tone-${visual.tone}`}
                      aria-hidden="true"
                    />
                    <div className="event-record-time">
                      <Clock3 size={12} />
                      <time dateTime={event.occurredAt}>
                        {formatEventTime(event.occurredAt)}
                      </time>
                    </div>
                    <div className="event-record-main">
                      <header>
                        <span className={`event-badge tone-${visual.tone}`}>
                          {visual.label}
                        </span>
                        <span className="event-page-chip">{event.pageLabel}</span>
                        <span className="event-stage">{event.stage}</span>
                      </header>
                      <p>{summarizeEvent(event)}</p>
                      <details className="event-raw">
                        <summary>查看事件参数</summary>
                        <pre>{JSON.stringify(event.params, null, 2)}</pre>
                      </details>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <aside className="observer-aside">
          <section className="panel observer-policy">
            <span className="panel-kicker">OBSERVER PROTOCOL</span>
            <h2>观察原则</h2>
            <ul>
              <li>
                <span>01</span>
                只记录真实操作，不写入伪造行为。
              </li>
              <li>
                <span>02</span>
                行为与状态同步保存至本地记忆。
              </li>
              <li>
                <span>03</span>
                关闭页面不会删除它留下的记录。
              </li>
            </ul>
            <div className="observer-stage">
              <span>当前阶段</span>
              <strong>{storyStage}</strong>
            </div>
          </section>

          <section className="panel observer-data-note">
            <Radio size={16} />
            <p>
              系统正在观察。新的行为记录会自动出现在左侧，无需刷新页面。
            </p>
          </section>
        </aside>
      </div>
    </section>
  );
}