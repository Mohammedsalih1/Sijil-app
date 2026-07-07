const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export function initAnalytics(): void {
  if (!GA_ID) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID);
}

export function trackScreen(screen: string): void {
  if (!GA_ID || typeof window.gtag !== "function") return;
  window.gtag("event", "page_view", {
    page_title: screen,
    page_path: `/${screen}`,
  });
}
