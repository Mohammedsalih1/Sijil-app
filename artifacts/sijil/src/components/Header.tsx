interface HeaderProps {
  shopName: string;
  onMenuOpen: () => void;
}

export default function Header({ shopName, onMenuOpen }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between"
      style={{
        background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)",
        boxShadow: "0 2px 12px rgba(30,58,138,0.25)",
      }}
    >
      <button
        onClick={onMenuOpen}
        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95"
        style={{ background: "rgba(255,255,255,0.12)" }}
        aria-label="القائمة"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 52 52" fill="none">
            <rect x="6" y="8" width="30" height="36" rx="4" fill="white" fillOpacity="0.9"/>
            <rect x="10" y="15" width="18" height="2.5" rx="1.25" fill="#1E3A8A"/>
            <rect x="10" y="21" width="14" height="2.5" rx="1.25" fill="#1E3A8A" fillOpacity="0.6"/>
            <rect x="10" y="27" width="16" height="2.5" rx="1.25" fill="#1E3A8A" fillOpacity="0.6"/>
            <circle cx="38" cy="36" r="10" fill="#10B981"/>
            <path d="M33.5 36.2l3 3 6-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h1
            className="text-xl font-black text-white"
            style={{ fontFamily: "'Cairo', sans-serif" }}
          >
            سِجِل
          </h1>
        </div>
        {shopName && (
          <span
            className="text-xs font-medium"
            style={{ color: "rgba(255,255,255,0.75)", fontFamily: "'Cairo', sans-serif" }}
          >
            {shopName}
          </span>
        )}
      </div>

      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
      </div>
    </header>
  );
}
