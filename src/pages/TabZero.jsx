import { ArrowLeft, Fingerprint, Lock, ShieldAlert } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useGameStore } from '../stores/gameStore';

export default function TabZero() {
  const unlockedPages = useGameStore((state) => state.unlockedPages);
  const storyStage = useGameStore((state) => state.storyStage);
  const openPage = useGameStore((state) => state.openPage);
  const isUnlocked = unlockedPages.includes('tabzero');

  return (
    <section className="page page-tabzero">
      <PageHeader
        pageId="tabzero"
        aside={
          <div className="locked-chip">
            <Lock size={13} />
            {isUnlocked ? '入口已授权' : '尚未解锁'}
          </div>
        }
      />

      <div className="tabzero-stage">
        <div className="tabzero-visual" aria-hidden="true">
          <span className="tabzero-ring ring-one" />
          <span className="tabzero-ring ring-two" />
          <span className="tabzero-ring ring-three" />
          <span className="tabzero-ring ring-four" />
          <span className="tabzero-core">
            <Fingerprint size={40} strokeWidth={1.2} />
          </span>
          <span className="tabzero-coordinate coordinate-a">Z-00</span>
          <span className="tabzero-coordinate coordinate-b">LOCKED</span>
        </div>

        <div className="tabzero-copy">
          <span className="panel-kicker">TAB ZERO / FINAL NODE</span>
          <h2>{isUnlocked ? '入口已授权，内容尚未接入' : '零号标签仍在沉睡'}</h2>
          <p>
            {isUnlocked
              ? '系统已经授予访问权限，但这一页的内容将在后续剧情阶段开放。'
              : '访问权限尚未授予。关闭其他页面、留下足够的行为记录，也许会让系统重新评估这里。'}
          </p>

          <div className="tabzero-facts">
            <div>
              <span>访问权限</span>
              <strong className={isUnlocked ? 'text-green' : 'text-danger'}>
                {isUnlocked ? '已授予' : '未授予'}
              </strong>
            </div>
            <div>
              <span>页面封存状态</span>
              <strong>保持锁定</strong>
            </div>
            <div>
              <span>当前剧情阶段</span>
              <strong>{storyStage}</strong>
            </div>
            <div>
              <span>内容接入</span>
              <strong>后续阶段</strong>
            </div>
          </div>

          <div className="tabzero-warning">
            <ShieldAlert size={16} />
            <p>第一阶段只提供入口与锁定状态，避免提前写入未完成的剧情。</p>
          </div>

          <button
            type="button"
            className="button button-ghost"
            onClick={() => openPage('home', { source: 'tabzero' })}
          >
            <ArrowLeft size={15} />
            返回首页
          </button>
        </div>
      </div>
    </section>
  );
}