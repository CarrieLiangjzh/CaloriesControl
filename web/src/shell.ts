import { href, parseRoute, type AppRoute, type RouteName } from "./router";
import { isWeChatBrowser } from "./env/display";
import { bindFood, renderFood } from "./features/food";
import { bindProfile, renderProfile } from "./features/profile";
import { bindToday, renderToday } from "./features/today";
import { bindSync, renderSync } from "./features/sync";
import { bindWorkout, renderWorkout } from "./features/workout";

const TABS: { name: RouteName; label: string }[] = [
  { name: "today", label: "今日" },
  { name: "food", label: "饮食" },
  { name: "workout", label: "训练" },
  { name: "profile", label: "我的" },
];

export function mountShell(root: HTMLElement): void {
  const wechat = isWeChatBrowser()
    ? `<p class="banner" role="status">请在 Safari 打开本页后再添加到主屏幕。微信内置浏览器拍不了照，同步也不稳。点右上角 ··· → 在 Safari 打开。</p>`
    : "";
  root.innerHTML = `
    <div class="shell">
      ${wechat}
      <header class="top">
        <p class="brand">热量控制</p>
      </header>
      <main id="page" class="main"></main>
      <nav class="tabs" aria-label="主导航">
        ${TABS.map(
          (tab) => `
            <a class="tab" data-route="${tab.name}" href="${href(tab.name)}">${tab.label}</a>
          `,
        ).join("")}
      </nav>
    </div>
  `;

  const page = root.querySelector("#page");
  if (!(page instanceof HTMLElement)) {
    throw new Error("missing #page");
  }

  const render = (): void => {
    paint(page, parseRoute());
  };

  window.addEventListener("hashchange", render);
  render();
}

function paint(page: HTMLElement, route: AppRoute): void {
  page.innerHTML = renderPage(route);
  document.querySelectorAll<HTMLAnchorElement>(".tab").forEach((tab) => {
    const name = tab.dataset.route;
    const current = route.name === "sync" ? "today" : route.name;
    if (name === current) {
      tab.setAttribute("aria-current", "page");
    } else {
      tab.removeAttribute("aria-current");
    }
  });
  if (route.name === "profile") {
    bindProfile(page);
  }
  if (route.name === "today") {
    bindToday(page);
  }
  if (route.name === "food") {
    bindFood(page);
  }
  if (route.name === "workout") {
    bindWorkout(page);
  }
  if (route.name === "sync") {
    bindSync(route.params);
  }
}

function renderPage(route: AppRoute): string {
  switch (route.name) {
    case "food":
      return renderFood();
    case "workout":
      return renderWorkout();
    case "profile":
      return renderProfile();
    case "sync":
      return renderSync(route.params);
    default:
      return renderToday();
  }
}
