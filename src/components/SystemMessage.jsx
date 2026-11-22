import { AlertCircle, Radio, ShieldCheck, X } from 'lucide-react';

const TONE_ICONS = {
  info: Radio,
  success: ShieldCheck,
  error: AlertCircle,
  warning: AlertCircle,
};

export default function SystemMessage({
  tone = 'info',
  title,
  message,
  onClose,
  className = '',
}) {
  const Icon = TONE_ICONS[tone] ?? Radio;

  return (
    <div
      className={`system-message tone-${tone} ${className}`.trim()}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <span className="system-message-icon">
        <Icon size={16} />
      </span>
      <div className="system-message-copy">
        {title ? <strong>{title}</strong> : null}
        {message ? <p>{message}</p> : null}
      </div>
      {onClose ? (
        <button
          type="button"
          className="system-message-close"
          aria-label="关闭提示"
          onClick={onClose}
        >
          <X size={14} />
        </button>
      ) : null}
    </div>
  );
}