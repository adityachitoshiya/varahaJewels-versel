// The backend stores times in UTC but sends them without a "Z" (e.g. "2026-11-10T19:36:00").
// Browsers read such a string as local time, so an order placed at 1 AM in India showed the
// previous day. These helpers read it as UTC and show it in India time.
const TZ = 'Asia/Kolkata';

export function utcDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  const s = String(value);
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(s);
  return new Date(hasZone ? s : `${s.replace(' ', 'T')}Z`);
}

export function istDate(value, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const d = utcDate(value);
  return d && !isNaN(d) ? d.toLocaleDateString('en-IN', { ...opts, timeZone: TZ }) : '';
}

export function istDateTime(value, opts = { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) {
  const d = utcDate(value);
  return d && !isNaN(d) ? d.toLocaleString('en-IN', { ...opts, timeZone: TZ }) : '';
}

// "YYYY-MM-DD" of a moment in India time (to compare days)
export function istDay(value) {
  const d = value === undefined ? new Date() : utcDate(value);
  return d && !isNaN(d) ? d.toLocaleDateString('en-CA', { timeZone: TZ }) : '';
}

export const isTodayIST = (value) => istDay(value) === istDay();
