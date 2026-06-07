import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

export function Toast({ message, type = "success", onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 10);
    const hide = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 2800);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [onClose]);

  const bgColor = type === "success" ? "#10B981" : type === "error" ? "#EF4444" : "#3B82F6";
  const icon = type === "success" ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ) : type === "error" ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );

  return (
    <div
      className="fixed top-5 left-1/2 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl"
      style={{
        background: bgColor,
        transform: visible ? "translate(-50%, 0)" : "translate(-50%, -20px)",
        opacity: visible ? 1 : 0,
        transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
        maxWidth: "calc(100vw - 40px)",
        fontFamily: "'Cairo', sans-serif",
        minWidth: "200px",
      }}
    >
      <div className="flex-shrink-0">{icon}</div>
      <span className="text-white font-semibold text-sm">{message}</span>
    </div>
  );
}

export interface ToastState {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, showToast, removeToast };
}
