import { useState, useMemo } from "react";
import Header from "../components/Header";
import StatsCard from "../components/StatsCard";
import SearchBar from "../components/SearchBar";
import OperationCard from "../components/OperationCard";
import OperationForm from "../components/OperationForm";
import ConfirmDialog from "../components/ConfirmDialog";
import { Toast, useToast } from "../components/Toast";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { Operation, FilterType } from "../types";
import { getTodayDate, getYesterdayDate, formatDateAr, generateId, getCurrentTime } from "../utils/dateHelpers";

export default function Home() {
  const shopName = localStorage.getItem("sijil_shop_name") ?? "";
  const [operations, setOperations] = useLocalStorage<Operation[]>("sijil_operations", []);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("today");
  const [customDate, setCustomDate] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editOp, setEditOp] = useState<Operation | null>(null);
  const [deleteOp, setDeleteOp] = useState<Operation | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const { toasts, showToast, removeToast } = useToast();

  const today = getTodayDate();
  const yesterday = getYesterdayDate();

  const activeDate =
    filter === "today" ? today : filter === "yesterday" ? yesterday : customDate;

  const filtered = useMemo(() => {
    let ops = [...operations].sort((a, b) => b.createdAt - a.createdAt);

    if (search.trim()) {
      ops = ops.filter((o) =>
        o.operationNumber.toLowerCase().includes(search.trim().toLowerCase())
      );
    } else if (activeDate) {
      ops = ops.filter((o) => o.date === activeDate);
    }

    return ops;
  }, [operations, search, activeDate]);

  const todayOps = useMemo(
    () => operations.filter((o) => o.date === today),
    [operations, today]
  );
  const todayTotal = useMemo(
    () => todayOps.reduce((s, o) => s + o.amount, 0),
    [todayOps]
  );

  const handleSave = (operationNumber: string, amount: number) => {
    if (editOp) {
      setOperations((prev) =>
        prev.map((o) =>
          o.id === editOp.id ? { ...o, operationNumber, amount } : o
        )
      );
      showToast("تم تعديل العملية بنجاح ✓");
    } else {
      const newOp: Operation = {
        id: generateId(),
        operationNumber,
        amount,
        date: today,
        time: getCurrentTime(),
        createdAt: Date.now(),
      };
      setOperations((prev) => [newOp, ...prev]);
      showToast("تمت إضافة العملية بنجاح ✓");
    }
    setEditOp(null);
    setShowForm(false);
  };

  const handleDelete = () => {
    if (!deleteOp) return;
    setOperations((prev) => prev.filter((o) => o.id !== deleteOp.id));
    showToast("تم حذف العملية", "error");
    setDeleteOp(null);
  };

  const handleResetAll = () => {
    setOperations([]);
    showToast("تم مسح جميع البيانات", "info");
    setShowSidebar(false);
  };

  const handleChangeName = () => {
    localStorage.removeItem("sijil_shop_name");
    localStorage.removeItem("sijil_operations");
    window.location.reload();
  };

  const filterLabels: Record<FilterType, string> = {
    today: "اليوم",
    yesterday: "أمس",
    custom: "تاريخ محدد",
  };

  const displayDate =
    filter === "today"
      ? "اليوم"
      : filter === "yesterday"
      ? "أمس"
      : customDate
      ? formatDateAr(customDate)
      : "تاريخ محدد";

  return (
    <div
      className="min-h-screen min-h-dvh flex flex-col"
      style={{ background: "#F8FAFC", direction: "rtl" }}
    >
      <Header shopName={shopName} onMenuOpen={() => setShowSidebar(true)} />

      <div className="flex-1 pb-28">
        <StatsCard todayCount={todayOps.length} todayTotal={todayTotal} />

        <SearchBar value={search} onChange={setSearch} />

        {!search && (
          <div className="mx-4 mt-4">
            <div
              className="flex gap-2 p-1.5 rounded-xl"
              style={{ background: "#E2E8F0" }}
            >
              {(["today", "yesterday", "custom"] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    fontFamily: "'Cairo', sans-serif",
                    background: filter === f ? "#fff" : "transparent",
                    color: filter === f ? "#1E3A8A" : "#64748B",
                    boxShadow: filter === f ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  {filterLabels[f]}
                </button>
              ))}
            </div>

            {filter === "custom" && (
              <div className="mt-3">
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  max={today}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{
                    fontFamily: "'Cairo', sans-serif",
                    border: "2px solid #E2E8F0",
                    background: "#fff",
                    color: "#0F172A",
                  }}
                />
              </div>
            )}
          </div>
        )}

        <div className="mt-4">
          <div className="flex items-center justify-between px-4 mb-3">
            <h2
              className="text-sm font-bold"
              style={{ color: "#374151", fontFamily: "'Cairo', sans-serif" }}
            >
              {search ? `نتائج البحث` : `عمليات ${displayDate}`}
            </h2>
            {filtered.length > 0 && (
              <span
                className="px-2.5 py-1 rounded-full text-xs font-bold"
                style={{ background: "#EFF6FF", color: "#1E3A8A", fontFamily: "'Cairo', sans-serif" }}
              >
                {filtered.length} عملية
              </span>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-8">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
                style={{ background: "#EFF6FF" }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#93C5FD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <p
                className="text-base font-bold mb-2"
                style={{ color: "#374151", fontFamily: "'Cairo', sans-serif" }}
              >
                {search ? "لا توجد نتائج" : "لا توجد عمليات"}
              </p>
              <p
                className="text-sm text-center"
                style={{ color: "#94A3B8", fontFamily: "'Cairo', sans-serif", lineHeight: 1.7 }}
              >
                {search
                  ? `لا يوجد رقم عملية يحتوي على "${search}"`
                  : "اضغط على زر + لإضافة عملية جديدة"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((op) => (
                <OperationCard
                  key={op.id}
                  operation={op}
                  onEdit={(o) => {
                    setEditOp(o);
                    setShowForm(true);
                  }}
                  onDelete={(o) => setDeleteOp(o)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => {
          setEditOp(null);
          setShowForm(true);
        }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-7 py-4 rounded-2xl text-white font-bold text-base transition-all active:scale-95"
        style={{
          background: "linear-gradient(135deg, #1E3A8A, #2563EB)",
          boxShadow: "0 6px 24px rgba(30,58,138,0.4)",
          fontFamily: "'Cairo', sans-serif",
          zIndex: 30,
          direction: "rtl",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        إضافة عملية
      </button>

      {showForm && (
        <OperationForm
          editOperation={editOp}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditOp(null);
          }}
        />
      )}

      {deleteOp && (
        <ConfirmDialog
          title="حذف العملية"
          message={`هل تريد حذف عملية رقم ${deleteOp.operationNumber}؟ لا يمكن التراجع عن هذا الإجراء.`}
          confirmLabel="حذف"
          cancelLabel="إلغاء"
          danger
          onConfirm={handleDelete}
          onClose={() => setDeleteOp(null)}
        />
      )}

      {showResetConfirm && (
        <ConfirmDialog
          title="مسح جميع البيانات"
          message="هل أنت متأكد؟ سيتم حذف جميع العمليات المسجلة ولا يمكن التراجع."
          confirmLabel="مسح الكل"
          cancelLabel="إلغاء"
          danger
          onConfirm={handleResetAll}
          onClose={() => setShowResetConfirm(false)}
        />
      )}

      {showSidebar && (
        <>
          <div
            className="fixed inset-0 z-50"
            style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)" }}
            onClick={() => setShowSidebar(false)}
          />
          <div
            className="fixed top-0 right-0 bottom-0 z-50 w-72 flex flex-col"
            style={{
              background: "#fff",
              boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
              animation: "slideInRight 0.3s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <div
              className="px-5 pt-12 pb-6"
              style={{ background: "linear-gradient(135deg, #1E3A8A, #2563EB)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.15)" }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'Cairo', sans-serif" }}>
                    المحل
                  </p>
                  <p className="text-base font-bold text-white" style={{ fontFamily: "'Cairo', sans-serif" }}>
                    {shopName}
                  </p>
                </div>
              </div>
            </div>

            <nav className="flex-1 p-4">
              <div className="flex flex-col gap-2">
                <div
                  className="px-4 py-3 rounded-xl flex items-center gap-3"
                  style={{ background: "#EFF6FF" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  <span className="text-sm font-bold" style={{ color: "#1E3A8A", fontFamily: "'Cairo', sans-serif" }}>
                    الرئيسية
                  </span>
                </div>

                <div
                  className="px-4 py-3 rounded-xl flex items-center gap-3"
                  style={{ background: "#F8FAFC" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6"/>
                    <line x1="8" y1="12" x2="21" y2="12"/>
                    <line x1="8" y1="18" x2="21" y2="18"/>
                    <line x1="3" y1="6" x2="3.01" y2="6"/>
                    <line x1="3" y1="12" x2="3.01" y2="12"/>
                    <line x1="3" y1="18" x2="3.01" y2="18"/>
                  </svg>
                  <div>
                    <span className="text-sm font-semibold" style={{ color: "#374151", fontFamily: "'Cairo', sans-serif" }}>
                      إجمالي العمليات
                    </span>
                    <p className="text-xs" style={{ color: "#94A3B8", fontFamily: "'Cairo', sans-serif" }}>
                      {operations.length} عملية محفوظة
                    </p>
                  </div>
                </div>
              </div>
            </nav>

            <div className="p-4 border-t" style={{ borderColor: "#E2E8F0" }}>
              <button
                onClick={() => {
                  setShowSidebar(false);
                  handleChangeName();
                }}
                className="w-full py-3 rounded-xl text-sm font-semibold mb-2 flex items-center gap-2 px-4 transition-all active:scale-95"
                style={{ background: "#F1F5F9", color: "#374151", fontFamily: "'Cairo', sans-serif" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                تغيير اسم المحل
              </button>
              <button
                onClick={() => {
                  setShowSidebar(false);
                  setShowResetConfirm(true);
                }}
                className="w-full py-3 rounded-xl text-sm font-semibold flex items-center gap-2 px-4 transition-all active:scale-95"
                style={{ background: "#FEF2F2", color: "#EF4444", fontFamily: "'Cairo', sans-serif" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/>
                </svg>
                مسح جميع البيانات
              </button>
            </div>
          </div>
        </>
      )}

      {toasts.map((t) => (
        <Toast
          key={t.id}
          message={t.message}
          type={t.type}
          onClose={() => removeToast(t.id)}
        />
      ))}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
