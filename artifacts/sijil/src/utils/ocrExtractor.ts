export interface ExtractedData {
  operationNumber?: string;
  amount?: number;
  senderAccount?: string;
}

function normalizeNumerals(text: string): string {
  return text
    .replace(/[٠]/g, "0").replace(/[١]/g, "1").replace(/[٢]/g, "2")
    .replace(/[٣]/g, "3").replace(/[٤]/g, "4").replace(/[٥]/g, "5")
    .replace(/[٦]/g, "6").replace(/[٧]/g, "7").replace(/[٨]/g, "8")
    .replace(/[٩]/g, "9");
}

function cleanOcrText(text: string): string {
  return normalizeNumerals(text)
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/[|\\]/g, "")
    .trim();
}

function parseAmount(raw: string): number | undefined {
  const cleaned = raw.replace(/,/g, "").replace(/[^\d.]/g, "").replace(/\.{2,}/g, ".");
  const n = parseFloat(cleaned);
  return isNaN(n) || n <= 0 ? undefined : n;
}

function lastFourDigits(digits: string): string {
  const only = digits.replace(/\D/g, "");
  return only.length >= 4 ? only.slice(-4) : only;
}

function extractAccount(raw: string): string {
  return raw.replace(/[^\d\s-]/g, "").trim().replace(/\s+/g, " ").slice(0, 50);
}

function tryPatterns(text: string, patterns: RegExp[]): string | undefined {
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return undefined;
}

function fallbackLargestNumber(text: string): number | undefined {
  const candidates = [...text.matchAll(/\b(\d{3,}(?:[.,]\d+)?)\b/g)]
    .map(m => parseFloat(m[1].replace(/,/g, "")))
    .filter(n => !isNaN(n) && n > 0 && n < 100_000_000);
  if (!candidates.length) return undefined;
  candidates.sort((a, b) => b - a);
  return candidates[0];
}

function fallbackOperationNumber(text: string): string | undefined {
  const lines = text.split("\n");
  for (const line of lines) {
    const m = line.match(/(\d{6,})/);
    if (m) return m[1];
  }
  return undefined;
}

