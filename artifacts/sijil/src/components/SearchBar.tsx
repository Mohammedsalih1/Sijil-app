interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="mx-4 mt-4">
      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3"
        style={{
          background: "#fff",
          border: "1.5px solid #E2E8F0",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="ابحث برقم العملية..."
          className="flex-1 bg-transparent outline-none text-sm"
          style={{
            fontFamily: "'Cairo', sans-serif",
            color: "#0F172A",
            direction: "rtl",
          }}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="flex-shrink-0 transition-opacity hover:opacity-60"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
