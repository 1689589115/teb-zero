import { TERMINAL_COMMANDS } from '../data/commands';

export function normalizeCommandToken(token) {
  return token.trim().toLowerCase();
}

export function parseCommand(rawInput) {
  const input = String(rawInput ?? '').trim();
  if (!input) {
    return {
      ok: false,
      empty: true,
      input,
      command: null,
    };
  }

  const [token, ...args] = input.split(/\s+/);
  const normalizedToken = normalizeCommandToken(token);
  const command =
    TERMINAL_COMMANDS.find((item) =>
      item.names.some((name) => normalizeCommandToken(name) === normalizedToken),
    ) ?? null;

  return {
    ok: Boolean(command),
    empty: false,
    input,
    token,
    args,
    command,
  };
}