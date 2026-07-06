const DEVICE_ID_KEY = "sijil_device_id";
const SECRET = "SIJIL_SECRET_2026";

export const SUBSCRIPTION_DURATIONS = [30, 90, 365] as const;

function randomHex(len: number): string {
  const bytes = new Uint8Array(Math.ceil(len / 2));
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, len)
    .toUpperCase();
}

export function ensureDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `DEV-${randomHex(6)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function getDeviceId(): string {
  return ensureDeviceId();
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function generateActivationCode(
  deviceId: string,
  duration: number
): Promise<string> {
  const hash = await sha256Hex(`${deviceId}|${duration}|${SECRET}`);
  const raw = hash.slice(0, 8).toUpperCase();
  return `SJL-${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

function normalizeCode(input: string): string {
  let clean = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.startsWith("SJL")) clean = clean.slice(3);
  clean = clean.slice(0, 8);
  return `SJL-${clean.slice(0, 4)}-${clean.slice(4, 8)}`;
}

export async function verifyActivationCode(
  deviceId: string,
  input: string
): Promise<number | null> {
  const normalized = normalizeCode(input);
  for (const duration of SUBSCRIPTION_DURATIONS) {
    const expected = await generateActivationCode(deviceId, duration);
    if (expected === normalized) return duration;
  }
  return null;
}

export function activateSubscription(durationDays: number): void {
  const expiresAt = Date.now() + durationDays * 24 * 60 * 60 * 1000;
  localStorage.setItem("sijil_activated", "true");
  localStorage.setItem("sijil_expires_at", String(expiresAt));
}
