import {
  ECHO_BASE_MESSAGES,
  ECHO_TRIGGERED_REPLIES,
} from '../data/dialogues';

export function createEchoReply(triggeredCount) {
  const index = triggeredCount % ECHO_TRIGGERED_REPLIES.length;
  return {
    id: `echo-reply-${Date.now()}-${triggeredCount}`,
    text: ECHO_TRIGGERED_REPLIES[index],
    tone: 'echo',
    trigger: 'terminal',
    at: new Date().toISOString(),
  };
}

export function getEchoConversation(state) {
  return [
    ...ECHO_BASE_MESSAGES,
    ...state.triggeredEchoMessages.map((message) => ({
      ...message,
      kind: 'echo',
    })),
  ];
}

export function getEchoObservation(state) {
  const tabClosures = state.events.filter(
    (event) => event.type === 'TAB_CLOSED',
  ).length;
  const commands = state.events.filter(
    (event) => event.type === 'COMMAND_EXECUTED',
  ).length;

  return {
    visits: state.openTabs.length,
    tabClosures,
    commands,
    triggers: state.triggeredEchoMessages.length,
  };
}