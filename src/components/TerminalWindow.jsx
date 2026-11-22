import { useEffect, useRef, useState } from 'react';
import { CornerDownLeft, TerminalSquare } from 'lucide-react';

const LINE_SOURCES = {
  input: '访客',
  system: '系统',
  muted: '读取',
  error: '错误',
  echo: '回声',
};

export default function TerminalWindow({
  lines,
  draft,
  commandHistory = [],
  onDraftChange,
  onSubmit,
}) {
  const logRef = useRef(null);
  const inputRef = useRef(null);
  const [historyCursor, setHistoryCursor] = useState(0);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [lines]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const value = draft.trim();
    if (!value) {
      return;
    }

    onSubmit(value);
    setHistoryCursor(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowUp' && commandHistory.length > 0) {
      event.preventDefault();
      const nextCursor = Math.min(historyCursor + 1, commandHistory.length);
      setHistoryCursor(nextCursor);
      onDraftChange(commandHistory[commandHistory.length - nextCursor] ?? '');
    }

    if (event.key === 'ArrowDown' && historyCursor > 0) {
      event.preventDefault();
      const nextCursor = Math.max(0, historyCursor - 1);
      setHistoryCursor(nextCursor);
      onDraftChange(
        nextCursor === 0
          ? ''
          : commandHistory[commandHistory.length - nextCursor] ?? '',
      );
    }
  };

  return (
    <section className="terminal-window" aria-label="零号系统终端窗口">
      <div className="terminal-window-bar">
        <div className="terminal-window-title">
          <TerminalSquare size={15} />
          <span>零号终端</span>
          <span className="terminal-window-path">ECHO://TERMINAL</span>
        </div>
        <div className="terminal-window-status">
          <span className="terminal-live-dot" aria-hidden="true" />
          写入已开启
        </div>
      </div>

      <div
        className="terminal-log"
        ref={logRef}
        aria-live="polite"
        aria-label="终端输出"
      >
        {lines.map((line) => (
          <div className={`terminal-line kind-${line.kind}`} key={line.id}>
            <span className="terminal-line-source">
              {LINE_SOURCES[line.kind] ?? '系统'}
            </span>
            <span className="terminal-line-text">{line.text}</span>
          </div>
        ))}
      </div>

      <form className="terminal-input-row" onSubmit={handleSubmit}>
        <span className="terminal-prompt" aria-hidden="true">
          ›
        </span>
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入命令或「帮助」，按回车执行"
          aria-label="终端命令输入"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck="false"
          enterKeyHint="send"
        />
        <button type="submit" className="terminal-send" aria-label="执行命令">
          <span>执行</span>
          <CornerDownLeft size={15} />
        </button>
      </form>

      <div className="terminal-footnote">
        <span>↑ ↓ 调取历史命令</span>
        <span>输入内容会写入观察者</span>
      </div>
    </section>
  );
}