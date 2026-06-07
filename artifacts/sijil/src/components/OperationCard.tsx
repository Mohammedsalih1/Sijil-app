import { Operation } from "../types";
import { formatDateAr, formatTimeAr, formatAmountAr } from "../utils/dateHelpers";

interface OperationCardProps {
  operation: Operation;
  onEdit: (op: Operation) => void;
  onDelete: (op: Operation) => void;
}

export default function OperationCard({ operation, onEdit, onDelete }: OperationCardProps) {
  return (
    <div
      className="mx-4 rounded-2xl p-4 transition-all animate-fade-in"
      style={{
        background: "#fff",
        border: "1.5px solid #E2E8F0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "#EFF6FF" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1E3A8A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </div>
            <div className="min-w-0">
              <p
                className="text-xs font-medium truncate"
                style={{ color: "#64748B", fontFamily: "'Cairo', sans-serif" }}
              >
                رقم العملية
              </p>
              <p
                className="text-base font-bold truncate"
                style={{ color: "#0F172A", fontFamily: "'Cairo', sans-serif" }}
              >
                {operation.operationNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3">
            <div>
              <p
                className="text-xs font-medium"
                style={{ color: "#64748B", fontFamily: "'Cairo', sans-serif" }}
              >
                المبلغ
              </p>
              <div className="flex items-baseline gap-1">
                <span
                  className="text-xl font-black"
                  style={{ color: "#10B981", fontFamily: "'Cairo', sans-serif" }}
                >
                  {formatAmountAr(operation.amount)}
                </span>
                <span
                  className="text-xs font-semibold"
                  style={{ color: "#10B981", fontFamily: "'Cairo', sans-serif" }}
                >
                  ر.س
                </span>
              </div>
            </div>

            <div
              className="w-px h-10"
              style={{ background: "#E2E8F0" }}
            />

            <div>
              <p
                className="text-xs font-medium"
                style={{ color: "#64748B", fontFamily: "'Cairo', sans-serif" }}
              >
                التاريخ
              </p>
              <p
                className="text-sm font-semibold"
                style={{ color: "#374151", fontFamily: "'Cairo', sans-serif" }}
              >
                {formatDateAr(operation.date)}
              </p>
            </div>

            <div>
              <p
                className="text-xs font-medium"
                style={{ color: "#64748B", fontFamily: "'Cairo', sans-serif" }}
              >
                الوقت
              </p>
              <p
                className="text-sm font-semibold"
                style={{ color: "#374151", fontFamily: "'Cairo', sans-serif" }}
              >
                {formatTimeAr(operation.time)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button
            onClick={() => onEdit(operation)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95"
            style={{ background: "#EFF6FF", border: "1px solid #DBEAFE" }}
            aria-label="تعديل"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1E3A8A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button
            onClick={() => onDelete(operation)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95"
            style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}
            aria-label="حذف"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/>
              <path d="M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
