import { formatAmountAr } from "../utils/dateHelpers";

interface StatsCardProps {
  todayCount: number;
  todayTotal: number;
}

export default function StatsCard({ todayCount, todayTotal }: StatsCardProps) {
  return (
    <div
      className="mx-4 mt-4 rounded-2xl p-5"
      style={{
        background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)",
        boxShadow: "0 4px 20px rgba(30,58,138,0.25)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <span
          className="text-sm font-semibold"
          style={{ color: "rgba(255,255,255,0.8)", fontFamily: "'Cairo', sans-serif" }}
        >
          إحصائيات اليوم
        </span>
        <div
          className="px-2.5 py-1 rounded-full text-xs font-bold"
          style={{ background: "rgba(255,255,255,0.15)", color: "white", fontFamily: "'Cairo', sans-serif" }}
        >
          {new Date().toLocaleDateString("ar-SA", { weekday: "long" })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(255,255,255,0.12)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span
              className="text-xs font-medium"
              style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'Cairo', sans-serif" }}
            >
              عدد العمليات
            </span>
          </div>
          <p
            className="text-3xl font-black text-white"
            style={{ fontFamily: "'Cairo', sans-serif" }}
          >
            {todayCount}
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: "rgba(255,255,255,0.55)", fontFamily: "'Cairo', sans-serif" }}
          >
            عملية اليوم
          </p>
        </div>

        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.3)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            <span
              className="text-xs font-medium"
              style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'Cairo', sans-serif" }}
            >
              إجمالي المبالغ
            </span>
          </div>
          <p
            className="text-2xl font-black text-white leading-tight"
            style={{ fontFamily: "'Cairo', sans-serif" }}
          >
            {formatAmountAr(todayTotal)}
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: "#10B981", fontFamily: "'Cairo', sans-serif" }}
          >
            ريال سعودي
          </p>
        </div>
      </div>
    </div>
  );
}
