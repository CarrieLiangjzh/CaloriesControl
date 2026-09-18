export function isWeChatBrowser(): boolean {
  return /MicroMessenger/i.test(navigator.userAgent);
}

export function isStandaloneDisplay(): boolean {
  const media = window.matchMedia?.("(display-mode: standalone)").matches;
  const iosStandalone =
    "standalone" in navigator &&
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return Boolean(media || iosStandalone);
}
