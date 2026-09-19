import { SHORTCUT_NAME } from "../domain/shortcutSync";

export function renderShortcutGuide(baseUrl: string): string {
  return `
    <article class="card muted">
      <h2>第一次：装快捷指令</h2>
      <p>网页读不了健康 App。用系统「快捷指令」读今日活动能量，再把数字交回本页。指令名称必须是「${SHORTCUT_NAME}」。新版 iOS 搜不到「接收」，不必加。</p>
      <ol class="steps">
        <li>打开「快捷指令」→ +。标题改成 <strong>${SHORTCUT_NAME}</strong>（一字不差）。</li>
        <li>「设置变量」：名称 <code>kcal</code>，值填 <code>0</code>。</li>
        <li>「查找健康样本」：类型<strong>活动能量</strong>，开始日期<strong>今天</strong>，单位千卡，限制关掉。允许健康权限。</li>
        <li>「如果」样本有任何值：里面「计算统计数据」求总和，再把 <code>kcal</code> 设成该总和。</li>
        <li>在「如果」外面添加「文本」，内容只放变量 <code>kcal</code>。</li>
        <li>「替换文本」：把 <code>,</code> 换成 <code>.</code>（搜「替换」，不要搜四舍五入）。</li>
        <li>最后一步用<strong>停止并输出</strong>（搜索「停止」），输出选替换后的文本。<strong>不要用「打开 URL」</strong>：从网页唤起时系统会拦住打开网址。改由热量控制把你带回来。</li>
      </ol>
      <p>在快捷指令里点播放，结果应是 <code>153.381</code> 这种数字，不要有逗号。然后必须从本页或 ${baseUrl} 的主屏幕图标点「同步手表」，才会跳回并写入。</p>
    </article>
  `;
}
