// 结局内容将在剧情阶段加入；第一阶段只保留数据结构。
export const ENDINGS = [];

export const ENDING_BY_ID = Object.fromEntries(
  ENDINGS.map((ending) => [ending.id, ending]),
);