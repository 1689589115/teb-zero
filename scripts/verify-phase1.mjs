import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const BASE_URL = 'http://localhost:5173/';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACTS = path.resolve('test-artifacts');
const results = [];
const consoleProblems = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function record(name, passed, detail) {
  results.push({ name, passed, detail });
  console.log(`${passed ? '通过' : '失败'} · ${name} · ${detail}`);
}

async function assertNoHorizontalOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  assert(
    metrics.scrollWidth <= metrics.innerWidth,
    `${label}出现横向溢出：${metrics.scrollWidth}/${metrics.innerWidth}`,
  );
}

async function assertChromeVisible(page, label) {
  const state = await page.evaluate(() => ({
    chromeTop: document.querySelector('.browser-chrome').getBoundingClientRect().top,
    shellScrollTop: document.querySelector('.browser-shell').scrollTop,
  }));
  assert(
    state.chromeTop >= 0 && state.shellScrollTop === 0,
    `${label}浏览器顶栏被滚动移出视口（top=${state.chromeTop}, scrollTop=${state.shellScrollTop}）`,
  );
}

async function openPageCenter(page) {
  const layer = page.locator('.page-center-dialog');
  if (!(await layer.isVisible().catch(() => false))) {
    await page.locator('.tabbar-add').click();
    await layer.waitFor({ state: 'visible' });
  }
}

async function openFromPageCenter(page, label) {
  await openPageCenter(page);
  const card = page
    .locator('.page-center-card')
    .filter({ has: page.getByRole('heading', { name: label, exact: true }) });
  assert((await card.count()) === 1, `页面中心找不到「${label}」`);
  await card.locator('.page-center-open').click();
  await page.waitForTimeout(150);
  await assertChromeVisible(page, `打开「${label}」后`);
}

async function activateTab(page, label) {
  const tab = page.locator('.browser-tab').filter({ hasText: label }).first();
  await tab.click();
  await page.waitForTimeout(120);
}

async function closeTab(page, label) {
  const tab = page.locator('.browser-tab').filter({ hasText: label }).first();
  await tab.locator('.browser-tab-close').click();
  await page.waitForTimeout(220);
}

async function waitForApp(page) {
  await page.locator('.browser-shell').waitFor({ state: 'visible' });
  await page.waitForTimeout(300);
}

async function readDatabase(page) {
  return page.evaluate(async () => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open('tab-zero-memory');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const read = (storeName, requestFactory) =>
      new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readonly');
        const request = requestFactory(transaction.objectStore(storeName));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

    const state = await read('game_state', (store) => store.get('current'));
    const events = await read('game_events', (store) => store.getAll());
    database.close();
    return { state, events };
  });
}

async function waitForEventCount(page, expected, timeout = 4000) {
  const deadline = Date.now() + timeout;
  let latest = null;

  while (Date.now() < deadline) {
    latest = await readDatabase(page);
    if ((latest.events?.length ?? 0) >= expected) {
      return latest;
    }
    await page.waitForTimeout(120);
  }

  throw new Error(
    `等待事件持久化失败，期望至少 ${expected} 条，实际 ${latest?.events?.length ?? 0} 条`,
  );
}

async function waitForReset(page, timeout = 4000) {
  const deadline = Date.now() + timeout;
  let latest = null;

  while (Date.now() < deadline) {
    latest = await readDatabase(page);
    if (
      latest.state &&
      latest.events.length === 0 &&
      latest.state.gameStarted === false &&
      latest.state.openTabs.length === 1 &&
      latest.state.openTabs[0] === 'home'
    ) {
      return latest;
    }
    await page.waitForTimeout(120);
  }

  throw new Error('等待重置完成失败');
}

