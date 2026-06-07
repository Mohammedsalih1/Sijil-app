export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export function getYesterdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

export function formatDateAr(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

export function formatTimeAr(isoTime: string): string {
  const [hourStr, minStr] = isoTime.split(":");
  let hour = parseInt(hourStr, 10);
  const min = minStr;
  const period = hour >= 12 ? "م" : "ص";
  hour = hour % 12 || 12;
  return `${hour}:${min} ${period}`;
}

export function formatAmountAr(amount: number): string {
  return amount.toLocaleString("ar-SA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function getCurrentTime(): string {
  const now = new Date();
  const hh = now.getHours().toString().padStart(2, "0");
  const mm = now.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
}
