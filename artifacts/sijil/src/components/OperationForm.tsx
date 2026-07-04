import { useState, useEffect, useRef } from "react";
import { Operation, NotificationType } from "../types";

type OcrStatus = "idle" | "loading" | "done" | "error";

function compressImage(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1280;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not supported"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        resolve({ base64: dataUrl.split(",")[1] ?? "", mimeType: "image/jpeg" });
      };
      img.onerror = () => reject(new Error("Image load failed"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

interface OperationFormProps {
  editOperation?: Operation | null;
  onSave: (
    operationNumber: string,
    amount: number,
    extras?: {
      senderAccount?: string;
      notificationType?: NotificationType;
    }
  ) => void;
  onClose: () => void;
}

const NOTIFICATION_TYPES: NotificationType[] = ["بنكك", "فوري", "أوكاش"];

const TYPE_COLORS: Record<NotificationType, { bg: string; text: string; border: string; active: string }> = {
  "بنكك":  { bg: "#EFF6FF", text: "#1E3A8A", border: "#BFDBFE", active: "#1E3A8A" },
  "فوري":  { bg: "#F5F3FF", text: "#5B21B6", border: "#DDD6FE", active: "#7C3AED" },
  "أوكاش": { bg: "#FFF7ED", text: "#9A3412", border: "#FED7AA", active: "#EA580C" },
};

export default function OperationForm({ editOperation, onSave, onClose }: OperationFormProps) {
  const isNew = !editOperation;
  const [operationNumber, setOperationNumber] = useState(editOperation?.operationNumber ?? "");
  const [amount, setAmount] = useState(editOperation ? String(editOperation.amount) : "");
  const [senderAccount, setSenderAccount] = useState(editOperation?.senderAccount ?? "");
  const [notificationType, setNotificationType] = useState<NotificationType>(
    editOperation?.notificationType ?? "بنكك"
  );
  const [errors, setErrors] = useState<{ operationNumber?: string; amount?: string }>({});
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<"capture" | "form">(isNew ? "capture" : "form");
  const [ocrStatus, setOcrStatus] = useState<OcrStatus>("idle");
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const typeColor = TYPE_COLORS[notificationType];

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setOcrStatus("loading");
    try {
      const { base64, mimeType } = await compressImage(file);
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType, notificationType }),
      });
      if (!res.ok) throw new Error("OCR request failed");
      const data = (await res.json()) as {
        transactionLast4?: string | null;
        amount?: string | null;
        accountNumber?: string | null;
      };
      if (data.transactionLast4) {
        setOperationNumber(String(data.transactionLast4).replace(/\D/g, "").slice(-4));
        setErrors(prev => ({ ...prev, operationNumber: undefined }));
      }
      if (data.amount) {
        setAmount(String(data.amount).replace(/[^\d.]/g, ""));
        setErrors(prev => ({ ...prev, amount: undefined }));
      }
      if (data.accountNumber) setSenderAccount(String(data.accountNumber).replace(/[^\d]/g, ""));
      const found = data.transactionLast4 || data.amount || data.accountNumber;
      if (found) {
        setOcrStatus("done");
        setStep("form");
      } else {
        setOcrStatus("error");
      }
    } catch {
      setOcrStatus("error");
    }
  };

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
    });
    handleClose();
  };

  const typeSelector = (
    <div className="mb-5">
      <p className="text-sm font-semibold mb-2.5" style={{ color: "#374151", fontFamily: "'Cairo', sans-serif" }}>
        نوع الإشعار
      </p>
      <div className="flex gap-2">
        {NOTIFICATION_TYPES.map(t => (
          <button
            key={t}
            onClick={() => setNotificationType(t)}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
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
    </div>
  );

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
            <div className="flex items-center gap-2">
              {isNew && step === "form" && (
                <button
                  onClick={() => setStep("capture")}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95"
                  style={{ background: "#F1F5F9" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              )}
              <h2 className="text-xl font-bold" style={{ color: "#0F172A", fontFamily: "'Cairo', sans-serif" }}>
                {editOperation ? "تعديل العملية" : "إضافة عملية جديدة"}
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

          {isNew && step === "capture" ? (
            <div style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
              {typeSelector}

              <p className="text-sm font-semibold mb-2.5" style={{ color: "#374151", fontFamily: "'Cairo', sans-serif" }}>
                قراءة الإشعار تلقائياً
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={ocrStatus === "loading"}
                  className="w-full py-4 rounded-2xl text-base font-bold text-white transition-all active:scale-95 flex items-center justify-center gap-2.5"
                  style={{
                    background: "linear-gradient(135deg, #1E3A8A, #2563EB)",
                    boxShadow: "0 4px 16px rgba(30,58,138,0.3)",
                    fontFamily: "'Cairo', sans-serif",
                    opacity: ocrStatus === "loading" ? 0.6 : 1,
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                  </svg>
                  تصوير الإشعار
                </button>
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={ocrStatus === "loading"}
                  className="w-full py-4 rounded-2xl text-base font-bold transition-all active:scale-95 flex items-center justify-center gap-2.5"
                  style={{
                    background: "#EFF6FF",
                    color: "#1E3A8A",
                    border: "2px solid #BFDBFE",
                    fontFamily: "'Cairo', sans-serif",
                    opacity: ocrStatus === "loading" ? 0.6 : 1,
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                  </svg>
                  رفع من الهاتف
                </button>
              </div>
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleImage} style={{ display: "none" }} />
              <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleImage} style={{ display: "none" }} />

              {ocrStatus === "loading" && (
                <div className="mt-4 flex items-center gap-2.5 rounded-xl px-4 py-3.5" style={{ background: "#EFF6FF" }}>
                  <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid #BFDBFE", borderTopColor: "#1E3A8A" }} />
                  <span className="text-sm font-semibold" style={{ color: "#1E3A8A", fontFamily: "'Cairo', sans-serif" }}>
                    جاري تحليل الإشعار...
                  </span>
                </div>
              )}
              {ocrStatus === "error" && (
                <div className="mt-4 flex items-center gap-2.5 rounded-xl px-4 py-3.5" style={{ background: "#FEF2F2" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span className="text-sm font-semibold" style={{ color: "#DC2626", fontFamily: "'Cairo', sans-serif" }}>
                    تعذّر قراءة الإشعار، أدخل البيانات يدوياً
                  </span>
                </div>
              )}

              <button
                onClick={() => setStep("form")}
                className="w-full mt-5 py-3 text-sm font-bold transition-all active:scale-95"
                style={{ color: "#64748B", fontFamily: "'Cairo', sans-serif" }}
              >
                أو أدخل البيانات يدوياً
              </button>
            </div>
          ) : (
            <>
              {isNew && typeSelector}

              {isNew && ocrStatus === "done" && (
                <div className="mb-5 flex items-center gap-2.5 rounded-xl px-4 py-3" style={{ background: "#ECFDF5" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  <span className="text-sm font-semibold" style={{ color: "#059669", fontFamily: "'Cairo', sans-serif" }}>
                    تم استخراج البيانات، راجعها ثم احفظ
                  </span>
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
                    className="w-full rounded-xl px-4 py-3.5 outline-none transition-all"
                    style={{
                      fontFamily: "'Cairo', sans-serif",
                      fontSize: "1.3rem",
                      fontWeight: 700,
                      letterSpacing: "0.2em",
                      border: errors.operationNumber ? "2px solid #EF4444" : "2px solid #E2E8F0",
                      background: errors.operationNumber ? "#FEF2F2" : "#F8FAFC",
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
                        background: errors.amount ? "#FEF2F2" : "#F8FAFC",
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

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "#374151", fontFamily: "'Cairo', sans-serif" }}>
                    رقم حساب المرسل
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={senderAccount}
                    onChange={e => setSenderAccount(e.target.value)}
                    placeholder="مثال: 1003 0761 7203 0001"
                    className="w-full rounded-xl px-4 py-3.5 text-base outline-none transition-all"
                    style={{
                      fontFamily: "'Cairo', sans-serif",
                      border: "2px solid #E2E8F0",
                      background: "#F8FAFC",
                      color: "#0F172A",
                      direction: "ltr",
                      textAlign: "left",
                    }}
                    onFocus={e => { e.target.style.border = "2px solid #3B82F6"; }}
                    onBlur={e => { e.target.style.border = "2px solid #E2E8F0"; }}
                  />
                  <p className="mt-1 text-xs" style={{ color: "#94A3B8", fontFamily: "'Cairo', sans-serif" }}>اختياري</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
                <button
                  onClick={handleClose}
                  className="flex-1 py-4 rounded-xl text-base font-bold transition-all active:scale-95"
                  style={{ background: "#F1F5F9", color: "#374151", fontFamily: "'Cairo', sans-serif" }}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSave}
                  className="flex-2 py-4 px-8 rounded-xl text-base font-bold text-white transition-all active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #1E3A8A, #2563EB)",
                    boxShadow: "0 4px 16px rgba(30,58,138,0.35)",
                    fontFamily: "'Cairo', sans-serif",
                    flex: 2,
                  }}
                >
                  {editOperation ? "حفظ التعديلات" : "إضافة العملية"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
