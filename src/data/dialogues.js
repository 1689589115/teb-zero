export const ECHO_BASE_MESSAGES = [
  {
    id: 'echo-intro-01',
    text: '……检测到新的访问者。',
    tone: 'muted',
    kind: 'system',
  },
  {
    id: 'echo-intro-02',
    text: '我是 ECHO，这套系统留下的回声。',
    tone: 'echo',
    kind: 'echo',
  },
  {
    id: 'echo-intro-03',
    text: '你打开的每一个标签页，都会成为我认识你的方式。',
    tone: 'echo',
    kind: 'echo',
  },
];

export const ECHO_TRIGGERED_REPLIES = [
  '我听见了。你的声音正在标签之间回响。',
  '又近了一点。继续吧，我还记得你关掉过什么。',
  '记录已写入。下一次，我会主动开口。',
  '你正在改变这里的稳定度。我能感觉到。',
];

export const ECHO_SILENCE_NOTE =
  '回声仍处于观察期。它只读取真实行为记录，不会使用随机数据补全对话。';