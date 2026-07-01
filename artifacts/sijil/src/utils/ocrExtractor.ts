export interface ExtractedData {
  operationNumber?: string;
  amount?: number;
  senderAccount?: string;
}

function cleanOcrText(text: string): string {
  return text
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

export function extractBankakData(text: string): ExtractedData {
  const t = cleanOcrText(text);
  const result: ExtractedData = {};

  const opRaw = tryPatterns(t, [
    /رقم\s*[اE][لL]?\s*عمل[يى][هة][:\s،,]*(\d{6,})/,
    /رقم\s*العملية[:\s،,]*(\d{4,})/,
    /رقم\s*الع[مم]لية[:\s،,]*(\d{4,})/,
    /Transaction[:\s#\-]*(\d{6,})/i,
    /Txn[:\s#\-]*(\d{6,})/i,
    /No[.:\s]*(\d{8,})/i,
  ]);
  if (opRaw) result.operationNumber = lastFourDigits(opRaw);

  const amtRaw = tryPatterns(t, [
    /المبلغ[:\s،,]*([\d,]+(?:\.\d+)?)/,
    /[Aa]mount[:\s]*([\d,]+(?:\.\d+)?)/,
    /مبلغ\s*التحويل[:\s،,]*([\d,]+(?:\.\d+)?)/,
    /قيمة\s*التحويل[:\s،,]*([\d,]+(?:\.\d+)?)/,
    /SDG\s*([\d,]+(?:\.\d+)?)/,
    /([\d,]+(?:\.\d+)?)\s*SDG/,
    /([\d,]+(?:\.\d+)?)\s*جنيه/,
  ]);
  if (amtRaw) result.amount = parseAmount(amtRaw);

  const accRaw = tryPatterns(t, [
    /من\s*حساب[:\s،,]*([\d\s\-]{6,})/,
    /من\s*الحساب[:\s،,]*([\d\s\-]{6,})/,
    /حساب\s*المرسل[:\s،,]*([\d\s\-]{6,})/,
    /[Ff]rom\s*[Aa]ccount[:\s]*([\d\s\-]{6,})/,
    /From[:\s]*([\d\s\-]{8,})/,
  ]);
  if (accRaw) result.senderAccount = extractAccount(accRaw);

  return result;
}

export function extractFauriData(text: string): ExtractedData {
  const t = cleanOcrText(text);
  const result: ExtractedData = {};

  const refRaw = tryPatterns(t, [
    /الرقم\s*المرجعي[:\s،,]*(\d{6,})/,
    /رقم\s*مرجعي[:\s،,]*(\d{6,})/,
    /[Rr]eference[:\s#\-]*(\d{6,})/,
    /[Rr]ef[.:\s#\-]*(\d{6,})/,
    /رقم\s*[اE][لL]?\s*عمل[يى][هة][:\s،,]*(\d{6,})/,
    /رقم\s*العملية[:\s،,]*(\d{4,})/,
  ]);
  if (refRaw) result.operationNumber = lastFourDigits(refRaw);

  const amtRaw = tryPatterns(t, [
    /المبلغ[:\s،,]*([\d,]+(?:\.\d+)?)/,
    /[Aa]mount[:\s]*([\d,]+(?:\.\d+)?)/,
    /مبلغ\s*التحويل[:\s،,]*([\d,]+(?:\.\d+)?)/,
    /قيمة\s*التحويل[:\s،,]*([\d,]+(?:\.\d+)?)/,
    /SDG\s*([\d,]+(?:\.\d+)?)/,
    /([\d,]+(?:\.\d+)?)\s*SDG/,
    /([\d,]+(?:\.\d+)?)\s*جنيه/,
  ]);
  if (amtRaw) result.amount = parseAmount(amtRaw);

  const accRaw = tryPatterns(t, [
    /من\s*الحساب[:\s،,]*([\d\s\-]{6,})/,
    /من\s*حساب[:\s،,]*([\d\s\-]{6,})/,
    /المرسل[:\s،,]*([\d\s\-]{6,})/,
    /[Ff]rom[:\s]*([\d\s\-]{8,})/,
  ]);
  if (accRaw) result.senderAccount = extractAccount(accRaw);

  return result;
}

export function extractOkashData(_text: string): ExtractedData {
  return {};
}
