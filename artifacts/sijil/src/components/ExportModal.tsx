import { useState, useRef, useEffect, useMemo } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import { Operation } from "../types";
import { getTodayDate, getYesterdayDate, formatDateAr, formatAmount, formatTimeAr } from "../utils/dateHelpers";

type ExportPeriod = "today" | "yesterday" | "month" | "all" | "custom";
type ExportStatus = "idle" | "loading" | "success" | "error";

interface ExportModalProps {
  operations: Operation[];
  shopName: string;
  onClose: () => void;
}

const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function filterOps(ops: Operation[], period: ExportPeriod, today: string, yesterday: string, from: string, to: string): Operation[] {
  switch (period) {
    case "today":     return ops.filter(o => o.date === today);
    case "yesterday": return ops.filter(o => o.date === yesterday);
    case "month":     return ops.filter(o => o.date.startsWith(today.slice(0, 7)));
    case "all":       return [...ops];
    case "custom":
      if (!from || !to) return [];
      return ops.filter(o => o.date >= from && o.date <= to);
  }
}

function getPeriodLabel(period: ExportPeriod, today: string, yesterday: string, from: string, to: string): string {
  const [y, m] = today.split("-");
  switch (period) {
    case "today":     return `اليوم — ${formatDateAr(today)}`;
    case "yesterday": return `أمس — ${formatDateAr(yesterday)}`;
    case "month":     return `${ARABIC_MONTHS[parseInt(m) - 1]} ${y}`;
    case "all":       return "جميع العمليات";
    case "custom":
      if (!from || !to) return "فترة مخصصة";
      return `من ${formatDateAr(from)} إلى ${formatDateAr(to)}`;
  }
}

