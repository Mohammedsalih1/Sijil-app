import { useState, useEffect, useRef } from "react";
import { Operation, NotificationType } from "../types";
import { extractBankakData, extractFauriData, extractOkashData } from "../utils/ocrExtractor";

interface OperationFormProps {
  editOperation?: Operation | null;
  onSave: (
    operationNumber: string,
    amount: number,
    extras?: { senderAccount?: string; notificationType?: NotificationType }
  ) => void;
  onClose: () => void;
}

type OcrPhase = "idle" | "loading" | "done";

const NOTIFICATION_TYPES: NotificationType[] = ["بنكك", "فوري", "أوكاش"];

const TYPE_COLORS: Record<NotificationType, { bg: string; text: string; border: string }> = {
  "بنكك":   { bg: "#EFF6FF", text: "#1E3A8A", border: "#BFDBFE" },
  "فوري":   { bg: "#F5F3FF", text: "#5B21B6", border: "#DDD6FE" },
  "أوكاش":  { bg: "#FFF7ED", text: "#9A3412", border: "#FED7AA" },
};

function InputField({
  label, required, value, onChange, placeholder, inputMode, ltr, hint,
}: {
  label: string; required?: boolean; value: string;
  onChange: (v: string) => void; placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  ltr?: boolean; hint?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label className="block text-sm font-semibold mb-2" style={{ color: "#374151", fontFamily: "'Cairo', sans-serif" }}>
        {label}{required && <span style={{ color: "#EF4444" }}> *</span>}
      </label>
      <input
        type="text"
        inputMode={inputMode ?? "text"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl px-4 py-3.5 text-base outline-none transition-all"
        style={{
          fontFamily: "'Cairo', sans-serif",
          border: focused ? "2px solid #3B82F6" : "2px solid #E2E8F0",
          background: "#F8FAFC",
          color: "#0F172A",
          direction: ltr ? "ltr" : "rtl",
          textAlign: ltr ? "left" : "right",
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {hint && <p className="mt-1 text-xs" style={{ color: "#94A3B8", fontFamily: "'Cairo', sans-serif" }}>{hint}</p>}
    </div>
  );
}

export default function OperationForm({ editOperation, onSave, onClose }: OperationFormProps) {
  const [operationNumber, setOperationNumber] = useState(editOperation?.operationNumber ?? "");
  const [amount, setAmount] = useState(editOperation ? String(editOperation.amount) : "");
  const [senderAccount, setSenderAccount] = useState(editOperation?.senderAccount ?? "");
  const [notificationType, setNotificationType] = useState<NotificationType>(
    editOperation?.notificationType ?? "بنكك"
  );
  const [errors, setErrors] = useState<{ operationNumber?: string; amount?: string }>({});
  const [ocrPhase, setOcrPhase] = useState<OcrPhase>("idle");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState("");
  const [visible, setVisible] = useState(false);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const isNew = !editOperation;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const validate = () => {
    const newErrors: { operationNumber?: string; amount?: string } = {};
    if (!operationNumber.trim()) newErrors.operationNumber = "رقم العملية مطلوب";
    const num = parseFloat(amount);
    if (!amount.trim() || isNaN(num) || num <= 0) newErrors.amount = "أدخل مبلغاً صحيحاً";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(
      operationNumber.trim(),
      parseFloat(amount),
      {
        senderAccount: senderAccount.trim() || undefined,
        notificationType: isNew ? notificationType : editOperation?.notificationType,
      }
    );
    handleClose();
  };

  const processImage = async (file: File) => {
    setOcrPhase("loading");
    setOcrProgress(0);
    setOcrStatus("جاري تجهيز الصورة...");

    try {
      const { createWorker } = await import("tesseract.js");

      setOcrStatus("جاري تحميل محرك القراءة...");

      const worker = await createWorker("ara+eng", 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "loading tesseract core") {
            setOcrStatus("جاري تحميل محرك القراءة...");
            setOcrProgress(Math.round(m.progress * 20));
          } else if (m.status === "loading language traineddata") {
            setOcrStatus("جاري تحميل بيانات اللغة...");
            setOcrProgress(20 + Math.round(m.progress * 40));
          } else if (m.status === "initializing api") {
            setOcrStatus("جاري تهيئة محرك القراءة...");
            setOcrProgress(60 + Math.round(m.progress * 10));
          } else if (m.status === "recognizing text") {
            setOcrStatus("جاري قراءة الإشعار...");
            setOcrProgress(70 + Math.round(m.progress * 30));
          }
        },
      });

      const { data } = await worker.recognize(file);
      await worker.terminate();

      const text = data.text;

      let extracted;
      if (notificationType === "بنكك") {
        extracted = extractBankakData(text);
      } else if (notificationType === "فوري") {
        extracted = extractFauriData(text);
      } else {
        extracted = extractOkashData(text);
      }

      if (extracted.operationNumber) setOperationNumber(extracted.operationNumber);
      if (extracted.amount !== undefined) setAmount(String(extracted.amount));
      if (extracted.senderAccount) setSenderAccount(extracted.senderAccount);

      setOcrProgress(100);
      setOcrPhase("done");
    } catch {
      setOcrPhase("idle");
      setOcrStatus("");
      setOcrProgress(0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    void processImage(file);
  };

  const typeColor = TYPE_COLORS[notificationType];

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

        <div className="px-5 pt-3" style={{ direction: "rtl" }}>
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
            <div
              className="rounded-2xl p-4 mb-5"
              style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#EFF6FF" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1E3A8A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <p className="text-sm font-bold" style={{ color: "#0F172A", fontFamily: "'Cairo', sans-serif" }}>
                  استخراج من صورة إشعار
                </p>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#E2E8F0", color: "#64748B", fontFamily: "'Cairo', sans-serif" }}>
                  اختياري
                </span>
              </div>

              <p className="text-xs mb-3" style={{ color: "#64748B", fontFamily: "'Cairo', sans-serif" }}>
                نوع الإشعار
              </p>
              <div className="flex gap-2 mb-4">
                {NOTIFICATION_TYPES.map(t => (
                  <button
                    key={t}
                    onClick={() => setNotificationType(t)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
                    style={{
                      background: notificationType === t ? typeColor.bg : "#fff",
                      color: notificationType === t ? typeColor.text : "#94A3B8",
                      border: notificationType === t ? `2px solid ${typeColor.border}` : "2px solid #E2E8F0",
                      fontFamily: "'Cairo', sans-serif",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {ocrPhase === "loading" ? (
                <div className="rounded-xl p-4 flex flex-col items-center gap-3" style={{ background: "#EFF6FF", border: "1.5px solid #BFDBFE" }}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                      style={{ borderColor: "#3B82F6", borderTopColor: "transparent" }}
                    />
                    <p className="text-sm font-semibold" style={{ color: "#1E3A8A", fontFamily: "'Cairo', sans-serif" }}>
                      {ocrStatus || "جاري قراءة الإشعار..."}
                    </p>
                  </div>
                  <div className="w-full rounded-full overflow-hidden" style={{ background: "#DBEAFE", height: 6 }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${ocrProgress}%`,
                        background: "linear-gradient(90deg, #1E3A8A, #3B82F6)",
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                  <p className="text-xs" style={{ color: "#3B82F6", fontFamily: "'Cairo', sans-serif" }}>
                    {ocrProgress}%
                  </p>
                </div>
              ) : ocrPhase === "done" ? (
                <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: "#F0FDF4", border: "1.5px solid #BBF7D0" }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#10B981" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold" style={{ color: "#065F46", fontFamily: "'Cairo', sans-serif" }}>
                      تمت قراءة الإشعار
                    </p>
                    <p className="text-xs" style={{ color: "#10B981", fontFamily: "'Cairo', sans-serif" }}>
                      راجع البيانات أدناه وعدّلها إن لزم
                    </p>
                  </div>
                  <button
                    onClick={() => { setOcrPhase("idle"); setOcrProgress(0); }}
                    className="text-xs px-2 py-1 rounded-lg transition-all active:scale-95"
                    style={{ background: "#D1FAE5", color: "#065F46", fontFamily: "'Cairo', sans-serif" }}
                  >
                    إعادة
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => cameraRef.current?.click()}
                    className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                    style={{
                      background: "linear-gradient(135deg, #1E3A8A, #2563EB)",
                      color: "#fff",
                      fontFamily: "'Cairo', sans-serif",
                      boxShadow: "0 2px 8px rgba(30,58,138,0.25)",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    تصوير إشعار
                  </button>
                  <button
                    onClick={() => galleryRef.current?.click()}
                    className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                    style={{
                      background: "#F1F5F9",
                      color: "#374151",
                      fontFamily: "'Cairo', sans-serif",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    من الهاتف
                  </button>
                </div>
              )}

              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
              <input
                ref={galleryRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "#374151", fontFamily: "'Cairo', sans-serif" }}>
                رقم العملية<span style={{ color: "#EF4444" }}> *</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={operationNumber}
                onChange={e => {
                  setOperationNumber(e.target.value.replace(/\D/g, ""));
                  setErrors(prev => ({ ...prev, operationNumber: undefined }));
                }}
                placeholder="آخر 4 أرقام من رقم العملية"
                maxLength={4}
                className="w-full rounded-xl px-4 py-3.5 text-base outline-none transition-all"
                style={{
                  fontFamily: "'Cairo', sans-serif",
                  border: errors.operationNumber ? "2px solid #EF4444" : "2px solid #E2E8F0",
                  background: ocrPhase === "done" && operationNumber ? "#F0FDF4" : "#F8FAFC",
                  color: "#0F172A",
                  direction: "ltr",
                  textAlign: "right",
                  letterSpacing: "0.12em",
                  fontWeight: 700,
                  fontSize: "1.15rem",
                }}
                onFocus={e => { if (!errors.operationNumber) e.target.style.border = "2px solid #3B82F6"; }}
                onBlur={e => { if (!errors.operationNumber) e.target.style.border = "2px solid #E2E8F0"; }}
                autoFocus={!isNew}
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
                  className="w-full rounded-xl px-4 py-3.5 text-base outline-none transition-all"
                  style={{
                    fontFamily: "'Cairo', sans-serif",
                    border: errors.amount ? "2px solid #EF4444" : "2px solid #E2E8F0",
                    background: ocrPhase === "done" && amount ? "#F0FDF4" : "#F8FAFC",
                    color: "#0F172A",
                    direction: "ltr",
                    textAlign: "right",
                  }}
                  onFocus={e => { if (!errors.amount) e.target.style.border = "2px solid #3B82F6"; }}
                  onBlur={e => { if (!errors.amount) e.target.style.border = "2px solid #E2E8F0"; }}
                  min="0"
                  step="0.01"
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

            <InputField
              label="رقم حساب المرسل"
              value={senderAccount}
              onChange={setSenderAccount}
              placeholder="مثال: 1003 0761 7203 0001"
              ltr
              hint="اختياري — يُستخرج تلقائياً من صورة الإشعار"
            />
          </div>

          <div className="flex gap-3 mt-6 pb-safe" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
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
    </>
  );
}
