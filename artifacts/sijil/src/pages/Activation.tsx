import { useState, useEffect } from "react";
import AppLogo from "../components/AppLogo";
import { getDeviceId, verifyActivationCode, activateSubscription } from "../utils/activation";

interface Props {
  onActivated: () => void;
}

const WHATSAPP_NUMBER = "249123711866";

export default function Activation({ onActivated }: Props) {
  const [deviceId] = useState(() => getDeviceId());
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  const waMsg = encodeURIComponent(
    `مرحباً، أرغب في تفعيل تطبيق سِجِل.\n\nمعرف الجهاز:\n${deviceId}`
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(deviceId);
    } catch {
      const el = document.createElement("textarea");
      el.value = deviceId;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleActivate = async () => {
    if (!code.trim()) {
      setError("يرجى إدخال كود التفعيل");
      return;
    }
    setChecking(true);
    setError("");
    let duration: number | null = null;
    try {
      duration = await verifyActivationCode(deviceId, code);
    } catch {
      duration = null;
    }
    setChecking(false);
    if (duration) {
      activateSubscription(duration);
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
        className="flex flex-col items-center justify-end pb-9 pt-14"
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
          <h1 className="text-4xl font-black text-white" style={{ fontFamily: "'Cairo', sans-serif" }}>
            سِجِل
          </h1>
        </div>

        <div
          className="mt-6 px-6 w-full max-w-sm"
          style={{ opacity: visible ? 1 : 0, transition: "opacity 0.5s ease 0.2s" }}
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
              للاستمرار في استخدام تطبيق سِجِل يرجى تفعيل الاشتراك
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
          <p className="text-xs font-medium mb-2" style={{ color: "#64748B", fontFamily: "'Cairo', sans-serif" }}>
            معرف الجهاز
          </p>
          <div className="flex items-center gap-2">
            <div
              className="flex-1 rounded-xl px-4 py-3 text-center"
              style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0" }}
            >
              <span
                className="text-lg font-black"
                style={{ color: "#1E3A8A", fontFamily: "monospace", letterSpacing: "0.08em" }}
              >
                {deviceId}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex-shrink-0"
              style={{
                background: copied ? "#F0FDF4" : "#EFF6FF",
                color: copied ? "#065F46" : "#1E3A8A",
                border: copied ? "1.5px solid #BBF7D0" : "1.5px solid #BFDBFE",
                fontFamily: "'Cairo', sans-serif",
              }}
            >
              {copied ? (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  تم النسخ
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  نسخ المعرف
                </>
              )}
            </button>
          </div>
        </div>

        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`}
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
          التفعيل عبر واتساب
        </a>

        <div
          className="rounded-2xl p-5"
          style={{ background: "#fff", border: "1.5px solid #E2E8F0", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}
        >
          <p className="text-sm font-bold mb-3" style={{ color: "#374151", fontFamily: "'Cairo', sans-serif" }}>
            أدخل كود التفعيل
          </p>

          {success ? (
            <div className="rounded-xl py-4 flex flex-col items-center gap-2" style={{ background: "#F0FDF4", border: "1.5px solid #BBF7D0" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#10B981" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <p className="text-base font-bold" style={{ color: "#065F46", fontFamily: "'Cairo', sans-serif" }}>تم تفعيل التطبيق بنجاح</p>
              <p className="text-xs" style={{ color: "#10B981", fontFamily: "'Cairo', sans-serif" }}>جاري فتح التطبيق...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleActivate()}
                placeholder="SJL-XXXX-XXXX"
                className="w-full rounded-xl px-4 py-3.5 text-base outline-none transition-all text-center font-bold"
                style={{
                  fontFamily: "monospace",
                  border: error ? "2px solid #EF4444" : "2px solid #E2E8F0",
                  background: "#F8FAFC",
                  color: "#0F172A",
                  letterSpacing: "0.12em",
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
                disabled={checking}
                className="w-full py-3.5 rounded-xl text-base font-bold text-white transition-all active:scale-95"
                style={{
                  background: code.trim() && !checking ? "linear-gradient(135deg, #1E3A8A, #2563EB)" : "#CBD5E1",
                  fontFamily: "'Cairo', sans-serif",
                  boxShadow: code.trim() && !checking ? "0 4px 14px rgba(30,58,138,0.3)" : "none",
                }}
              >
                {checking ? "جاري التحقق..." : "تفعيل التطبيق"}
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