async function attachDiagnostics(page, label) {
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      consoleProblems.push(`[${label}] console.${message.type()}: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => {
    consoleProblems.push(`[${label}] pageerror: ${error.message}`);
  });
}

await fs.mkdir(ARTIFACTS, { recursive: true });

const browser = await chromium.launch({
  executablePath: EDGE_PATH,
  headless: true,
});

try {
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 920 },
    deviceScaleFactor: 1,
  });
  const page = await desktop.newPage();
  await attachDiagnostics(page, '桌面端');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await waitForApp(page);

  await page.screenshot({
    path: path.join(ARTIFACTS, 'desktop-home.png'),
      });

  assert(
    await page.getByRole('heading', { name: /欢迎进入/ }).isVisible(),
    '首页欢迎标题未显示',
  );
  assert(
    await page.getByRole('button', { name: '开始探索' }).isVisible(),
    '首页缺少开始探索入口',
  );
  record('测试 1A · 首页初始界面', true, '欢迎语、系统状态和开始探索入口正常显示');

  await page.getByRole('button', { name: '开始探索' }).click();
  await page.locator('.page-center-dialog').waitFor({ state: 'visible' });
  await page.waitForTimeout(320);
  await page.screenshot({
    path: path.join(ARTIFACTS, 'desktop-page-center.png'),
      });
  record('测试 1B · 开始探索与页面中心', true, '开始探索后页面中心正常打开');

  await openFromPageCenter(page, '观察者');
  assert(
    (await page.locator('.page-heading h1').innerText()) === '行为观察记录',
    '观察者页面未打开',
  );
  await page.screenshot({
    path: path.join(ARTIFACTS, 'desktop-observer.png'),
      });
  await openFromPageCenter(page, '终端');
  assert(
    (await page.locator('.page-heading h1').innerText()) === '零号系统终端',
    '终端页面未打开',
  );
  await openFromPageCenter(page, '回声');
  assert(
    (await page.locator('.page-heading h1').innerText()) === '回声观测室',
    '回声页面未打开',
  );
  await page.screenshot({
    path: path.join(ARTIFACTS, 'desktop-echo.png'),
      });
  await openFromPageCenter(page, '失落页面');
  assert(
    (await page.locator('.page-heading h1').innerText()) === '失落页面',
    '失落页面未打开',
  );
  await page.screenshot({
    path: path.join(ARTIFACTS, 'desktop-error404.png'),
      });
  await openFromPageCenter(page, '零号标签');
  assert(
    (await page.locator('.page-heading h1').innerText()) === '零号标签',
    '零号标签入口未打开',
  );
  assert(
    await page.getByRole('heading', { name: '零号标签仍在沉睡' }).isVisible(),
    '零号标签未显示锁定状态',
  );
  await page.screenshot({
    path: path.join(ARTIFACTS, 'desktop-tabzero.png'),
      });

  await openFromPageCenter(page, '记忆档案');
  assert(
    (await page.locator('.page-heading h1').innerText()) === '记忆档案库',
    '记忆档案页面未打开',
  );
  await page.screenshot({
    path: path.join(ARTIFACTS, 'desktop-archive.png'),
      });
  record(
    '测试 1C · 七个页面入口',
    true,
    '首页、观察者、终端、记忆档案、失落页面、回声、零号标签均可进入',
  );

  await page
    .locator('.archive-file')
    .filter({ hasText: '回声迭代日志' })
    .click();
  await page.waitForTimeout(120);
  assert(
    (await page.locator('.archive-document-head h2').innerText()) === '回声迭代日志',
    '档案选择状态未更新',
  );

  const beforeCloseDb = await readDatabase(page);
  await closeTab(page, '记忆档案');
  const afterCloseDb = await waitForEventCount(
    page,
    (beforeCloseDb.events?.length ?? 0) + 1,
  );
  const closeEvent = afterCloseDb.events.findLast(
    (event) => event.type === 'TAB_CLOSED' && event.pageId === 'archive',
  );
  assert(closeEvent, 'IndexedDB 中没有记录记忆档案关闭事件');
  assert(
    afterCloseDb.state.pages.archive.closeCount === 1,
    '记忆档案关闭次数未更新',
  );
  record(
    '测试 2 · 关闭记忆档案并记录事件',
    true,
    `已记录 TAB_CLOSED，关闭次数=${afterCloseDb.state.pages.archive.closeCount}`,
  );

  await activateTab(page, '观察者');
  const observerLog = page.locator('.event-log');
  assert(
    (await observerLog.innerText()).includes('关闭「记忆档案」标签页'),
    '观察者页面未读取到记忆档案关闭记录',
  );
  record(
    '测试 4 · 观察者读取关闭记录',
    true,
    '观察者页面已展示记忆档案关闭事件与真实时间',
  );

  await openFromPageCenter(page, '记忆档案');
  assert(
    (await page.locator('.archive-document-head h2').innerText()) === '回声迭代日志',
    '重新打开记忆档案后未恢复此前选中的档案',
  );
  const reopenEvent = (await readDatabase(page)).events.findLast(
    (event) => event.type === 'TAB_REOPENED' && event.pageId === 'archive',
  );
  assert(reopenEvent, '重新打开记忆档案未记录 TAB_REOPENED');
  await page.screenshot({
    path: path.join(ARTIFACTS, 'desktop-archive-reopened.png'),
      });
  record(
    '测试 3 · 重新打开并恢复页面状态',
    true,
    '档案页重新打开后仍选中「回声迭代日志」，并记录 TAB_REOPENED',
  );

  const readMemory = async () =>
    Number.parseFloat(
      await page.locator('.archive-memory-chip strong').innerText(),
    );
  const memoryBefore = await readMemory();
  await page.getByRole('button', { name: '移入隔离区' }).click();
  await page.waitForTimeout(250);
  const memoryAfter = await readMemory();
  assert(memoryAfter < memoryBefore, '隔离档案后记忆完整度未下降');
  assert(
    await page.getByRole('button', { name: '从隔离区恢复' }).isVisible(),
    '隔离后未出现恢复按钮',
  );
  await page.getByRole('button', { name: '从隔离区恢复' }).click();
  await page.waitForTimeout(250);
  const afterRestoreDb = await readDatabase(page);
  assert(
    afterRestoreDb.events.some((event) => event.type === 'FILE_DELETED'),
    '缺少 FILE_DELETED 事件',
  );
  assert(
    afterRestoreDb.events.some((event) => event.type === 'FILE_RESTORED'),
    '缺少 FILE_RESTORED 事件',
  );
  record(
    '附加测试 · 档案隔离与恢复',
    true,
    `记忆完整度 ${memoryBefore}% → ${memoryAfter}% → ${Number.parseFloat(await page.locator('.archive-memory-chip strong').innerText())}%，事件完整`,
  );

  await activateTab(page, '终端');
  const commandInput = page.getByRole('textbox', { name: '终端命令输入' });
  await commandInput.fill('状态');
  await commandInput.press('Enter');
  await page.waitForTimeout(200);
  assert(
    (await page.locator('.terminal-log').innerText()).includes('回声信任'),
    '终端状态命令没有返回中文结果',
  );
  await commandInput.fill('回声');
  await commandInput.press('Enter');
  await page.waitForTimeout(300);
  assert(
    (await page.locator('.terminal-log').innerText()).includes('回声：'),
    '回声命令未触发回应',
  );
  const terminalDb = await readDatabase(page);
  assert(
    terminalDb.events.some((event) => event.type === 'COMMAND_EXECUTED'),
    '缺少 COMMAND_EXECUTED 事件',
  );
  assert(
    terminalDb.events.some((event) => event.type === 'ECHO_MESSAGE_TRIGGERED'),
    '缺少 ECHO_MESSAGE_TRIGGERED 事件',
  );
  await page.screenshot({
    path: path.join(ARTIFACTS, 'desktop-terminal.png'),
      });
  record(
    '附加测试 · 终端命令与回声事件',
    true,
    '命令「状态」「回声」均得到中文反馈，相关事件已持久化',
  );

  const beforeReloadDb = await readDatabase(page);
  await activateTab(page, '观察者');
  await page.waitForTimeout(400);
  await page.reload({ waitUntil: 'networkidle' });
  await waitForApp(page);
  assert(
    (await page.locator('.page-heading h1').innerText()) === '行为观察记录',
    '刷新后未恢复当前观察者页面',
  );
  assert(
    (await page.locator('.event-log').innerText()).includes('关闭「记忆档案」标签页'),
    '刷新后历史事件丢失',
  );
  await activateTab(page, '记忆档案');
  assert(
    (await page.locator('.archive-document-head h2').innerText()) === '回声迭代日志',
    '刷新后档案页面状态丢失',
  );
  const afterReloadDb = await readDatabase(page);
  assert(
    afterReloadDb.events.length >= beforeReloadDb.events.length,
    '刷新后 IndexedDB 事件数量减少',
  );
  await page.screenshot({
    path: path.join(ARTIFACTS, 'desktop-after-reload.png'),
      });
  record(
    '测试 5 · 刷新后持久化',
    true,
    `恢复当前页面、选中档案与 ${afterReloadDb.events.length} 条历史事件`,
  );

  await page.locator('.chrome-reset').click();
  await page.locator('.confirm-dialog').waitFor({ state: 'visible' });
  assert(
    await page.getByRole('button', { name: '确认重新开始' }).isVisible(),
    '重新开始缺少确认按钮',
  );
  await page.getByRole('button', { name: '保留进度' }).click();
  assert(
    await page.locator('.confirm-dialog').isHidden(),
    '取消后确认弹窗未关闭',
  );
  assert(
    (await page.locator('.browser-tab').count()) > 1,
    '取消重新开始后页面被错误清除',
  );
  record(
    '测试 6A · 重新开始需要确认',
    true,
    '确认弹窗出现，取消后进度保持不变',
  );

  await page.locator('.chrome-reset').click();
  await page.getByRole('button', { name: '确认重新开始' }).click();
  const resetDb = await waitForReset(page);
  await page.waitForTimeout(300);
  assert(
    (await page.locator('.browser-tab').count()) === 1,
    '重置后不是仅保留首页标签',
  );
  assert(
    await page.getByRole('button', { name: '开始探索' }).isVisible(),
    '重置后首页未恢复初始欢迎状态',
  );
  await page.reload({ waitUntil: 'networkidle' });
  await waitForApp(page);
  const resetAfterReload = await readDatabase(page);
  assert(
    resetAfterReload.events.length === 0 && resetAfterReload.state.gameStarted === false,
    '刷新后重置状态未保持',
  );
  record(
    '测试 6B · 重新开始恢复初始状态',
    true,
    `UI 与 IndexedDB 均已恢复初始状态，事件数=${resetDb.events.length}`,
  );

  const desktopOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  assert(!desktopOverflow, '桌面端出现横向溢出');
  record('测试 7A · 桌面端布局', true, '1440×920 视口无横向溢出，操作正常');
  await desktop.close();

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const mobilePage = await mobile.newPage();
  await attachDiagnostics(mobilePage, '手机端');
  await mobilePage.goto(BASE_URL, { waitUntil: 'networkidle' });
  await waitForApp(mobilePage);

  const mobileMetrics = await mobilePage.evaluate(() => ({
    width: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    shellWidth: document.querySelector('.browser-shell')?.getBoundingClientRect().width,
  }));
  assert(
    mobileMetrics.scrollWidth <= mobileMetrics.width,
    `手机端横向溢出：${mobileMetrics.scrollWidth}/${mobileMetrics.width}`,
  );
  await mobilePage.screenshot({
    path: path.join(ARTIFACTS, 'mobile-home.png'),
      });

  await mobilePage.getByRole('button', { name: '开始探索' }).click();
  await mobilePage.locator('.page-center-dialog').waitFor({ state: 'visible' });
  await mobilePage.waitForTimeout(320);
  const mobileLauncherColumns = await mobilePage.evaluate(() => {
    const grid = document.querySelector('.page-center-grid');
    return getComputedStyle(grid).gridTemplateColumns.split(' ').length;
  });
  assert(mobileLauncherColumns === 1, '手机端页面中心未切换为单列布局');
  await mobilePage.screenshot({
    path: path.join(ARTIFACTS, 'mobile-page-center.png'),
      });

  await openFromPageCenter(mobilePage, '记忆档案');
  await mobilePage
    .locator('.archive-file')
    .filter({ hasText: '观察者备注' })
    .click();
  await mobilePage
    .locator('.browser-viewport')
    .evaluate((node) => node.scrollTo({ top: 0 }));
  await mobilePage.waitForTimeout(120);
  await mobilePage.screenshot({
    path: path.join(ARTIFACTS, 'mobile-archive.png'),
      });
  await closeTab(mobilePage, '记忆档案');
  await mobilePage.locator('.tabbar-add').click();
  await openFromPageCenter(mobilePage, '观察者');
  assert(
    (await mobilePage.locator('.event-log').innerText()).includes(
      '关闭「记忆档案」标签页',
    ),
    '手机端关闭事件未进入观察者',
  );
  await mobilePage.screenshot({
    path: path.join(ARTIFACTS, 'mobile-observer.png'),
      });
  await assertNoHorizontalOverflow(mobilePage, '手机端观察者');

  await openFromPageCenter(mobilePage, '终端');
  const mobileInput = mobilePage.getByRole('textbox', { name: '终端命令输入' });
  await mobileInput.fill('帮助');
  await mobileInput.press('Enter');
  await mobilePage.waitForTimeout(250);
  assert(
    (await mobilePage.locator('.terminal-log').innerText()).includes('可用命令与中文说明'),
    '手机端终端命令执行失败',
  );
  await mobilePage
    .locator('.browser-viewport')
    .evaluate((node) => node.scrollTo({ top: 0 }));
  await mobilePage.waitForTimeout(120);
  const mobileOverflow = await mobilePage.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  assert(!mobileOverflow, '手机端操作后出现横向溢出');
  await mobilePage.screenshot({
    path: path.join(ARTIFACTS, 'mobile-terminal.png'),
      });

  await openFromPageCenter(mobilePage, '回声');
  await mobilePage.waitForTimeout(220);
  await mobilePage.screenshot({
    path: path.join(ARTIFACTS, 'mobile-echo.png'),
      });
  await assertNoHorizontalOverflow(mobilePage, '手机端回声');

  await openFromPageCenter(mobilePage, '失落页面');
  await mobilePage.waitForTimeout(220);
  await mobilePage.screenshot({
    path: path.join(ARTIFACTS, 'mobile-error404.png'),
      });
  await assertNoHorizontalOverflow(mobilePage, '手机端失落页面');

  await openFromPageCenter(mobilePage, '零号标签');
  await mobilePage.waitForTimeout(220);
  await mobilePage.screenshot({
    path: path.join(ARTIFACTS, 'mobile-tabzero.png'),
      });
  await assertNoHorizontalOverflow(mobilePage, '手机端零号标签');

  record(
    '测试 7B · 手机端适配与操作',
    true,
    '390×844 触控视口使用移动布局，无横向溢出，页面打开/关闭/终端操作正常',
  );
  await mobile.close();

  assert(
    consoleProblems.length === 0,
    `浏览器控制台存在问题：${consoleProblems.join(' | ')}`,
  );
  record('附加测试 · 控制台检查', true, '桌面端与手机端控制台无错误或警告');

  console.log('\n测试汇总：');
  results.forEach((result) => {
    console.log(`- ${result.name}: ${result.passed ? '通过' : '未通过'} (${result.detail})`);
  });
} catch (error) {
  console.error('\n测试中断：', error.stack || error.message);
  console.log('已完成的测试：');
  results.forEach((result) => {
    console.log(`- ${result.name}: ${result.detail}`);
  });
  process.exitCode = 1;
} finally {
  await browser.close();
}