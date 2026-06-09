import { useState, useEffect } from "react";
import { isValidCode } from "../data/activationCodes";
import AppLogo from "../components/AppLogo";

interface Props {
  onActivated: () => void;
}

const WHATSAPP_NUMBER = "249123711866";
const WHATSAPP_MSG = encodeURIComponent("مرحباً، أرغب في الاشتراك وتفعيل تطبيق سِجِل.");

export default function Activation({ onActivated }: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleActivate = () => {
    if (!code.trim()) { setError("يرجى إدخال كود التفعيل"); return; }
    if (isValidCode(code)) {
      localStorage.setItem("sijil_activated", "true");
      setSuccess(true);
      setTimeout(() => onActivated(), 1600);
    } else {
      setError("كود التفعيل غير صحيح");
    }
  };

  return (
    <div
      className="min-h-screen min-h-dvh flex flex-col"
      style={{ background: "#F8FAFC", direction: "rtl" }}
    >
      <div
        className="flex flex-col items-center justify-end pb-10 pt-16"
        style={{ background: "linear-gradient(160deg, #1E3A8A 0%, #2563EB 60%, #3B82F6 100%)" }}
      >
        <div
          className="flex flex-col items-center gap-3"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(16px)",
            transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <AppLogo size={72} rounded="20px" />
          <h1
            className="text-4xl font-black text-white"
            style={{ fontFamily: "'Cairo', sans-serif" }}
          >
            سِجِل
          </h1>
        </div>

        <div
          className="mt-6 mb-0 px-6 pb-0 w-full max-w-sm"
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 0.5s ease 0.2s",
          }}
        >
          <div
            className="rounded-2xl px-5 py-4 text-center"
            style={{ background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.35)" }}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FCA5A5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span className="text-sm font-bold" style={{ color: "#FCA5A5", fontFamily: "'Cairo', sans-serif" }}>
                انتهت الفترة التجريبية
              </span>
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.75)", fontFamily: "'Cairo', sans-serif", lineHeight: 1.7 }}>
              للاستمرار في استخدام تطبيق سِجِل يرجى الاشتراك وتفعيل النسخة
            </p>
          </div>
        </div>
      </div>

      <div
        className="flex-1 px-5 pt-5 pb-10 flex flex-col gap-4 max-w-sm mx-auto w-full"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(12px)",
          transition: "all 0.5s cubic-bezier(0.16,1,0.3,1) 0.15s",
        }}
      >
        <div
          className="rounded-2xl p-5"
          style={{ background: "#fff", border: "1.5px solid #E2E8F0", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#EFF6FF" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "#64748B", fontFamily: "'Cairo', sans-serif" }}>رسوم الاشتراك</p>
              <p className="text-xl font-black" style={{ color: "#1E3A8A", fontFamily: "'Cairo', sans-serif" }}>5,000 جنيه سوداني</p>
            </div>
          </div>
          <div className="rounded-xl px-4 py-3" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span className="text-xs font-semibold" style={{ color: "#065F46", fontFamily: "'Cairo', sans-serif" }}>استخدام غير محدود بعد التفعيل</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span className="text-xs font-semibold" style={{ color: "#065F46", fontFamily: "'Cairo', sans-serif" }}>جميع بياناتك محفوظة وستعود بعد التفعيل</span>
            </div>
          </div>
        </div>

        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-95"
          style={{
            background: "linear-gradient(135deg, #16A34A, #22C55E)",
            boxShadow: "0 4px 16px rgba(22,163,74,0.35)",
            fontFamily: "'Cairo', sans-serif",
            textDecoration: "none",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          الاشتراك عبر واتساب
        </a>

        <div
          className="rounded-2xl p-5"
          style={{ background: "#fff", border: "1.5px solid #E2E8F0", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}
        >
          <p className="text-sm font-bold mb-3" style={{ color: "#374151", fontFamily: "'Cairo', sans-serif" }}>
            لديك كود تفعيل؟
          </p>

          {success ? (
            <div className="rounded-xl py-4 flex flex-col items-center gap-2" style={{ background: "#F0FDF4", border: "1.5px solid #BBF7D0" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#10B981" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <p className="text-base font-bold" style={{ color: "#065F46", fontFamily: "'Cairo', sans-serif" }}>شكراً لاشتراكك في سِجِل</p>
              <p className="text-xs" style={{ color: "#10B981", fontFamily: "'Cairo', sans-serif" }}>جاري فتح التطبيق...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => { const d = e.target.value.replace(/\D/g, "").slice(0, 6); setCode(d); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleActivate()}
                placeholder="أدخل كود التفعيل (6 أرقام)"
                maxLength={6}
                className="w-full rounded-xl px-4 py-3.5 text-base outline-none transition-all text-center font-bold"
                style={{
                  fontFamily: "'Cairo', sans-serif",
                  border: error ? "2px solid #EF4444" : "2px solid #E2E8F0",
                  background: "#F8FAFC",
                  color: "#0F172A",
                  letterSpacing: "0.25em",
                }}
                onFocus={(e) => { if (!error) e.target.style.border = "2px solid #3B82F6"; }}
                onBlur={(e) => { if (!error) e.target.style.border = "2px solid #E2E8F0"; }}
              />
              {error && (
                <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p className="text-sm font-semibold" style={{ color: "#EF4444", fontFamily: "'Cairo', sans-serif" }}>{error}</p>
                </div>
              )}
              <button
                onClick={handleActivate}
                className="w-full py-3.5 rounded-xl text-base font-bold text-white transition-all active:scale-95"
                style={{
                  background: code.length === 6 ? "linear-gradient(135deg, #1E3A8A, #2563EB)" : "#CBD5E1",
                  fontFamily: "'Cairo', sans-serif",
                  boxShadow: code.length === 6 ? "0 4px 14px rgba(30,58,138,0.3)" : "none",
                }}
              >
                تفعيل الكود
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs" style={{ color: "#94A3B8", fontFamily: "'Cairo', sans-serif" }}>
          جميع بياناتك محفوظة وآمنة على جهازك
        </p>
      </div>
    </div>
  );
}
