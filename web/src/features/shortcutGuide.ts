import { SHORTCUT_NAME } from "../domain/shortcutSync";

export function renderShortcutGuide(baseUrl: string): string {
  return `
    <article class="card muted">
      <h2>第一次：装快捷指令</h2>
      <p>网页读不了健康 App。用系统「快捷指令」读今日活动能量，再打开本页。指令名称必须是「${SHORTCUT_NAME}」。新版 iOS 搜不到「接收」，不必加那一步。</p>
      <ol class="steps">
        <li>iPhone 打开「快捷指令」→ 右上角 +。标题改成 <strong>${SHORTCUT_NAME}</strong>（一字不差）。</li>
        <li>添加「获取当前日期」，再添加「格式化日期」，格式选自定义 <code>yyyy-MM-dd</code>。</li>
        <li>添加「设置变量」：名称 <code>kcal</code>，值填 <code>0</code>。读不到数据时也用 0 回跳，避免停在快捷指令里。</li>
        <li>添加「查找健康样本」：类型选<strong>活动能量</strong>，开始日期选<strong>今天</strong>（不要「最近 7 天」），单位千卡，限制关掉。允许健康权限。</li>
        <li>添加「如果」：条件选上一步样本<strong>有任何值</strong>。在「如果」里面：先「计算统计数据」求<strong>总和</strong>，再「设置变量」<code>kcal</code> 为该总和。不要把健康样本拖进打开 URL。</li>
        <li>在「如果」<strong>外面</strong>添加「文本」，内容为固定网址拼路径：<br /><code>${baseUrl}#/sync/格式化日期/kcal</code><br />后两段用变量插入。不要用问号和 <code>&amp;</code>。</li>
        <li>添加「打开 URL」，URL 选上一步文本。这一步必须是最后一步，获取失败时 kcal 仍是 0，也会打开网页。</li>
      </ol>
      <p>预览应类似：<code>${baseUrl}#/sync/2026-09-18/387</code>；没数据则末尾是 <code>/0</code>。</p>
      <p>点「同步手表」时，若指令直接报错，网页也会自行跳回并提示手填。</p>
    </article>
  `;
}
