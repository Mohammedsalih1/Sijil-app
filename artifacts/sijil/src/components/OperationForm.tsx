import { useState, useEffect } from "react";
import { Operation } from "../types";

interface OperationFormProps {
  editOperation?: Operation | null;
  onSave: (operationNumber: string, amount: number) => void;
  onClose: () => void;
}

export default function OperationForm({ editOperation, onSave, onClose }: OperationFormProps) {
  const [operationNumber, setOperationNumber] = useState(editOperation?.operationNumber ?? "");
  const [amount, setAmount] = useState(editOperation ? String(editOperation.amount) : "");
  const [errors, setErrors] = useState<{ operationNumber?: string; amount?: string }>({});
  const [visible, setVisible] = useState(false);

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
    onSave(operationNumber.trim(), parseFloat(amount));
    handleClose();
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
          maxHeight: "90dvh",
          overflowY: "auto",
        }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 rounded-full" style={{ background: "#E2E8F0" }} />
        </div>

        <div className="px-6 pb-2 pt-3">
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-xl font-bold"
              style={{ color: "#0F172A", fontFamily: "'Cairo', sans-serif" }}
            >
              {editOperation ? "تعديل العملية" : "إضافة عملية جديدة"}
            </h2>
            <button
              onClick={handleClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95"
              style={{ background: "#F1F5F9" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "#374151", fontFamily: "'Cairo', sans-serif" }}
              >
                رقم العملية
                <span style={{ color: "#EF4444" }}> *</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={operationNumber}
                onChange={(e) => {
                  const onlyDigits = e.target.value.replace(/\D/g, "");
                  setOperationNumber(onlyDigits);
                  setErrors((prev) => ({ ...prev, operationNumber: undefined }));
                }}
                placeholder="مثال: 123456789"
                className="w-full rounded-xl px-4 py-3.5 text-base outline-none transition-all"
                style={{
                  fontFamily: "'Cairo', sans-serif",
                  border: errors.operationNumber ? "2px solid #EF4444" : "2px solid #E2E8F0",
                  background: "#F8FAFC",
                  color: "#0F172A",
                  direction: "ltr",
                  textAlign: "right",
                }}
                onFocus={(e) => {
                  if (!errors.operationNumber) e.target.style.border = "2px solid #3B82F6";
                }}
                onBlur={(e) => {
                  if (!errors.operationNumber) e.target.style.border = "2px solid #E2E8F0";
                }}
                autoFocus
              />
              {errors.operationNumber && (
                <p className="mt-1.5 text-sm" style={{ color: "#EF4444", fontFamily: "'Cairo', sans-serif" }}>
                  {errors.operationNumber}
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "#374151", fontFamily: "'Cairo', sans-serif" }}
              >
                المبلغ (جنيه سوداني)
                <span style={{ color: "#EF4444" }}> *</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setErrors((prev) => ({ ...prev, amount: undefined }));
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  placeholder="0.00"
                  className="w-full rounded-xl px-4 py-3.5 text-base outline-none transition-all"
                  style={{
                    fontFamily: "'Cairo', sans-serif",
                    border: errors.amount ? "2px solid #EF4444" : "2px solid #E2E8F0",
                    background: "#F8FAFC",
                    color: "#0F172A",
                    direction: "ltr",
                    textAlign: "right",
                  }}
                  onFocus={(e) => {
                    if (!errors.amount) e.target.style.border = "2px solid #3B82F6";
                  }}
                  onBlur={(e) => {
                    if (!errors.amount) e.target.style.border = "2px solid #E2E8F0";
                  }}
                  min="0"
                  step="0.01"
                />
                <span
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold"
                  style={{ color: "#64748B", fontFamily: "'Cairo', sans-serif" }}
                >
                  SDG
                </span>
              </div>
              {errors.amount && (
                <p className="mt-1.5 text-sm" style={{ color: "#EF4444", fontFamily: "'Cairo', sans-serif" }}>
                  {errors.amount}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-7 pb-safe" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
            <button
              onClick={handleClose}
              className="flex-1 py-4 rounded-xl text-base font-bold transition-all active:scale-95"
              style={{
                background: "#F1F5F9",
                color: "#64748B",
                fontFamily: "'Cairo', sans-serif",
              }}
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-4 rounded-xl text-base font-bold text-white transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg, #1E3A8A, #2563EB)",
                fontFamily: "'Cairo', sans-serif",
                boxShadow: "0 4px 14px rgba(30,58,138,0.3)",
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
