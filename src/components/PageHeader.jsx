import { getPageDefinition, PAGE_DEFINITIONS } from '../data/pages';
import PageIcon from './PageIcon';

export default function PageHeader({ pageId, actions, aside }) {
  const page = getPageDefinition(pageId);

  if (!page) {
    return null;
  }

  const pageIndex = PAGE_DEFINITIONS.findIndex((item) => item.id === pageId) + 1;

  return (
    <header className="page-header">
      <div className="page-heading">
        <div className="page-eyebrow">
          <span className={`page-eyebrow-icon tone-${page.accent}`}>
            <PageIcon name={page.icon} size={15} />
          </span>
          <span>{page.code}</span>
          <span className="eyebrow-line" aria-hidden="true" />
          <span className="page-index">
            节点 {String(pageIndex).padStart(2, '0')}
          </span>
        </div>
        <h1>{page.title}</h1>
        <p>{page.description}</p>
      </div>
      {aside ? <div className="page-header-aside">{aside}</div> : null}
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}