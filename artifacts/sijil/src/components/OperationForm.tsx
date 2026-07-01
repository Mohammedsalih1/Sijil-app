import { useState, useEffect, useRef } from "react";
import { Operation, NotificationType } from "../types";

interface OperationFormProps {
  editOperation?: Operation | null;
  onSave: (
    operationNumber: string,
    amount: number,
    extras?: {
      senderAccount?: string;
      notificationType?: NotificationType;
      date?: string;
      time?: string;
    }
  ) => void;
  onClose: () => void;
}

type OcrPhase = "idle" | "loading" | "done" | "error";

const NOTIFICATION_TYPES: NotificationType[] = ["بنكك", "فوري", "أوكاش"];

const TYPE_COLORS: Record<NotificationType, { bg: string; text: string; border: string; active: string }> = {
  "بنكك":   { bg: "#EFF6FF", text: "#1E3A8A", border: "#BFDBFE", active: "#1E3A8A" },
  "فوري":   { bg: "#F5F3FF", text: "#5B21B6", border: "#DDD6FE", active: "#7C3AED" },
  "أوكاش":  { bg: "#FFF7ED", text: "#9A3412", border: "#FED7AA", active: "#EA580C" },
};

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface FieldProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  ltr?: boolean;
  hint?: string;
  error?: string;
  highlight?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  type?: string;
  onEnter?: () => void;
}

