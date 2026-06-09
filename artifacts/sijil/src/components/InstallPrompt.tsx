import { useState, useEffect } from "react";
import AppLogo from "./AppLogo";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isInstalled =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (isInstalled) return;

    const dismissed = sessionStorage.getItem("sijil_install_dismissed");
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
      setTimeout(() => setVisible(true), 50);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      handleDismiss();
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem("sijil_install_dismissed", "true");
    setTimeout(() => setShow(false), 350);
  };

  if (!show) return null;

  return (
    <div
      className="fixed bottom-24 left-4 right-4 z-40 rounded-2xl p-4 flex items-center gap-3"
      style={{
        background: "#fff",
        border: "1.5px solid #DBEAFE",
        boxShadow: "0 8px 32px rgba(30,58,138,0.18)",
        transform: visible ? "translateY(0)" : "translateY(20px)",
        opacity: visible ? 1 : 0,
        transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      <AppLogo size={44} rounded="12px" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold" style={{ color: "#0F172A", fontFamily: "'Cairo', sans-serif" }}>
          ثبّت تطبيق سِجِل
        </p>
        <p className="text-xs" style={{ color: "#64748B", fontFamily: "'Cairo', sans-serif" }}>
          للوصول السريع من شاشتك الرئيسية
        </p>
      </div>
      <div className="flex flex-col gap-1.5 flex-shrink-0">
        <button
          onClick={handleInstall}
          className="px-3 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
          style={{
            background: "linear-gradient(135deg, #1E3A8A, #2563EB)",
            fontFamily: "'Cairo', sans-serif",
          }}
        >
          تثبيت
        </button>
        <button
          onClick={handleDismiss}
          className="px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
          style={{
            background: "#F1F5F9",
            color: "#64748B",
            fontFamily: "'Cairo', sans-serif",
          }}
        >
          لاحقاً
        </button>
      </div>
    </div>
  );
}
