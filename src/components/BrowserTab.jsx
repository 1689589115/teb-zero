import { Lock, X } from 'lucide-react';
import PageIcon from './PageIcon';

export default function BrowserTab({
  page,
  active,
  locked,
  onSelect,
  onClose,
}) {
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      className={`browser-tab${active ? ' is-active' : ''}`}
      role="tab"
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      title={`${page.label} ${page.code}`}
    >
      <span className="browser-tab-icon">
        <PageIcon name={page.icon} size={15} />
      </span>
      <span className="browser-tab-copy">
        <span className="browser-tab-label">{page.label}</span>
        <span className="browser-tab-code">{page.code}</span>
      </span>
      {locked ? (
        <span className="browser-tab-lock" aria-label="尚未解锁">
          <Lock size={10} />
        </span>
      ) : null}
      <button
        type="button"
        className="browser-tab-close"
        aria-label={`关闭${page.label}页面`}
        title={`关闭${page.label}`}
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
      >
        <X size={13} />
      </button>
    </div>
  );
}