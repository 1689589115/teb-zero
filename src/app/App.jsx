import { useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import BrowserShell from './BrowserShell';

export default function App() {
  const hydrate = useGameStore((state) => state.hydrate);
  const hydrated = useGameStore((state) => state.hydrated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="app-root">
      <div className="ambient-layer" aria-hidden="true">
        <span className="ambient-orb orb-green" />
        <span className="ambient-orb orb-violet" />
        <span className="ambient-grid" />
        <span className="ambient-noise" />
      </div>

      {hydrated ? (
        <BrowserShell />
      ) : (
        <div className="boot-screen" role="status" aria-live="polite">
          <div className="boot-mark" aria-hidden="true">
            零
          </div>
          <p className="boot-kicker">TAB ZERO / 零号标签</p>
          <h1>正在读取本地记忆</h1>
          <p>正在连接 IndexedDB，并恢复你的页面状态与行为记录。</p>
          <div className="boot-progress" aria-hidden="true">
            <span />
          </div>
          <span className="boot-footnote">请稍候 · 不要关闭当前页面</span>
        </div>
      )}
    </div>
  );
}