/* ─── PDF Report Template ─────────────────────────────────────── */
function PdfReport({ ops, shopName, periodLabel, totalAmount, reportDate }: {
  ops: Operation[];
  shopName: string;
  periodLabel: string;
  totalAmount: number;
  reportDate: string;
}) {
  const FONT = "'Cairo', 'Tahoma', Arial, sans-serif";
  const BLUE = "#1E3A8A";
  const BLUE_LIGHT = "#EFF6FF";
  const BORDER = "#CBD5E1";

  return (
    <div
      style={{
        width: 794,
        background: "#fff",
        fontFamily: FONT,
        direction: "rtl",
        fontSize: 13,
        color: "#0F172A",
        padding: 0,
      }}
    >
      {/* ── Header ── */}
      <div style={{ background: `linear-gradient(135deg, ${BLUE}, #2563EB)`, padding: "32px 40px 28px", marginBottom: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 52, height: 52, background: "rgba(255,255,255,0.18)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: 900, fontSize: 22, fontFamily: FONT }}>سِ</span>
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 900, fontSize: 26, lineHeight: 1.2, fontFamily: FONT }}>سِجِل</div>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontFamily: FONT }}>نظم عملياتك في مكان واحد</div>
            </div>
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, marginBottom: 4, fontFamily: FONT }}>تاريخ التقرير</div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, fontFamily: FONT }}>{reportDate}</div>
          </div>
        </div>
        {shopName && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.2)" }}>
            <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontFamily: FONT }}>المحل: </span>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, fontFamily: FONT }}>{shopName}</span>
          </div>
        )}
      </div>

      <div style={{ padding: "28px 40px" }}>
        {/* ── Summary Cards ── */}
        <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
          <div style={{ flex: 1, background: BLUE_LIGHT, borderRadius: 12, padding: "16px 20px", border: `1.5px solid #BFDBFE` }}>
            <div style={{ color: BLUE, fontSize: 11, fontWeight: 600, marginBottom: 6, fontFamily: FONT }}>عدد العمليات</div>
            <div style={{ color: BLUE, fontSize: 28, fontWeight: 900, fontFamily: FONT }}>{ops.length}</div>
            <div style={{ color: "#64748B", fontSize: 11, marginTop: 2, fontFamily: FONT }}>عملية مسجّلة</div>
          </div>
          <div style={{ flex: 1.6, background: "#F0FDF4", borderRadius: 12, padding: "16px 20px", border: `1.5px solid #BBF7D0` }}>
            <div style={{ color: "#065F46", fontSize: 11, fontWeight: 600, marginBottom: 6, fontFamily: FONT }}>إجمالي المبالغ</div>
            <div style={{ color: "#065F46", fontSize: 24, fontWeight: 900, fontFamily: FONT }}>{formatAmount(totalAmount)} <span style={{ fontSize: 14 }}>SDG</span></div>
            <div style={{ color: "#64748B", fontSize: 11, marginTop: 2, fontFamily: FONT }}>جنيه سوداني</div>
          </div>
          <div style={{ flex: 1.4, background: "#FFFBEB", borderRadius: 12, padding: "16px 20px", border: `1.5px solid #FDE68A` }}>
            <div style={{ color: "#92400E", fontSize: 11, fontWeight: 600, marginBottom: 6, fontFamily: FONT }}>الفترة الزمنية</div>
            <div style={{ color: "#92400E", fontSize: 14, fontWeight: 700, lineHeight: 1.5, fontFamily: FONT }}>{periodLabel}</div>
          </div>
        </div>

        {/* ── Table ── */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#374151", marginBottom: 14, fontFamily: FONT, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 4, height: 18, background: BLUE, borderRadius: 2, display: "inline-block" }} />
            سجل العمليات
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: BLUE }}>
                {["رقم العملية", "المبلغ (SDG)", "التاريخ", "الوقت", "رقم الحساب", "نوع الإشعار"].map((h, i) => (
                  <th key={i} style={{
                    padding: "10px 12px",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 11,
                    textAlign: "center",
                    fontFamily: FONT,
                    borderLeft: i < 5 ? "1px solid rgba(255,255,255,0.2)" : "none",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ops.map((op, idx) => {
                const even = idx % 2 === 0;
                const typeColor = op.notificationType === "فوري" ? "#7C3AED" : op.notificationType === "أوكاش" ? "#EA580C" : BLUE;
                return (
                  <tr key={op.id} style={{ background: even ? "#fff" : "#F8FAFC" }}>
                    <td style={{ padding: "9px 12px", textAlign: "center", fontWeight: 800, fontSize: 15, letterSpacing: 2, color: "#0F172A", borderBottom: `1px solid ${BORDER}`, fontFamily: FONT }}>{op.operationNumber}</td>
                    <td style={{ padding: "9px 12px", textAlign: "center", fontWeight: 700, color: "#065F46", borderBottom: `1px solid ${BORDER}`, fontFamily: FONT }}>{formatAmount(op.amount)}</td>
                    <td style={{ padding: "9px 12px", textAlign: "center", color: "#374151", borderBottom: `1px solid ${BORDER}`, fontFamily: FONT }}>{formatDateAr(op.date)}</td>
                    <td style={{ padding: "9px 12px", textAlign: "center", color: "#374151", direction: "ltr", borderBottom: `1px solid ${BORDER}`, fontFamily: FONT }}>{op.time ? formatTimeAr(op.time) : "—"}</td>
                    <td style={{ padding: "9px 12px", textAlign: "center", color: "#64748B", fontSize: 11, direction: "ltr", borderBottom: `1px solid ${BORDER}`, fontFamily: FONT }}>{op.senderAccount || "—"}</td>
                    <td style={{ padding: "9px 12px", textAlign: "center", fontWeight: 700, borderBottom: `1px solid ${BORDER}`, fontFamily: FONT }}>
                      {op.notificationType ? (
                        <span style={{ background: op.notificationType === "فوري" ? "#F5F3FF" : op.notificationType === "أوكاش" ? "#FFF7ED" : BLUE_LIGHT, color: typeColor, padding: "2px 10px", borderRadius: 20, fontSize: 11 }}>
                          {op.notificationType}
                        </span>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {ops.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#94A3B8", fontSize: 13, fontFamily: FONT }}>
              لا توجد عمليات في هذه الفترة
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ marginTop: 32, paddingTop: 16, borderTop: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: "#94A3B8", fontSize: 11, fontFamily: FONT }}>تم إنشاؤه بواسطة تطبيق سِجِل</div>
          <div style={{ color: "#94A3B8", fontSize: 11, fontFamily: FONT }}>{reportDate}</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Modal ─────────────────────────────────────────────── */
export default function ExportModal({ operations, shopName, onClose }: ExportModalProps) {
  const [period, setPeriod] = useState<ExportPeriod>("today");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState(getTodayDate());
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [visible, setVisible] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const today = getTodayDate();
  const yesterday = getYesterdayDate();
  const reportDate = formatDateAr(today);

  const filteredOps = useMemo(
    () => filterOps(operations, period, today, yesterday, fromDate, toDate),
    [operations, period, today, yesterday, fromDate, toDate]
  );
  const totalAmount = useMemo(() => filteredOps.reduce((s, o) => s + o.amount, 0), [filteredOps]);
  const periodLabel = getPeriodLabel(period, today, yesterday, fromDate, toDate);

  const fileName = `sigil-report-${today}`;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const handleExportPdf = async () => {
    if (!reportRef.current) return;
    setStatus("loading");
    try {
      await document.fonts.ready;
      await new Promise(r => setTimeout(r, 300));

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: reportRef.current.scrollWidth,
        height: reportRef.current.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = 210;
      const pageH = 297;
      const imgH = (canvas.height * pageW) / canvas.width;

      let heightLeft = imgH;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, pageW, imgH);
      heightLeft -= pageH;

      while (heightLeft > 0) {
        position -= pageH;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, pageW, imgH);
        heightLeft -= pageH;
      }

      pdf.save(`${fileName}.pdf`);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  const handleExportExcel = () => {
    setStatus("loading");
    try {
      const wb = XLSX.utils.book_new();
      const rows: (string | number)[][] = [];

      rows.push(["تقرير عمليات سِجِل"]);
      rows.push([]);
      rows.push(["اسم المحل:", shopName || "—"]);
      rows.push(["تاريخ التقرير:", reportDate]);
      rows.push(["الفترة:", periodLabel]);
      rows.push(["عدد العمليات:", filteredOps.length]);
      rows.push(["إجمالي المبالغ (SDG):", totalAmount]);
      rows.push([]);
      rows.push(["رقم العملية", "المبلغ (SDG)", "التاريخ", "الوقت", "رقم الحساب", "نوع الإشعار"]);

      for (const op of [...filteredOps].sort((a, b) => b.createdAt - a.createdAt)) {
        rows.push([
          op.operationNumber,
          op.amount,
          formatDateAr(op.date),
          op.time ? formatTimeAr(op.time) : "",
          op.senderAccount || "",
          op.notificationType || "",
        ]);
      }

      const ws = XLSX.utils.aoa_to_sheet(rows);
      (ws as XLSX.WorkSheet & { "!RTL"?: boolean })["!RTL"] = true;
      ws["!cols"] = [
        { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 26 }, { wch: 12 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, "عمليات سِجِل");
      XLSX.writeFile(wb, `${fileName}.xlsx`);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  const PERIODS: { id: ExportPeriod; label: string }[] = [
    { id: "today",     label: "اليوم" },
    { id: "yesterday", label: "أمس" },
    { id: "month",     label: "هذا الشهر" },
    { id: "all",       label: "الكل" },
    { id: "custom",    label: "مخصص" },
  ];

  return (
    <>
      {/* PDF template — off-screen */}
      <div
        style={{ position: "fixed", left: -9999, top: 0, zIndex: -1, pointerEvents: "none" }}
        aria-hidden="true"
      >
        <div ref={reportRef}>
          <PdfReport
            ops={[...filteredOps].sort((a, b) => b.createdAt - a.createdAt)}
            shopName={shopName}
            periodLabel={periodLabel}
            totalAmount={totalAmount}
            reportDate={reportDate}
          />
        </div>
      </div>

      {/* Overlay */}
      <div
        className="fixed inset-0 z-50"
        style={{
          background: "rgba(15,23,42,0.55)",
          backdropFilter: "blur(4px)",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
        onClick={handleClose}
      />

      {/* Bottom Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl"
        style={{
          background: "#fff",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.35s cubic-bezier(0.16,1,0.3,1)",
          maxHeight: "92dvh",
          overflowY: "auto",
        }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 rounded-full" style={{ background: "#E2E8F0" }} />
        </div>

        <div className="px-5 pt-3 pb-2" style={{ direction: "rtl" }}>
          {/* Title */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#EFF6FF" }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1E3A8A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold" style={{ color: "#0F172A", fontFamily: "'Cairo', sans-serif" }}>
                تصدير البيانات
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95"
              style={{ background: "#F1F5F9" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Period Selection */}
          <div className="mb-5">
            <p className="text-sm font-semibold mb-2.5" style={{ color: "#374151", fontFamily: "'Cairo', sans-serif" }}>
              الفترة الزمنية
            </p>
            <div className="grid grid-cols-5 gap-1.5">
              {PERIODS.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setPeriod(p.id); setStatus("idle"); }}
                  className="py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                  style={{
                    background: period === p.id ? "#1E3A8A" : "#F1F5F9",
                    color: period === p.id ? "#fff" : "#64748B",
                    fontFamily: "'Cairo', sans-serif",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {period === "custom" && (
              <div className="mt-3 flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748B", fontFamily: "'Cairo', sans-serif" }}>من</label>
                  <input
                    type="date"
                    value={fromDate}
                    max={toDate || today}
                    onChange={e => { setFromDate(e.target.value); setStatus("idle"); }}
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ border: "2px solid #E2E8F0", background: "#F8FAFC", fontFamily: "'Cairo', sans-serif", direction: "ltr" }}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748B", fontFamily: "'Cairo', sans-serif" }}>إلى</label>
                  <input
                    type="date"
                    value={toDate}
                    min={fromDate}
                    max={today}
                    onChange={e => { setToDate(e.target.value); setStatus("idle"); }}
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ border: "2px solid #E2E8F0", background: "#F8FAFC", fontFamily: "'Cairo', sans-serif", direction: "ltr" }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="rounded-2xl p-4 mb-5 flex gap-4" style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0" }}>
            <div className="flex-1 text-center">
              <div className="text-2xl font-black" style={{ color: "#1E3A8A", fontFamily: "'Cairo', sans-serif" }}>{filteredOps.length}</div>
              <div className="text-xs font-semibold" style={{ color: "#64748B", fontFamily: "'Cairo', sans-serif" }}>عملية</div>
            </div>
            <div className="w-px" style={{ background: "#E2E8F0" }} />
            <div className="flex-1 text-center">
              <div className="text-lg font-black" style={{ color: "#065F46", fontFamily: "'Cairo', sans-serif" }}>
                {formatAmount(totalAmount)}
              </div>
              <div className="text-xs font-semibold" style={{ color: "#64748B", fontFamily: "'Cairo', sans-serif" }}>SDG إجمالي</div>
            </div>
          </div>

          {/* Status messages */}
          {status === "success" && (
            <div className="rounded-xl p-3.5 mb-4 flex items-center gap-3" style={{ background: "#F0FDF4", border: "1.5px solid #BBF7D0" }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#10B981" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <p className="text-sm font-bold" style={{ color: "#065F46", fontFamily: "'Cairo', sans-serif" }}>
                تم إنشاء التقرير بنجاح — جارٍ التنزيل...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="rounded-xl p-3.5 mb-4 flex items-center gap-3" style={{ background: "#FEF2F2", border: "1.5px solid #FECACA" }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#EF4444" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </div>
              <p className="text-sm font-bold" style={{ color: "#991B1B", fontFamily: "'Cairo', sans-serif" }}>
                حدث خطأ أثناء التصدير — حاول مرة أخرى
              </p>
            </div>
          )}

          {/* Export Buttons */}
          <div className="flex flex-col gap-3" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
            <button
              onClick={handleExportPdf}
              disabled={status === "loading"}
              className="w-full py-4 rounded-2xl text-base font-bold text-white flex items-center justify-center gap-2.5 transition-all active:scale-95"
              style={{
                background: status === "loading" ? "#94A3B8" : "linear-gradient(135deg, #1E3A8A, #2563EB)",
                boxShadow: status === "loading" ? "none" : "0 4px 16px rgba(30,58,138,0.35)",
                fontFamily: "'Cairo', sans-serif",
              }}
            >
              {status === "loading" ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent" style={{ animation: "spin 0.8s linear infinite" }} />
                  جارٍ الإنشاء...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  تصدير PDF
                </>
              )}
            </button>

            <button
              onClick={handleExportExcel}
              disabled={status === "loading"}
              className="w-full py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2.5 transition-all active:scale-95"
              style={{
                background: "#F0FDF4",
                color: "#065F46",
                border: "2px solid #BBF7D0",
                fontFamily: "'Cairo', sans-serif",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18M3 15h18M9 3v18"/>
              </svg>
              تصدير Excel
            </button>

            <button
              onClick={handleClose}
              className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-95"
              style={{ background: "#F1F5F9", color: "#64748B", fontFamily: "'Cairo', sans-serif" }}
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
