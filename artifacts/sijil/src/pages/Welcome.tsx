import { useState } from "react";
import AppLogo from "../components/AppLogo";

interface Props {
  onDone: () => void;
}

export default function Welcome({ onDone }: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("يرجى إدخال اسم المحل أو اسمك");
      return;
    }
    localStorage.setItem("sijil_shop_name", name.trim());
    onDone();
  };

  return (
    <div
      className="min-h-screen min-h-dvh flex flex-col"
      style={{ background: "#F8FAFC" }}
    >
      <div
        className="h-64 flex flex-col items-center justify-end pb-10"
        style={{ background: "linear-gradient(160deg, #1E3A8A 0%, #2563EB 60%, #3B82F6 100%)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <AppLogo size={64} rounded="18px" />
          <h1 className="text-3xl font-black text-white" style={{ fontFamily: "'Cairo', sans-serif" }}>
            سِجِل
          </h1>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 -mt-8">
        <div
          className="rounded-3xl shadow-lg animate-fade-in overflow-hidden"
          style={{ background: "#fff", border: "1px solid #E2E8F0" }}
        >
          <div className="p-7">
            <h2
              className="text-2xl font-bold mb-1"
              style={{ color: "#0F172A", fontFamily: "'Cairo', sans-serif" }}
            >
              مرحباً بك 👋
            </h2>
            <p
              className="text-base mb-7"
              style={{ color: "#64748B", fontFamily: "'Cairo', sans-serif" }}
            >
              أدخل اسم محلك لنبدأ التسجيل
            </p>

            <div className="flex flex-col gap-5">
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "#374151", fontFamily: "'Cairo', sans-serif" }}
                >
                  اسم المحل أو اسمك
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="مثال: بقالة الأمين"
                  className="w-full rounded-xl px-4 py-3.5 text-base outline-none transition-all"
                  style={{
                    fontFamily: "'Cairo', sans-serif",
                    border: error ? "2px solid #EF4444" : "2px solid #E2E8F0",
                    background: "#F8FAFC",
                    color: "#0F172A",
                    direction: "rtl",
                  }}
                  onFocus={(e) => { if (!error) e.target.style.border = "2px solid #3B82F6"; }}
                  onBlur={(e) => { if (!error) e.target.style.border = "2px solid #E2E8F0"; }}
                  autoFocus
                />
                {error && (
                  <p className="mt-2 text-sm" style={{ color: "#EF4444", fontFamily: "'Cairo', sans-serif" }}>
                    {error}
                  </p>
                )}
              </div>

              <button
                onClick={handleSubmit}
                className="w-full py-4 rounded-xl text-base font-bold text-white transition-all active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #1E3A8A, #2563EB)",
                  fontFamily: "'Cairo', sans-serif",
                  boxShadow: "0 4px 14px rgba(30,58,138,0.3)",
                }}
              >
                ابدأ الآن
              </button>
            </div>
          </div>
        </div>

        <p
          className="text-center text-xs mt-6"
          style={{ color: "#94A3B8", fontFamily: "'Cairo', sans-serif" }}
        >
          جميع البيانات محفوظة على جهازك فقط
        </p>
      </div>
    </div>
  );
}
