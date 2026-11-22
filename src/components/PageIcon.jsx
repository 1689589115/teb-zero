import {
  AlertCircle,
  Archive,
  CircleHelp,
  Eye,
  Fingerprint,
  Home,
  Terminal,
  Waves,
} from 'lucide-react';

const ICONS = {
  home: Home,
  observer: Eye,
  terminal: Terminal,
  archive: Archive,
  error404: AlertCircle,
  echo: Waves,
  tabzero: Fingerprint,
};

export default function PageIcon({
  name,
  size = 18,
  strokeWidth = 1.7,
  ...props
}) {
  const Icon = ICONS[name] ?? CircleHelp;
  return <Icon size={size} strokeWidth={strokeWidth} aria-hidden="true" {...props} />;
}