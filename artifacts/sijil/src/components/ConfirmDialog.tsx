import { useEffect, useState } from "react";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  danger?: boolean;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  onConfirm,
  onClose,
  danger = false,
}: ConfirmDialogProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 250);
  };

  const handleConfirm = () => {
    onConfirm();
    handleClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-5"
        style={{
          background: "rgba(15,23,42,0.55)",
          backdropFilter: "blur(4px)",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.25s ease",
        }}
        onClick={handleClose}
      >
        <div
          className="w-full max-w-sm rounded-3xl p-6"
          style={{
            background: "#fff",
            transform: visible ? "scale(1)" : "scale(0.9)",
            transition: "transform 0.25s cubic-bezier(0.16,1,0.3,1)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: danger ? "#FEF2F2" : "#EFF6FF" }}
          >
            {danger ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1E3A8A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            )}
          </div>

          <h3
            className="text-lg font-bold text-center mb-2"
            style={{ color: "#0F172A", fontFamily: "'Cairo', sans-serif" }}
          >
            {title}
          </h3>
          <p
            className="text-sm text-center mb-7"
            style={{ color: "#64748B", fontFamily: "'Cairo', sans-serif", lineHeight: 1.7 }}
          >
            {message}
          </p>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 py-3.5 rounded-xl font-bold transition-all active:scale-95"
              style={{
                background: "#F1F5F9",
                color: "#64748B",
                fontFamily: "'Cairo', sans-serif",
                fontSize: "0.95rem",
              }}
            >
              {cancelLabel}
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3.5 rounded-xl font-bold text-white transition-all active:scale-95"
              style={{
                background: danger ? "#EF4444" : "linear-gradient(135deg, #1E3A8A, #2563EB)",
                fontFamily: "'Cairo', sans-serif",
                fontSize: "0.95rem",
                boxShadow: danger ? "0 4px 14px rgba(239,68,68,0.3)" : "0 4px 14px rgba(30,58,138,0.3)",
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