function Field({ label, required, value, onChange, placeholder, inputMode, ltr, hint, error, highlight, autoFocus, maxLength, type = "text", onEnter }: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label className="block text-sm font-semibold mb-2" style={{ color: "#374151", fontFamily: "'Cairo', sans-serif" }}>
        {label}{required && <span style={{ color: "#EF4444" }}> *</span>}
      </label>
      <input
        type={type}
        inputMode={inputMode ?? "text"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        maxLength={maxLength}
        onKeyDown={e => e.key === "Enter" && onEnter?.()}
        className="w-full rounded-xl px-4 py-3.5 text-base outline-none transition-all"
        style={{
          fontFamily: "'Cairo', sans-serif",
          border: error ? "2px solid #EF4444" : focused ? "2px solid #3B82F6" : "2px solid #E2E8F0",
          background: highlight ? "#F0FDF4" : error ? "#FEF2F2" : "#F8FAFC",
          color: "#0F172A",
          direction: ltr ? "ltr" : "rtl",
          textAlign: ltr ? "left" : "right",
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {error && <p className="mt-1 text-sm" style={{ color: "#EF4444", fontFamily: "'Cairo', sans-serif" }}>{error}</p>}
      {!error && hint && <p className="mt-1 text-xs" style={{ color: "#94A3B8", fontFamily: "'Cairo', sans-serif" }}>{hint}</p>}
    </div>
  );
}

export default function OperationForm({ editOperation, onSave, onClose }: OperationFormProps) {
  const [operationNumber, setOperationNumber] = useState(editOperation?.operationNumber ?? "");
  const [amount, setAmount] = useState(editOperation ? String(editOperation.amount) : "");
  const [senderAccount, setSenderAccount] = useState(editOperation?.senderAccount ?? "");
  const [opDate, setOpDate] = useState(editOperation?.date ?? "");
  const [opTime, setOpTime] = useState(editOperation?.time ?? "");
  const [notificationType, setNotificationType] = useState<NotificationType>(
    editOperation?.notificationType ?? "بنكك"
  );
  const [errors, setErrors] = useState<{ operationNumber?: string; amount?: string }>({});
  const [ocrPhase, setOcrPhase] = useState<OcrPhase>("idle");
  const [ocrFilledFields, setOcrFilledFields] = useState(false);
  const [visible, setVisible] = useState(false);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const isNew = !editOperation;
  const typeColor = TYPE_COLORS[notificationType];

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const validate = () => {
    const errs: { operationNumber?: string; amount?: string } = {};
    if (!operationNumber.trim()) errs.operationNumber = "رقم العملية مطلوب";
    const n = parseFloat(amount);
    if (!amount.trim() || isNaN(n) || n <= 0) errs.amount = "أدخل مبلغاً صحيحاً";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(operationNumber.trim(), parseFloat(amount), {
      senderAccount: senderAccount.trim() || undefined,
      notificationType: isNew ? notificationType : editOperation?.notificationType,
      date: opDate.trim() || undefined,
      time: opTime.trim() || undefined,
    });
    handleClose();
  };

  const runOcr = async (file: File) => {
    setOcrPhase("loading");
    setOcrFilledFields(false);

    try {
      const base64 = await toBase64(file);
      const mimeType = file.type || "image/jpeg";

      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
          notificationType,
        }),
      });

      if (!res.ok) {
        setOcrPhase("error");
        return;
      }

      const data = await res.json() as {
        transactionNumber: string | null;
        amount: string | null;
        senderAccount: string | null;
        date: string | null;
        time: string | null;
      };

      let filled = false;
      if (data.transactionNumber) { setOperationNumber(data.transactionNumber); filled = true; }
      if (data.amount) { setAmount(data.amount); filled = true; }
      if (data.senderAccount) { setSenderAccount(data.senderAccount); filled = true; }
      if (data.date) { setOpDate(data.date); filled = true; }
      if (data.time) { setOpTime(data.time); filled = true; }

      setOcrFilledFields(filled);
      setOcrPhase("done");
    } catch {
      setOcrPhase("error");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    void runOcr(file);
  };

  const resetOcr = () => {
    setOcrPhase("idle");
    setOcrFilledFields(false);
  };

  return (
    <>
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
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold" style={{ color: "#0F172A", fontFamily: "'Cairo', sans-serif" }}>
              {editOperation ? "تعديل العملية" : "إضافة عملية جديدة"}
            </h2>
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

          {isNew && (
            <div className="mb-5 rounded-2xl overflow-hidden" style={{ border: "1.5px solid #E2E8F0" }}>
              <div className="px-4 py-3 flex items-center gap-2" style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1E3A8A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                <p className="text-sm font-bold flex-1" style={{ color: "#0F172A", fontFamily: "'Cairo', sans-serif" }}>
                  استخراج من صورة إشعار
                </p>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#DBEAFE", color: "#1E3A8A", fontFamily: "'Cairo', sans-serif" }}>
                  Gemini AI
                </span>
              </div>

              <div className="p-4">
                <p className="text-xs font-semibold mb-2.5" style={{ color: "#64748B", fontFamily: "'Cairo', sans-serif" }}>
                  اختر نوع الإشعار أولاً
                </p>
                <div className="flex gap-2 mb-4">
                  {NOTIFICATION_TYPES.map(t => (
                    <button
                      key={t}
                      onClick={() => { setNotificationType(t); resetOcr(); }}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
                      style={{
                        background: notificationType === t ? typeColor.bg : "#F8FAFC",
                        color: notificationType === t ? typeColor.text : "#94A3B8",
                        border: notificationType === t ? `2px solid ${typeColor.border}` : "2px solid #E2E8F0",
                        fontFamily: "'Cairo', sans-serif",
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {ocrPhase === "loading" && (
                  <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "#EFF6FF", border: "1.5px solid #BFDBFE" }}>
                    <div
                      className="w-5 h-5 rounded-full border-2 flex-shrink-0"
                      style={{
                        borderColor: "#3B82F6",
                        borderTopColor: "transparent",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                    <div>
                      <p className="text-sm font-bold" style={{ color: "#1E3A8A", fontFamily: "'Cairo', sans-serif" }}>
                        جاري تحليل الإشعار...
                      </p>
                      <p className="text-xs" style={{ color: "#3B82F6", fontFamily: "'Cairo', sans-serif" }}>
                        يقوم Gemini AI بقراءة البيانات
                      </p>
                    </div>
                  </div>
                )}

                {ocrPhase === "done" && (
                  <div className="rounded-xl p-3.5 flex items-center gap-3" style={{
                    background: ocrFilledFields ? "#F0FDF4" : "#FFFBEB",
                    border: `1.5px solid ${ocrFilledFields ? "#BBF7D0" : "#FDE68A"}`,
                  }}>
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: ocrFilledFields ? "#10B981" : "#F59E0B" }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                        {ocrFilledFields
                          ? <polyline points="20 6 9 17 4 12"/>
                          : <><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
                        }
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold" style={{ color: ocrFilledFields ? "#065F46" : "#92400E", fontFamily: "'Cairo', sans-serif" }}>
                        {ocrFilledFields ? "تمت قراءة الإشعار بنجاح" : "لم يتم استخراج البيانات"}
                      </p>
                      <p className="text-xs" style={{ color: ocrFilledFields ? "#10B981" : "#B45309", fontFamily: "'Cairo', sans-serif" }}>
                        {ocrFilledFields ? "راجع الحقول أدناه وعدّلها إن لزم" : "أدخل البيانات يدوياً أو حاول صورة أوضح"}
                      </p>
                    </div>
                    <button
                      onClick={resetOcr}
                      className="text-xs px-2.5 py-1.5 rounded-lg flex-shrink-0 transition-all active:scale-95"
                      style={{ background: ocrFilledFields ? "#D1FAE5" : "#FEF3C7", color: ocrFilledFields ? "#065F46" : "#92400E", fontFamily: "'Cairo', sans-serif" }}
                    >
                      إعادة
                    </button>
                  </div>
                )}

                {ocrPhase === "error" && (
                  <div className="rounded-xl p-3.5 flex items-center gap-3" style={{ background: "#FEF2F2", border: "1.5px solid #FECACA" }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#EF4444" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold" style={{ color: "#991B1B", fontFamily: "'Cairo', sans-serif" }}>تعذّر استخراج البيانات من الإشعار</p>
                      <p className="text-xs" style={{ color: "#EF4444", fontFamily: "'Cairo', sans-serif" }}>يمكنك إدخال البيانات يدوياً</p>
                    </div>
                    <button onClick={resetOcr} className="text-xs px-2.5 py-1.5 rounded-lg flex-shrink-0" style={{ background: "#FEE2E2", color: "#991B1B", fontFamily: "'Cairo', sans-serif" }}>
                      إعادة
                    </button>
                  </div>
                )}

                {ocrPhase === "idle" && (
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => cameraRef.current?.click()}
                      className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                      style={{
                        background: `linear-gradient(135deg, ${typeColor.active}, ${typeColor.active}cc)`,
                        color: "#fff",
                        fontFamily: "'Cairo', sans-serif",
                        boxShadow: `0 2px 10px ${typeColor.active}40`,
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                      </svg>
                      تصوير إشعار
                    </button>
                    <button
                      onClick={() => galleryRef.current?.click()}
                      className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                      style={{ background: "#F1F5F9", color: "#374151", fontFamily: "'Cairo', sans-serif" }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                      من الهاتف
                    </button>
                  </div>
                )}

                <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "#374151", fontFamily: "'Cairo', sans-serif" }}>
                رقم العملية (آخر 4 أرقام)<span style={{ color: "#EF4444" }}> *</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={operationNumber}
                onChange={e => {
                  setOperationNumber(e.target.value.replace(/\D/g, "").slice(0, 4));
                  setErrors(prev => ({ ...prev, operationNumber: undefined }));
                }}
                placeholder="مثال: 4908"
                maxLength={4}
                autoFocus={!isNew}
                className="w-full rounded-xl px-4 py-3.5 outline-none transition-all"
                style={{
                  fontFamily: "'Cairo', sans-serif",
                  fontSize: "1.3rem",
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  border: errors.operationNumber ? "2px solid #EF4444" : "2px solid #E2E8F0",
                  background: ocrFilledFields && operationNumber ? "#F0FDF4" : errors.operationNumber ? "#FEF2F2" : "#F8FAFC",
                  color: "#0F172A",
                  direction: "ltr",
                  textAlign: "center",
                }}
                onFocus={e => { if (!errors.operationNumber) e.target.style.border = "2px solid #3B82F6"; }}
                onBlur={e => { if (!errors.operationNumber) e.target.style.border = "2px solid #E2E8F0"; }}
              />
              {errors.operationNumber && (
                <p className="mt-1.5 text-sm" style={{ color: "#EF4444", fontFamily: "'Cairo', sans-serif" }}>
                  {errors.operationNumber}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "#374151", fontFamily: "'Cairo', sans-serif" }}>
                المبلغ (جنيه سوداني)<span style={{ color: "#EF4444" }}> *</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={e => {
                    setAmount(e.target.value);
                    setErrors(prev => ({ ...prev, amount: undefined }));
                  }}
                  onKeyDown={e => e.key === "Enter" && handleSave()}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full rounded-xl px-4 py-3.5 text-base outline-none transition-all"
                  style={{
                    fontFamily: "'Cairo', sans-serif",
                    border: errors.amount ? "2px solid #EF4444" : "2px solid #E2E8F0",
                    background: ocrFilledFields && amount ? "#F0FDF4" : errors.amount ? "#FEF2F2" : "#F8FAFC",
                    color: "#0F172A",
                    direction: "ltr",
                    textAlign: "right",
                  }}
                  onFocus={e => { if (!errors.amount) e.target.style.border = "2px solid #3B82F6"; }}
                  onBlur={e => { if (!errors.amount) e.target.style.border = "2px solid #E2E8F0"; }}
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: "#64748B", fontFamily: "'Cairo', sans-serif" }}>
                  SDG
                </span>
              </div>
              {errors.amount && (
                <p className="mt-1.5 text-sm" style={{ color: "#EF4444", fontFamily: "'Cairo', sans-serif" }}>
                  {errors.amount}
                </p>
              )}
            </div>

            <Field
              label="رقم حساب المرسل"
              value={senderAccount}
              onChange={setSenderAccount}
              placeholder="مثال: 1003 0761 7203 0001"
              ltr
              highlight={ocrFilledFields && !!senderAccount}
              hint="يُستخرج تلقائياً من صورة الإشعار — اختياري"
            />

            <div className="flex gap-3">
              <div className="flex-1">
                <Field
                  label="التاريخ"
                  value={opDate}
                  onChange={setOpDate}
                  placeholder="2025-06-15"
                  ltr
                  highlight={ocrFilledFields && !!opDate}
                  hint="صيغة: YYYY-MM-DD"
                />
              </div>
              <div className="flex-1">
                <Field
                  label="الوقت"
                  value={opTime}
                  onChange={setOpTime}
                  placeholder="14:30"
                  ltr
                  highlight={ocrFilledFields && !!opTime}
                  hint="صيغة: HH:MM"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
            <button
              onClick={handleClose}
              className="flex-1 py-4 rounded-xl text-base font-bold transition-all active:scale-95"
              style={{ background: "#F1F5F9", color: "#64748B", fontFamily: "'Cairo', sans-serif" }}
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              disabled={ocrPhase === "loading"}
              className="flex-1 py-4 rounded-xl text-base font-bold text-white transition-all active:scale-95"
              style={{
                background: ocrPhase === "loading" ? "#CBD5E1" : "linear-gradient(135deg, #1E3A8A, #2563EB)",
                fontFamily: "'Cairo', sans-serif",
                boxShadow: ocrPhase === "loading" ? "none" : "0 4px 14px rgba(30,58,138,0.3)",
              }}
            >
              {editOperation ? "حفظ التعديلات" : "إضافة العملية"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
