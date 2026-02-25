// ============================================================
// WARLEVEL — Date Utilities (no external deps)
// ============================================================

export function getTodayDate(): string {
  const now = new Date();
  return formatDate(now);
}

export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getCurrentTime(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function getPreviousDate(date: string): string {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() - 1);
  return formatDate(d);
}

export function getNextDate(date: string): string {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + 1);
  return formatDate(d);
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function isTimeAfter(current: string, threshold: string): boolean {
  return current > threshold;
}

export function isTimeBefore(current: string, threshold: string): boolean {
  return current < threshold;
}

export function formatDateTime(ts: number): string {
  const d = new Date(ts);
  return `${formatDate(d)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + "T00:00:00").getTime();
  const b = new Date(dateB + "T00:00:00").getTime();
  return Math.abs(Math.round((b - a) / (1000 * 60 * 60 * 24)));
}

export function isOlderThan48h(createdAt: number): boolean {
  return Date.now() - createdAt > 48 * 60 * 60 * 1000;
}

export function msUntilTime(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  const now = new Date();
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target.getTime() - now.getTime();
}
