import { Router } from "express";
import { GoogleGenAI } from "@google/genai";

const router = Router();

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });

router.post("/ocr", async (req, res) => {
  const { imageBase64, mimeType, notificationType } = req.body as {
    imageBase64?: string;
    mimeType?: string;
    notificationType?: string;
  };

  if (!imageBase64 || !mimeType || !notificationType) {
    res.status(400).json({ error: "imageBase64, mimeType, notificationType مطلوبة" });
    return;
  }

  const prompt = `أنت متخصص في قراءة إشعارات التحويل المالي السودانية.
قم بتحليل هذه الصورة واستخرج البيانات التالية فقط.
أرجع النتيجة بصيغة JSON فقط دون أي شرح أو markdown.

${notificationType === "بنكك" ? `نوع الإشعار: بنكك
- استخرج رقم العملية (أرجع فقط آخر 4 أرقام)
- استخرج المبلغ (رقم فقط بدون وحدة)
- استخرج رقم الحساب الموجود بعد عبارة "من حساب"
- استخرج التاريخ بصيغة YYYY-MM-DD
- استخرج الوقت بصيغة HH:MM` : notificationType === "فوري" ? `نوع الإشعار: فوري
- استخرج الرقم المرجعي (أرجع فقط آخر 4 أرقام)
- استخرج المبلغ (رقم فقط بدون وحدة)
- استخرج رقم الحساب الموجود بعد عبارة "من الحساب"
- استخرج التاريخ بصيغة YYYY-MM-DD
- استخرج الوقت بصيغة HH:MM` : `نوع الإشعار: أوكاش
- استخرج رقم العملية أو الرقم المرجعي (أرجع فقط آخر 4 أرقام)
- استخرج المبلغ (رقم فقط بدون وحدة)
- استخرج رقم الحساب المرسل منه إن وجد
- استخرج التاريخ بصيغة YYYY-MM-DD
- استخرج الوقت بصيغة HH:MM`}

إذا كانت أي قيمة غير موجودة أرجع null.

أرجع JSON بهذا الشكل فقط:
{"transactionNumber":"","amount":"","senderAccount":"","date":"","time":""}`;

  try {
    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimeType as "image/jpeg" | "image/png" | "image/webp",
                data: imageBase64,
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: { maxOutputTokens: 512 },
    });

    const raw = response.text ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(422).json({ error: "لم يتم استخراج بيانات من الإشعار" });
      return;
    }

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, string | null>;
    res.json({
      transactionNumber: parsed.transactionNumber ?? null,
      amount: parsed.amount ?? null,
      senderAccount: parsed.senderAccount ?? null,
      date: parsed.date ?? null,
      time: parsed.time ?? null,
    });
  } catch (err) {
    req.log.error(err, "OCR Gemini error");
    res.status(500).json({ error: "فشل تحليل الإشعار" });
  }
});

export default router;
