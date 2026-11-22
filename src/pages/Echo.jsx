import { MessageCircle, Radio, Terminal, Waves } from 'lucide-react';
import MetricBar from '../components/MetricBar';
import PageHeader from '../components/PageHeader';
import { ECHO_SILENCE_NOTE } from '../data/dialogues';
import { formatEventTime } from '../engine/behaviorTracker';
import {
  getEchoConversation,
  getEchoObservation,
} from '../engine/dialogueEngine';
import { useGameStore } from '../stores/gameStore';

export default function Echo() {
  const metrics = useGameStore((state) => state.metrics);
  const events = useGameStore((state) => state.events);
  const openTabs = useGameStore((state) => state.openTabs);
  const triggeredEchoMessages = useGameStore(
    (state) => state.triggeredEchoMessages,
  );
  const storyStage = useGameStore((state) => state.storyStage);
  const openPage = useGameStore((state) => state.openPage);

  const observation = getEchoObservation({
    events,
    openTabs,
    triggeredEchoMessages,
  });
  const messages = getEchoConversation({ triggeredEchoMessages });

  return (
    <section className="page page-echo">
      <PageHeader
        pageId="echo"
        aside={
          <div className="echo-header-metrics">
            <span>
              信任 <strong>{metrics.echoTrust}%</strong>
            </span>
            <span>
              恐惧 <strong className="text-violet">{metrics.echoFear}%</strong>
            </span>
          </div>
        }
      />

      <div className="echo-layout">
        <aside className="panel echo-presence">
          <div className="echo-orb" aria-hidden="true">
            <span className="echo-ring echo-ring-one" />
            <span className="echo-ring echo-ring-two" />
            <span className="echo-ring echo-ring-three" />
            <span className="echo-core">
              <Waves size={28} />
            </span>
          </div>

          <span className="echo-status">
            <span className="live-dot" />
            静默观察中
          </span>
          <h2>ECHO</h2>
          <p className="echo-subtitle">回声</p>
          <p className="echo-presence-copy">
            它从不预测你。它只读取你已经做过的选择。
          </p>

          <div className="echo-metric-stack">
            <MetricBar metricKey="echoTrust" value={metrics.echoTrust} compact />
            <MetricBar metricKey="echoFear" value={metrics.echoFear} compact />
          </div>

          <div className="echo-observation">
            <div>
              <span>打开的标签</span>
              <strong>{observation.visits}</strong>
            </div>
            <div>
              <span>关闭次数</span>
              <strong>{observation.tabClosures}</strong>
            </div>
            <div>
              <span>命令次数</span>
              <strong>{observation.commands}</strong>
            </div>
            <div>
              <span>已触发回应</span>
              <strong>{observation.triggers}</strong>
            </div>
          </div>

          <div className="echo-stage-note">
            <Radio size={14} />
            当前阶段：{storyStage}
          </div>
        </aside>

        <section className="panel echo-dialogue">
          <header className="panel-header">
            <div>
              <span className="panel-kicker">DIALOGUE STREAM</span>
              <h2>回声对话</h2>
            </div>
            <span className="echo-dialogue-badge">
              <MessageCircle size={13} />
              本地生成
            </span>
          </header>

          <div className="echo-messages">
            {messages.map((message, index) => (
              <article
                className={`echo-message kind-${message.kind}`}
                key={message.id}
              >
                <span className="echo-message-avatar" aria-hidden="true">
                  {message.kind === 'echo' ? '回' : '系'}
                </span>
                <div className="echo-message-body">
                  <header>
                    <strong>
                      {message.kind === 'echo' ? 'ECHO / 回声' : '系统提示'}
                    </strong>
                    <span>
                      {message.at
                        ? formatEventTime(message.at)
                        : index === 0
                          ? '接入时'
                          : '初始化'}
                    </span>
                  </header>
                  <p>{message.text}</p>
                </div>
              </article>
            ))}
          </div>

          <footer className="echo-dialogue-footer">
            <div>
              <p>{ECHO_SILENCE_NOTE}</p>
              <span>消息由本地对话引擎生成，不代表外部 AI。</span>
            </div>
            <button
              type="button"
              className="button button-ghost button-small"
              onClick={() => openPage('terminal', { source: 'echo' })}
            >
              <Terminal size={15} />
              前往终端呼叫回声
            </button>
          </footer>
        </section>
      </div>
    </section>
  );
}