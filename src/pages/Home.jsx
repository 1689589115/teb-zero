import {
  ArrowRight,
  ChevronRight,
  Database,
  Eye,
  Lock,
  Play,
  Radio,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import MetricBar from '../components/MetricBar';
import PageIcon from '../components/PageIcon';
import { PAGE_DEFINITIONS } from '../data/pages';
import {
  formatEventTime,
  getEventVisual,
  summarizeEvent,
} from '../engine/behaviorTracker';
import { BUS_EVENTS, eventBus } from '../engine/eventBus';
import { useGameStore } from '../stores/gameStore';

export default function Home() {
  const gameStarted = useGameStore((state) => state.gameStarted);
  const metrics = useGameStore((state) => state.metrics);
  const storyStage = useGameStore((state) => state.storyStage);
  const openTabs = useGameStore((state) => state.openTabs);
  const activePageId = useGameStore((state) => state.activePageId);
  const unlockedPages = useGameStore((state) => state.unlockedPages);
  const events = useGameStore((state) => state.events);
  const discoveredClues = useGameStore((state) => state.discoveredClues);
  const storageError = useGameStore((state) => state.storageError);
  const startGame = useGameStore((state) => state.startGame);
  const openPage = useGameStore((state) => state.openPage);

  const recentEvents = events.slice(-4).reverse();
  const lockedCount = PAGE_DEFINITIONS.length - unlockedPages.length;

  const handleStart = () => {
    if (!gameStarted) {
      startGame();
    }
    eventBus.emit(BUS_EVENTS.OPEN_PAGE_CENTER);
  };

  return (
    <section className="page page-home">
      <div className="home-hero-grid">
        <article className="home-hero">
          <div className="hero-grid-decor" aria-hidden="true" />
          <div className="hero-orbit" aria-hidden="true">
            <span className="hero-orbit-ring ring-one" />
            <span className="hero-orbit-ring ring-two" />
            <span className="hero-orbit-ring ring-three" />
            <span className="hero-orbit-core">零</span>
          </div>

          <p className="hero-kicker">
            <span className="live-dot" />
            零号系统 / NODE 00
            <span className="hero-kicker-state">
              {gameStarted ? '接入已激活' : '等待授权'}
            </span>
          </p>

          <h1>
            欢迎进入
            <br />
            <span>零号标签</span>
          </h1>

          <p className="hero-description">
            这不是一个普通的网站。每一枚标签页，都是一段可以被关闭、却不会被删除的记忆。
          </p>

          <div className="hero-actions">
            <button type="button" className="button button-primary" onClick={handleStart}>
              {gameStarted ? <ArrowRight size={17} /> : <Play size={17} />}
              {gameStarted ? '继续探索' : '开始探索'}
            </button>
            <button
              type="button"
              className="button button-ghost"
              onClick={() => openPage('observer', { source: 'home' })}
            >
              <Eye size={16} />
              读取行为记录
            </button>
          </div>

          <div className="hero-system-note">
            <Sparkles size={14} />
            <span>系统只记录真实操作。你的每次打开、关闭与输入都会留下痕迹。</span>
          </div>
        </article>

        <aside className="panel system-overview">
          <header className="panel-header">
            <div>
              <span className="panel-kicker">SYSTEM STATUS</span>
              <h2>系统状态</h2>
            </div>
            <span className="status-chip">
              <span className="live-dot" />
              在线
            </span>
          </header>

          <div className="system-stage">
            <div>
              <span>当前阶段</span>
              <strong>{storyStage}</strong>
            </div>
            <div className="stage-symbol" aria-hidden="true">
              01
            </div>
          </div>

          <div className="metric-stack">
            <MetricBar metricKey="echoTrust" value={metrics.echoTrust} />
            <MetricBar metricKey="echoFear" value={metrics.echoFear} />
            <MetricBar metricKey="memoryIntegrity" value={metrics.memoryIntegrity} />
            <MetricBar metricKey="systemStability" value={metrics.systemStability} />
          </div>

          <div className="system-facts">
            <div>
              <Radio size={14} />
              <span>已打开标签</span>
              <strong>{openTabs.length} / 7</strong>
            </div>
            <div>
              <Database size={14} />
              <span>本地记忆</span>
              <strong className={storageError ? 'text-danger' : 'text-green'}>
                {storageError ? '异常' : '已同步'}
              </strong>
            </div>
            <div>
              <ShieldCheck size={14} />
              <span>已发现线索</span>
              <strong>{discoveredClues.length}</strong>
            </div>
          </div>
        </aside>
      </div>

      <div className="home-lower-grid">
        <section className="panel home-pages-panel">
          <header className="panel-header">
            <div>
              <span className="panel-kicker">PAGE INDEX</span>
              <h2>可用页面</h2>
            </div>
            <button
              type="button"
              className="text-button"
              onClick={() => eventBus.emit(BUS_EVENTS.OPEN_PAGE_CENTER)}
            >
              页面中心
              <ChevronRight size={14} />
            </button>
          </header>

          <div className="home-page-grid">
            {PAGE_DEFINITIONS.map((page) => {
              const isOpen = openTabs.includes(page.id);
              const isActive = activePageId === page.id;
              const isLocked = page.locked && !unlockedPages.includes(page.id);

              return (
                <button
                  type="button"
                  className={`home-page-link tone-${page.accent}${isActive ? ' is-active' : ''}`}
                  key={page.id}
                  onClick={() => openPage(page.id, { source: 'home' })}
                >
                  <span className="home-page-icon">
                    <PageIcon name={page.icon} size={18} />
                  </span>
                  <span className="home-page-copy">
                    <strong>{page.label}</strong>
                    <span>{page.code}</span>
                  </span>
                  <span className={`home-page-state${isOpen ? ' is-open' : ''}`}>
                    {isLocked ? <Lock size={11} /> : null}
                    {isLocked ? '未解锁' : isActive ? '当前' : isOpen ? '已打开' : '未访问'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="home-pages-footnote">
            当前已解锁 {unlockedPages.length} / {PAGE_DEFINITIONS.length} 个页面
            {lockedCount > 0 ? ` · ${lockedCount} 个页面仍被系统封存` : ''}
          </div>
        </section>

        <section className="panel recent-panel">
          <header className="panel-header">
            <div>
              <span className="panel-kicker">RECENT SIGNALS</span>
              <h2>最近信号</h2>
            </div>
            <button
              type="button"
              className="text-button"
              onClick={() => openPage('observer', { source: 'home' })}
            >
              查看全部
              <ChevronRight size={14} />
            </button>
          </header>

          {recentEvents.length === 0 ? (
            <div className="compact-empty">
              <Radio size={20} />
              <p>还没有行为记录。</p>
              <span>打开一个页面后，信号会出现在这里。</span>
            </div>
          ) : (
            <div className="recent-signal-list">
              {recentEvents.map((event) => (
                <div className="recent-signal" key={event.id}>
                  <span
                    className={`signal-dot tone-${getEventVisual(event).tone === 'red' ? 'red' : 'green'}`}
                  />
                  <div>
                    <p>{summarizeEvent(event)}</p>
                    <span>
                      {formatEventTime(event.occurredAt)} · {event.pageLabel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}