import { Router, type IRouter } from "express";
import { GoogleGenAI } from "@google/genai";

const router: IRouter = Router();

interface OcrResult {
  transactionLast4: string | null;
  amount: string | null;
  accountNumber: string | null;
  notificationType: string | null;
}

const TYPE_MAP: Record<string, string> = {
  "بنكك": "bankak",
  "فوري": "fawry",
  "أوكاش": "okash",
};

function buildPrompt(notificationType: string): string {
  const typeKey = TYPE_MAP[notificationType] ?? "bankak";
  return `أنت خبير في قراءة إشعارات التحويلات المالية السودانية (بنكك، فوري، أوكاش).
حلّل صورة الإشعار المرفقة بدقة عالية واستخرج البيانات التالية فقط:

1. "amount": مبلغ العملية كرقم فقط بدون فواصل أو عملة. مثال: "تم تحويل 5,000 جنيه" ← "5000".
2. "accountNumber": رقم الحساب الذي يلي عبارة "من حساب" أو ما يعادلها. استخرج الأرقام فقط. مثال: "من حساب 123456789" ← "123456789".
3. "transactionLast4": آخر 4 أرقام فقط من رقم العملية أو الرقم المرجعي في الإشعار. مثال: "رقم العملية: 123456789" ← "6789".

نوع الإشعار المحدد من المستخدم هو: ${typeKey}.

قواعد صارمة:
- تجاهل أي نص آخر غير مطلوب.
- إذا لم تجد قيمة، ضع null.
- transactionLast4 يجب أن يكون 4 أرقام كحد أقصى (آخر 4 أرقام).
- accountNumber و amount أرقام فقط بدون رموز.

أعد فقط كائن JSON صالح بهذا الشكل بالضبط دون أي شرح أو نص إضافي:
{"transactionLast4":"6789","amount":"5000","accountNumber":"123456789","notificationType":"${typeKey}"}`;
}

function extractJson(text: string): OcrResult | null {
  try {
    const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;

    const toStr = (v: unknown): string | null => {
      if (v === null || v === undefined) return null;
      const s = String(v).trim();
      return s === "" || s.toLowerCase() === "null" ? null : s;
    };

    let last4 = toStr(parsed.transactionLast4);
    if (last4) last4 = last4.replace(/\D/g, "").slice(-4) || null;

    let amount = toStr(parsed.amount);
    if (amount) amount = amount.replace(/[^\d.]/g, "") || null;

    let account = toStr(parsed.accountNumber);
    if (account) account = account.replace(/[^\d]/g, "") || null;

    return {
      transactionLast4: last4,
      amount,
      accountNumber: account,
      notificationType: toStr(parsed.notificationType),
    };
  } catch {
    return null;
  }
}

router.post("/ocr", async (req, res) => {
  const { imageBase64, mimeType, notificationType } = req.body as {
    imageBase64?: string;
    mimeType?: string;
    notificationType?: string;
  };

  if (!imageBase64 || typeof imageBase64 !== "string") {
    res.status(400).json({ error: "imageBase64 is required" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    req.log.error("GEMINI_API_KEY is not set");
    res.status(500).json({ error: "OCR service is not configured" });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: buildPrompt(notificationType ?? "بنكك") },
            { inlineData: { mimeType: mimeType ?? "image/jpeg", data: imageBase64 } },
          ],
        },
      ],
    });

    const text = response.text ?? "";
    const result = extractJson(text);

    if (!result) {
      req.log.warn({ responseLength: text.length }, "Failed to parse Gemini OCR response");
      res.json({ transactionLast4: null, amount: null, accountNumber: null, notificationType: null });
      return;
    }

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Gemini OCR request failed");
    res.status(502).json({ error: "OCR analysis failed" });
  }
});

export default router;
