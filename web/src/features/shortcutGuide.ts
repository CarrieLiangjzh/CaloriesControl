import { SHORTCUT_NAME } from "../domain/shortcutSync";

export function renderShortcutGuide(baseUrl: string): string {
  return `
    <article class="card muted">
      <h2>第一次：装快捷指令</h2>
      <p>网页读不了健康 App。用系统「快捷指令」读今日活动能量，再打开本页。指令名称必须是「${SHORTCUT_NAME}」。新版 iOS 搜不到「接收」，不必加那一步。</p>
      <ol class="steps">
        <li>iPhone 打开「快捷指令」→ 右上角 +。标题改成 <strong>${SHORTCUT_NAME}</strong>（一字不差）。</li>
        <li>添加「获取当前日期」，再添加「格式化日期」：点进去把「日期格式」改成<strong>自定</strong>，填 <code>yyyy-MM-dd</code>。不要用系统短日期（会变成 18-09-2026）。</li>
        <li>添加「设置变量」：名称 <code>kcal</code>，值填 <code>0</code>。读不到数据时也用 0 回跳，避免停在快捷指令里。</li>
        <li>添加「查找健康样本」：类型选<strong>活动能量</strong>，开始日期选<strong>今天</strong>（不要「最近 7 天」），单位千卡，限制关掉。允许健康权限。</li>
        <li>添加「如果」：条件选上一步样本<strong>有任何值</strong>。在「如果」里面：先「计算统计数据」求<strong>总和</strong>，再「设置变量」<code>kcal</code> 为该总和。</li>
        <li>在「如果」<strong>外面</strong>添加「文本」，内容为：<br /><code>${baseUrl}#/sync/格式化日期/kcal</code></li>
        <li>添加「替换文本」：输入选上一步文本，把 <code>,</code> 替换成 <code>.</code>。系统会把 153,381 写成带逗号的数，「打开 URL」会按逗号拆成两个地址；换成点之后变成 153.381，就能打开。</li>
        <li>添加「打开 URL」，URL 选<strong>替换后的文本</strong>。必须是最后一步。</li>
      </ol>
      <p>打开 URL 之前预览应类似 <code>${baseUrl}#/sync/2026-09-18/153.381</code>，不要再出现逗号。</p>
    </article>
  `;
}
