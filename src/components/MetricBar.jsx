import { METRIC_DEFINITIONS } from '../engine/gameState';

export default function MetricBar({ metricKey, value, compact = false }) {
  const definition =
    METRIC_DEFINITIONS.find((metric) => metric.key === metricKey) ??
    METRIC_DEFINITIONS[0];

  return (
    <div className={`metric-bar${compact ? ' is-compact' : ''}`}>
      <div className="metric-bar-head">
        <span className="metric-bar-label">
          {definition.label}
          <span className="metric-bar-code">{definition.code}</span>
        </span>
        <strong className={`metric-bar-value tone-${definition.tone}`}>
          {value}
          <span>%</span>
        </strong>
      </div>
      <div
        className={`metric-track tone-${definition.tone}`}
        role="progressbar"
        aria-label={definition.label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}