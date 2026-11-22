import { Command, ShieldCheck, Terminal as TerminalIcon } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import TerminalWindow from '../components/TerminalWindow';
import { TERMINAL_COMMANDS } from '../data/commands';
import { useGameStore } from '../stores/gameStore';

export default function Terminal() {
  const terminal = useGameStore((state) => state.pageData.terminal);
  const setTerminalDraft = useGameStore((state) => state.setTerminalDraft);
  const executeTerminalCommand = useGameStore(
    (state) => state.executeTerminalCommand,
  );

  return (
    <section className="page page-terminal">
      <PageHeader
        pageId="terminal"
        aside={
          <div className="terminal-rule-chip">
            <ShieldCheck size={14} />
            本地规则解析
          </div>
        }
      />

      <div className="terminal-layout">
        <TerminalWindow
          lines={terminal.lines}
          draft={terminal.draft}
          commandHistory={terminal.commandHistory}
          onDraftChange={setTerminalDraft}
          onSubmit={executeTerminalCommand}
        />

        <aside className="panel command-reference">
          <header className="panel-header">
            <div>
              <span className="panel-kicker">COMMAND INDEX</span>
              <h2>指令索引</h2>
            </div>
            <Command size={17} className="text-green" />
          </header>

          <p className="command-reference-intro">
            终端命令保留英文，中文说明如下。输入中文命令同样有效。
          </p>

          <div className="command-list">
            {TERMINAL_COMMANDS.map((command) => (
              <button
                type="button"
                className="command-card"
                key={command.id}
                onClick={() => setTerminalDraft(command.usage)}
              >
                <span className="command-card-head">
                  <code>{command.usage}</code>
                  <span>{command.label}</span>
                </span>
                <span className="command-card-description">
                  {command.description}
                </span>
                <span className="command-card-action">填入命令</span>
              </button>
            ))}
          </div>

          <div className="command-reference-note">
            <TerminalIcon size={15} />
            <p>
              当前终端由本地规则驱动，未连接外部 AI。执行结果会立即写入行为记录。
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}