export function extractBankakData(text: string): ExtractedData {
  const t = cleanOcrText(text);
  const result: ExtractedData = {};

  const opRaw = tryPatterns(t, [
    /رقم\s*[اأ]?[لL]?\s*عمل[يى][هةa]?[:\s،,\-]*([\d]{4,})/,
    /رقم\s*العملية[:\s،,\-]*([\d]{4,})/,
    /رقم\s*الع[مم]ل[يى][هة][:\s،,\-]*([\d]{4,})/,
    /عملية\s*رقم[:\s،,\-]*([\d]{4,})/,
    /Transaction\s*(?:No|ID|#)?[:\s\-#]*([\d]{6,})/i,
    /Txn[:\s#\-]*([\d]{6,})/i,
    /(?:Op|Ref)[:\s#\-]*([\d]{6,})/i,
    /رقم\s*[:\s،,\-]*([\d]{6,})/,
  ]);
  if (opRaw) {
    result.operationNumber = lastFourDigits(opRaw);
  } else {
    const fb = fallbackOperationNumber(t);
    if (fb) result.operationNumber = lastFourDigits(fb);
  }

  const amtRaw = tryPatterns(t, [
    /المبلغ[:\s،,\-]*([\d,]+(?:\.\d+)?)/,
    /مبلغ\s*التحويل[:\s،,\-]*([\d,]+(?:\.\d+)?)/,
    /قيمة\s*التحويل[:\s،,\-]*([\d,]+(?:\.\d+)?)/,
    /تم\s*(?:استلام|تحويل)[:\s،,\-]*([\d,]+(?:\.\d+)?)/,
    /استلمت?\s*([\d,]+(?:\.\d+)?)/,
    /SDG\s*([\d,]+(?:\.\d+)?)/,
    /([\d,]+(?:\.\d+)?)\s*SDG/,
    /([\d,]+(?:\.\d+)?)\s*جنيه/,
    /جنيه\s*([\d,]+(?:\.\d+)?)/,
    /[Aa]mount[:\s]*([\d,]+(?:\.\d+)?)/,
  ]);
  if (amtRaw) {
    result.amount = parseAmount(amtRaw);
  } else {
    result.amount = fallbackLargestNumber(t);
  }

  const accRaw = tryPatterns(t, [
    /من\s*حساب[:\s،,\-]*([\d\s\-]{6,})/,
    /من\s*الحساب[:\s،,\-]*([\d\s\-]{6,})/,
    /حساب\s*المرسل[:\s،,\-]*([\d\s\-]{6,})/,
    /المرسل[:\s،,\-]*([\d\s\-]{6,})/,
    /[Ff]rom\s*[Aa]ccount[:\s]*([\d\s\-]{6,})/,
    /[Ff]rom[:\s]*([\d\s\-]{8,})/,
  ]);
  if (accRaw) result.senderAccount = extractAccount(accRaw);

  return result;
}

export function extractFauriData(text: string): ExtractedData {
  const t = cleanOcrText(text);
  const result: ExtractedData = {};

  const refRaw = tryPatterns(t, [
    /[اأ]?[لL]?\s*رقم\s*المرجعي[:\s،,\-]*([\d]{6,})/,
    /الرقم\s*المرجعي[:\s،,\-]*([\d]{6,})/,
    /رقم\s*مرجعي[:\s،,\-]*([\d]{6,})/,
    /[Rr]eference[:\s#\-]*([\d]{6,})/,
    /[Rr]ef[.:\s#\-]*([\d]{6,})/,
    /رقم\s*[اأ]?[لL]?\s*عمل[يى][هةa]?[:\s،,\-]*([\d]{4,})/,
    /رقم\s*العملية[:\s،,\-]*([\d]{4,})/,
    /Transaction\s*(?:No|ID|#)?[:\s\-#]*([\d]{6,})/i,
  ]);
  if (refRaw) {
    result.operationNumber = lastFourDigits(refRaw);
  } else {
    const fb = fallbackOperationNumber(t);
    if (fb) result.operationNumber = lastFourDigits(fb);
  }

  const amtRaw = tryPatterns(t, [
    /المبلغ[:\s،,\-]*([\d,]+(?:\.\d+)?)/,
    /مبلغ\s*التحويل[:\s،,\-]*([\d,]+(?:\.\d+)?)/,
    /قيمة\s*التحويل[:\s،,\-]*([\d,]+(?:\.\d+)?)/,
    /تم\s*(?:استلام|تحويل)[:\s،,\-]*([\d,]+(?:\.\d+)?)/,
    /استلمت?\s*([\d,]+(?:\.\d+)?)/,
    /SDG\s*([\d,]+(?:\.\d+)?)/,
    /([\d,]+(?:\.\d+)?)\s*SDG/,
    /([\d,]+(?:\.\d+)?)\s*جنيه/,
    /جنيه\s*([\d,]+(?:\.\d+)?)/,
    /[Aa]mount[:\s]*([\d,]+(?:\.\d+)?)/,
  ]);
  if (amtRaw) {
    result.amount = parseAmount(amtRaw);
  } else {
    result.amount = fallbackLargestNumber(t);
  }

  const accRaw = tryPatterns(t, [
    /من\s*الحساب[:\s،,\-]*([\d\s\-]{6,})/,
    /من\s*حساب[:\s،,\-]*([\d\s\-]{6,})/,
    /المرسل[:\s،,\-]*([\d\s\-]{6,})/,
    /حساب\s*المرسل[:\s،,\-]*([\d\s\-]{6,})/,
    /[Ff]rom[:\s]*([\d\s\-]{8,})/,
  ]);
  if (accRaw) result.senderAccount = extractAccount(accRaw);

  return result;
}

export function extractOkashData(text: string): ExtractedData {
  const t = cleanOcrText(text);
  const result: ExtractedData = {};

  const opRaw = tryPatterns(t, [
    /رقم\s*[اأ]?[لL]?\s*عمل[يى][هةa]?[:\s،,\-]*([\d]{4,})/,
    /الرقم\s*المرجعي[:\s،,\-]*([\d]{6,})/,
    /رقم\s*مرجعي[:\s،,\-]*([\d]{6,})/,
    /Transaction\s*(?:No|ID|#)?[:\s\-#]*([\d]{6,})/i,
  ]);
  if (opRaw) {
    result.operationNumber = lastFourDigits(opRaw);
  } else {
    const fb = fallbackOperationNumber(t);
    if (fb) result.operationNumber = lastFourDigits(fb);
  }

  const amtRaw = tryPatterns(t, [
    /المبلغ[:\s،,\-]*([\d,]+(?:\.\d+)?)/,
    /SDG\s*([\d,]+(?:\.\d+)?)/,
    /([\d,]+(?:\.\d+)?)\s*SDG/,
    /([\d,]+(?:\.\d+)?)\s*جنيه/,
  ]);
  if (amtRaw) {
    result.amount = parseAmount(amtRaw);
  } else {
    result.amount = fallbackLargestNumber(t);
  }

  const accRaw = tryPatterns(t, [
    /من\s*(?:الحساب|حساب)[:\s،,\-]*([\d\s\-]{6,})/,
    /المرسل[:\s،,\-]*([\d\s\-]{6,})/,
  ]);
  if (accRaw) result.senderAccount = extractAccount(accRaw);

  return result;
}
