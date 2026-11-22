import {
  Archive as ArchiveIcon,
  Database,
  FileText,
  FileWarning,
  Lock,
  RotateCcw,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import MetricBar from '../components/MetricBar';
import PageHeader from '../components/PageHeader';
import {
  ARCHIVE_FILES,
  ARCHIVE_STATUS_LABELS,
} from '../data/archive';
import { useGameStore } from '../stores/gameStore';

export default function Archive() {
  const selectedFileId = useGameStore(
    (state) => state.pageData.archive.selectedFileId,
  );
  const quarantinedFiles = useGameStore((state) => state.quarantinedFiles);
  const memoryIntegrity = useGameStore(
    (state) => state.metrics.memoryIntegrity,
  );
  const selectArchiveFile = useGameStore((state) => state.selectArchiveFile);
  const toggleFileQuarantine = useGameStore(
    (state) => state.toggleFileQuarantine,
  );

  const selectedFile =
    ARCHIVE_FILES.find((file) => file.id === selectedFileId) ?? ARCHIVE_FILES[0];
  const selectedIsQuarantined = quarantinedFiles.includes(selectedFile.id);
  const selectedIsSealed = selectedFile.status === 'sealed';

  return (
    <section className="page page-archive">
      <PageHeader
        pageId="archive"
        aside={
          <div className="archive-memory-chip">
            <Database size={14} />
            <span>记忆完整度</span>
            <strong>{memoryIntegrity}%</strong>
          </div>
        }
      />

      <div className="archive-stats">
        <div>
          <span>档案总数</span>
          <strong>{ARCHIVE_FILES.length}</strong>
        </div>
        <div>
          <span>已隔离</span>
          <strong className={quarantinedFiles.length > 0 ? 'text-danger' : ''}>
            {quarantinedFiles.length}
          </strong>
        </div>
        <div>
          <span>当前选中</span>
          <strong>{selectedFile.index}</strong>
        </div>
        <div className="archive-stat-meter">
          <MetricBar
            metricKey="memoryIntegrity"
            value={memoryIntegrity}
            compact
          />
        </div>
      </div>

      <div className="archive-layout">
        <section className="panel archive-browser">
          <header className="panel-header">
            <div>
              <span className="panel-kicker">FILE INDEX</span>
              <h2>档案索引</h2>
            </div>
            <span className="archive-count">{ARCHIVE_FILES.length} 项</span>
          </header>

          <div className="archive-file-list">
            {ARCHIVE_FILES.map((file) => {
              const isQuarantined = quarantinedFiles.includes(file.id);
              const isSelected = file.id === selectedFile.id;
              const isSealed = file.status === 'sealed';
              const FileIcon = isSealed
                ? Lock
                : file.status === 'corrupted' || isQuarantined
                  ? FileWarning
                  : FileText;

              return (
                <button
                  type="button"
                  key={file.id}
                  className={`archive-file${isSelected ? ' is-selected' : ''}${isQuarantined ? ' is-quarantined' : ''}`}
                  onClick={() => selectArchiveFile(file.id)}
                  aria-pressed={isSelected}
                >
                  <span className="archive-file-icon">
                    <FileIcon size={17} />
                  </span>
                  <span className="archive-file-copy">
                    <strong>{file.name}</strong>
                    <span>
                      {file.index} · {file.classification}
                    </span>
                  </span>
                  <span
                    className={`archive-file-status status-${isQuarantined ? 'quarantined' : file.status}`}
                  >
                    {isQuarantined
                      ? '已隔离'
                      : ARCHIVE_STATUS_LABELS[file.status]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="archive-browser-note">
            <ArchiveIcon size={14} />
            关闭页面或浏览器后，档案索引与隔离状态仍会被保留。
          </div>
        </section>

        <article className="panel archive-document">
          <header className="archive-document-head">
            <div>
              <span className="document-index">{selectedFile.index}</span>
              <h2>{selectedFile.name}</h2>
              <p>{selectedFile.summary}</p>
            </div>
            <span
              className={`document-status status-${selectedIsQuarantined ? 'quarantined' : selectedFile.status}`}
            >
              {selectedIsQuarantined
                ? '已隔离'
                : ARCHIVE_STATUS_LABELS[selectedFile.status]}
            </span>
          </header>

          <div className="document-meta">
            <div>
              <span>档案编号</span>
              <strong>{selectedFile.index}</strong>
            </div>
            <div>
              <span>所属层级</span>
              <strong>{selectedFile.classification}</strong>
            </div>
            <div>
              <span>数据占用</span>
              <strong>{selectedFile.size}</strong>
            </div>
            <div>
              <span>完整度影响</span>
              <strong>-{selectedFile.integrityCost}%</strong>
            </div>
            <div>
              <span>更新时间</span>
              <strong>{selectedFile.updatedLabel}</strong>
            </div>
          </div>

          {selectedIsQuarantined ? (
            <div className="document-alert tone-warning">
              <ShieldAlert size={16} />
              <div>
                <strong>此档案已移入隔离区</strong>
                <p>恢复后可重新读取完整内容。隔离状态已写入观察者记录。</p>
              </div>
            </div>
          ) : null}

          <div
            className={`document-body${selectedIsQuarantined ? ' is-quarantined' : ''}${selectedIsSealed ? ' is-sealed' : ''}`}
          >
            {selectedIsSealed ? (
              <div className="document-sealed">
                <Lock size={26} />
                <strong>档案已封存</strong>
                <p>当前阶段未授予读取权限。无需尝试绕过系统。</p>
              </div>
            ) : (
              selectedFile.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))
            )}
          </div>

          <footer className="document-actions">
            <span className="document-actions-note">
              {selectedIsSealed
                ? '封存档案不可隔离。'
                : selectedIsQuarantined
                  ? '恢复会回填记忆完整度。'
                  : '隔离不是永久删除，可随时恢复。'}
            </span>

            {selectedIsSealed ? (
              <button type="button" className="button button-ghost" disabled>
                <Lock size={15} />
                已封存
              </button>
            ) : (
              <button
                type="button"
                className={`button ${selectedIsQuarantined ? 'button-primary' : 'button-danger-ghost'}`}
                onClick={() => toggleFileQuarantine(selectedFile.id)}
              >
                {selectedIsQuarantined ? (
                  <>
                    <RotateCcw size={15} />
                    从隔离区恢复
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    移入隔离区
                  </>
                )}
              </button>
            )}
          </footer>
        </article>
      </div>
    </section>
  );
}