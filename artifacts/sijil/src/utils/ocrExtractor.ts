export interface ExtractedData {
  operationNumber?: string;
  amount?: number;
  senderAccount?: string;
}

function cleanText(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ");
}

function parseAmount(raw: string): number | undefined {
  const cleaned = raw.replace(/,/g, "").replace(/[^\d.]/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) || n <= 0 ? undefined : n;
}

function lastFourDigits(digits: string): string {
  const onlyDigits = digits.replace(/\D/g, "");
  return onlyDigits.slice(-4);
}

function extractAccountNumber(raw: string): string {
  return raw.replace(/[^\d\s]/g, "").trim().replace(/\s+/g, " ");
}

export function extractBankakData(text: string): ExtractedData {
  const t = cleanText(text);
  const result: ExtractedData = {};

  const opPatterns = [
    /رقم\s*العملية[:\s]*(\d{6,})/,
    /العملية[:\s#]*(\d{6,})/,
    /Transaction[:\s#]*(\d{6,})/i,
    /Txn[:\s#]*(\d{6,})/i,
  ];
  for (const p of opPatterns) {
    const m = t.match(p);
    if (m) { result.operationNumber = lastFourDigits(m[1]); break; }
  }

  const amtPatterns = [
    /المبلغ[:\s]*([\d,]+(?:\.\d+)?)/,
    /Amount[:\s]*([\d,]+(?:\.\d+)?)/i,
    /مبلغ\s*التحويل[:\s]*([\d,]+(?:\.\d+)?)/,
  ];
  for (const p of amtPatterns) {
    const m = t.match(p);
    if (m) { result.amount = parseAmount(m[1]); break; }
  }

  const accPatterns = [
    /من\s*حساب[:\s]*([\d\s]{8,})/,
    /من\s*الحساب[:\s]*([\d\s]{8,})/,
    /From[:\s]*([\d\s]{8,})/i,
    /حساب\s*المرسل[:\s]*([\d\s]{8,})/,
  ];
  for (const p of accPatterns) {
    const m = t.match(p);
    if (m) { result.senderAccount = extractAccountNumber(m[1]).slice(0, 40); break; }
  }

  return result;
}

export function extractFauriData(text: string): ExtractedData {
  const t = cleanText(text);
  const result: ExtractedData = {};

  const refPatterns = [
    /الرقم\s*المرجعي[:\s]*(\d{6,})/,
    /رقم\s*مرجعي[:\s]*(\d{6,})/,
    /Reference[:\s#]*(\d{6,})/i,
    /Ref[:\s#]*(\d{6,})/i,
  ];
  for (const p of refPatterns) {
    const m = t.match(p);
    if (m) { result.operationNumber = lastFourDigits(m[1]); break; }
  }

  const amtPatterns = [
    /المبلغ[:\s]*([\d,]+(?:\.\d+)?)/,
    /Amount[:\s]*([\d,]+(?:\.\d+)?)/i,
    /مبلغ\s*التحويل[:\s]*([\d,]+(?:\.\d+)?)/,
  ];
  for (const p of amtPatterns) {
    const m = t.match(p);
    if (m) { result.amount = parseAmount(m[1]); break; }
  }

  const accPatterns = [
    /من\s*الحساب[:\s]*([\d\s]{6,})/,
    /من\s*حساب[:\s]*([\d\s]{6,})/,
    /From[:\s]*([\d\s]{8,})/i,
    /المرسل[:\s]*([\d\s]{6,})/,
  ];
  for (const p of accPatterns) {
    const m = t.match(p);
    if (m) { result.senderAccount = extractAccountNumber(m[1]).slice(0, 40); break; }
  }

  return result;
}

export function extractOkashData(_text: string): ExtractedData {
  return {};
}
