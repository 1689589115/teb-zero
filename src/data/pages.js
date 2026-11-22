export const PAGE_DEFINITIONS = [
  {
    id: 'home',
    label: '首页',
    code: 'HOME',
    title: '系统首页',
    description: '接入点与系统总览',
    url: 'zero://home',
    icon: 'home',
    accent: 'green',
    locked: false,
  },
  {
    id: 'observer',
    label: '观察者',
    code: 'OBSERVER',
    title: '行为观察记录',
    description: '系统记录下的真实操作轨迹',
    url: 'zero://observer',
    icon: 'observer',
    accent: 'green',
    locked: false,
  },
  {
    id: 'terminal',
    label: '终端',
    code: 'TERMINAL',
    title: '零号系统终端',
    description: '向系统发送指令并读取回应',
    url: 'zero://terminal',
    icon: 'terminal',
    accent: 'green',
    locked: false,
  },
  {
    id: 'archive',
    label: '记忆档案',
    code: 'ARCHIVE',
    title: '记忆档案库',
    description: '浏览、隔离与恢复系统片段',
    url: 'zero://archive',
    icon: 'archive',
    accent: 'green',
    locked: false,
  },
  {
    id: 'error404',
    label: '失落页面',
    code: '404',
    title: '失落页面',
    description: '被系统回收的异常入口',
    url: 'zero://void/404',
    icon: 'error404',
    accent: 'red',
    locked: false,
  },
  {
    id: 'echo',
    label: '回声',
    code: 'ECHO',
    title: '回声观测室',
    description: '与系统回声进行有限的交流',
    url: 'zero://echo',
    icon: 'echo',
    accent: 'violet',
    locked: false,
  },
  {
    id: 'tabzero',
    label: '零号标签',
    code: 'TAB ZERO',
    title: '零号标签',
    description: '系统深处尚未开放的终点',
    url: 'zero://tab-zero',
    icon: 'tabzero',
    accent: 'violet',
    locked: true,
  },
];

export const PAGE_IDS = PAGE_DEFINITIONS.map((page) => page.id);

export const PAGE_BY_ID = Object.fromEntries(
  PAGE_DEFINITIONS.map((page) => [page.id, page]),
);

export function getPageDefinition(pageId) {
  return PAGE_BY_ID[pageId] ?? null;
}

export function getPageLabel(pageId) {
  return PAGE_BY_ID[pageId]?.label ?? '未知页面';
}

export const INITIAL_OPEN_PAGE = 'home';