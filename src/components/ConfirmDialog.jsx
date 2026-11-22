import { useEffect, useId, useRef } from 'react';
import { AlertCircle, RotateCcw, X } from 'lucide-react';

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '确认',
  cancelLabel = '取消',
  busy = false,
  onConfirm,
  onCancel,
}) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    requestAnimationFrame(() => cancelRef.current?.focus());

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [busy, onCancel, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="modal-layer"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) {
          onCancel();
        }
      }}
    >
      <section
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <button
          type="button"
          className="modal-close"
          aria-label="关闭确认窗口"
          onClick={onCancel}
          disabled={busy}
        >
          <X size={16} />
        </button>

        <div className="confirm-dialog-icon">
          <AlertCircle size={22} />
        </div>
        <p className="modal-kicker">系统级操作 / RESET</p>
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId} className="confirm-dialog-description">
          {description}
        </p>

        <div className="confirm-warning">
          此操作会清除当前页面状态、行为记录和所有系统指标，且无法撤销。
        </div>

        <div className="confirm-dialog-actions">
          <button
            ref={cancelRef}
            type="button"
            className="button button-ghost"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="button button-danger"
            onClick={onConfirm}
            disabled={busy}
          >
            <RotateCcw size={15} />
            {busy ? '正在重置' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}