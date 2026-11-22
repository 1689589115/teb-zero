export const ARCHIVE_FILES = [
  {
    id: 'file-01',
    index: 'A-001',
    name: '访客接入记录',
    classification: '接入层',
    size: '2.4 KB',
    integrityCost: 4,
    status: 'readable',
    updatedLabel: '本次会话',
    summary: '记录当前访问者的接入方式与只读镜像状态。',
    body: [
      '检测到一个新的观察窗口。访问来源：本地浏览器。',
      '系统已建立只读镜像，未向外部网络发送数据。',
      '访客的每一次标签页操作将被写入独立行为序列。',
    ],
  },
  {
    id: 'file-02',
    index: 'A-014',
    name: '回声迭代日志',
    classification: '回声层',
    size: '6.8 KB',
    integrityCost: 7,
    status: 'corrupted',
    updatedLabel: '时间戳损坏',
    summary: '部分迭代记录已缺失，只留下不完整的回应片段。',
    body: [
      '编号 E-03 至 E-07 的响应数据缺失。',
      '剩余片段反复出现同一句提示：「关闭不等于消失。」',
      '系统建议：不要尝试补全缺失内容。',
    ],
  },
  {
    id: 'file-03',
    index: 'A-027',
    name: '零号标签索引',
    classification: '禁止访问',
    size: '0.9 KB',
    integrityCost: 3,
    status: 'sealed',
    updatedLabel: '已封存',
    summary: '指向 TAB ZERO 的目标索引，目前不可读取。',
    body: [
      '索引目标不可达。',
      '权限层级：未授予。',
      '当前阶段不提供读取接口。',
    ],
  },
  {
    id: 'file-04',
    index: 'A-031',
    name: '关闭页面残片',
    classification: '回收站',
    size: '1.2 KB',
    integrityCost: 5,
    status: 'readable',
    updatedLabel: '随访问更新',
    summary: '标签页关闭后残留的临时记录，内容不完整。',
    body: [
      '此处只保留页面关闭时产生的余温。',
      '标签页的数据不会被删除，只是从视线中移开。',
      '下一次重新打开时，系统会尝试恢复上一次的状态。',
    ],
  },
  {
    id: 'file-05',
    index: 'A-042',
    name: '观察者备注',
    classification: '观察层',
    size: '3.1 KB',
    integrityCost: 6,
    status: 'readable',
    updatedLabel: '静态档案',
    summary: '观察者对行为记录原则的说明。',
    body: [
      '记录必须来自真实行为。',
      '不要修饰，也不要预测。',
      '被关闭的页面仍然拥有记忆。',
    ],
  },
];

export const ARCHIVE_FILE_BY_ID = Object.fromEntries(
  ARCHIVE_FILES.map((file) => [file.id, file]),
);

export const ARCHIVE_STATUS_LABELS = {
  readable: '可读取',
  corrupted: '部分损坏',
  sealed: '已封存',
};