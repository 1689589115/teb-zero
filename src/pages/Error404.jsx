import { AlertTriangle, ArrowLeft, Eye, Radio } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useGameStore } from '../stores/gameStore';

export default function Error404() {
  const openPage = useGameStore((state) => state.openPage);
  const storyStage = useGameStore((state) => state.storyStage);

  return (
    <section className="page page-error404">
      <PageHeader
        pageId="error404"
        aside={
          <div className="anomaly-chip">
            <AlertTriangle size={14} />
            异常页
          </div>
        }
      />

      <div className="error-stage">
        <div className="anomaly-visual">
          <span className="anomaly-code" data-text="404">
            404
          </span>
          <div className="anomaly-bars" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <p className="anomaly-scanline">目标地址已失去回应</p>
        </div>

        <div className="anomaly-copy">
          <span className="panel-kicker">TARGET LOST / ZERO-404</span>
          <h2>这一页不应该存在。</h2>
          <p>
            系统曾在这里保存过什么，但现在只剩下一段无法读取的回声。
            关闭的页面不会消失，可这一页似乎从未被真正打开。
          </p>

          <div className="anomaly-actions">
            <button
              type="button"
              className="button button-primary"
              onClick={() => openPage('home', { source: 'error404' })}
            >
              <ArrowLeft size={15} />
              返回首页
            </button>
            <button
              type="button"
              className="button button-ghost"
              onClick={() => openPage('observer', { source: 'error404' })}
            >
              <Eye size={15} />
              打开观察者
            </button>
          </div>

          <div className="anomaly-meta">
            <div>
              <span>错误编号</span>
              <strong>ZERO-404</strong>
            </div>
            <div>
              <span>页面状态</span>
              <strong>已回收</strong>
            </div>
            <div>
              <span>访问许可</span>
              <strong className="text-danger">拒绝</strong>
            </div>
            <div>
              <span>当前阶段</span>
              <strong>{storyStage}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="fragment-strip">
        <Radio size={14} />
        <span>残留信号 01：这里没有内容。</span>
        <span>残留信号 02：或者，内容被移走了。</span>
        <span>残留信号 03：不要试图刷新。</span>
      </div>
    </section>
  );
}