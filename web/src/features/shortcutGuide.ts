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
        <li>添加「查找健康样本」：类型选<strong>活动能量</strong>，开始/结束都选今天。第一次会问健康权限，请允许。</li>
        <li>添加「统计」，对上一步样本求<strong>总和</strong>。健身 App 若显示千焦，再加计算「除以 4.184」得到千卡。</li>
        <li>添加「文本」，内容为：<br /><code>输入#/sync?activeKcal=总和&amp;date=格式化日期</code><br />其中「输入」是快捷指令输入（本站地址），「总和」和「日期」用操作变量点进去。</li>
        <li>添加「打开 URL」，URL 选上一步文本。</li>
      </ol>
      <p>本机预览时，快捷指令输入应是：</p>
      <p><code>${baseUrl}</code></p>
      <p>点「同步手表」会自动把这个地址传给指令。锻炼列表可先不做；可用手填写「已跑步 30 分钟」。</p>
    </article>
  `;
}
