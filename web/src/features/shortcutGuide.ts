import { SHORTCUT_NAME } from "../domain/shortcutSync";

export function renderShortcutGuide(baseUrl: string): string {
  return `
    <article class="card muted">
      <h2>第一次：装快捷指令</h2>
      <p>网页读不了健康 App。用系统「快捷指令」读今日活动能量，再打开本页。指令名称必须是「${SHORTCUT_NAME}」。</p>
      <ol class="steps">
        <li>iPhone 打开「快捷指令」→ 右上角 +。</li>
        <li>点标题，改成 <strong>${SHORTCUT_NAME}</strong>（一字不差）。</li>
        <li>添加「接收快捷指令的输入」，类型选<strong>文本</strong>。</li>
        <li>添加「获取当前日期」，再添加「格式化日期」，格式选自定义 <code>yyyy-MM-dd</code>。</li>
        <li>添加「查找健康样本」：类型选<strong>活动能量</strong>，开始/结束都选今天。第一次会问健康权限，请允许。不要打开「限制」。</li>
        <li>添加「计算统计数据」（搜索「统计」）：输入选上一步样本，运算选<strong>总和</strong>。不要把「查找健康样本」自己的「总和」拖进打开 URL，否则会变成共享上百条健康记录，预览会报错。</li>
        <li>添加「设置变量」：名称 <code>kcal</code>，值选上一步统计结果。这一步把健康样本变成普通数字。</li>
        <li>添加「文本」，内容为：<br /><code>输入#/sync?activeKcal=kcal&amp;date=格式化日期</code><br />「输入」用快捷指令输入（本站地址），「kcal」用刚设的变量，「格式化日期」用第 4 步。井号后面必须是 <code>/sync</code>。</li>
        <li>添加「打开 URL」，URL 选上一步文本。</li>
      </ol>
      <p>预览时若仍提示「尝试共享 N 个健康项目」：到「设置 → 快捷指令 → 高级」打开「允许共享大量数据」，并确认打开 URL 里只有 <code>kcal</code> 变量、没有健康样本。</p>
      <p>本机预览时，快捷指令输入应是：</p>
      <p><code>${baseUrl}</code></p>
      <p>点「同步手表」会自动把这个地址传给指令。锻炼列表可先不做；可用手填写「已跑步 30 分钟」。</p>
    </article>
  `;
}
