import { useEffect, useState } from "react";

export default function Splash() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="min-h-screen min-h-dvh flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(160deg, #1E3A8A 0%, #2563EB 60%, #3B82F6 100%)" }}
    >
      <div
        className="flex flex-col items-center gap-6"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.6s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
        >
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
            <rect x="6" y="8" width="30" height="36" rx="4" fill="white" fillOpacity="0.9"/>
            <rect x="10" y="15" width="18" height="2.5" rx="1.25" fill="#1E3A8A"/>
            <rect x="10" y="21" width="14" height="2.5" rx="1.25" fill="#1E3A8A" fillOpacity="0.6"/>
            <rect x="10" y="27" width="16" height="2.5" rx="1.25" fill="#1E3A8A" fillOpacity="0.6"/>
            <rect x="10" y="33" width="10" height="2.5" rx="1.25" fill="#1E3A8A" fillOpacity="0.4"/>
            <circle cx="38" cy="36" r="10" fill="#10B981"/>
            <path d="M33.5 36.2l3 3 6-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div className="text-center">
          <h1
            className="text-5xl font-black text-white mb-3"
            style={{ fontFamily: "'Cairo', sans-serif", letterSpacing: "-0.5px" }}
          >
            سِجِل
          </h1>
          <p
            className="text-lg font-medium"
            style={{ color: "rgba(255,255,255,0.75)", fontFamily: "'Cairo', sans-serif" }}
          >
            نظم عملياتك في مكان واحد
          </p>
        </div>
      </div>

      <div
        className="absolute bottom-12 flex flex-col items-center gap-2"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 0.6s ease 0.6s",
        }}
      >
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: i === 0 ? "white" : "rgba(255,255,255,0.4)",
                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1.1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
