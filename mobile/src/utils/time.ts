// Converts minutes-from-midnight (may be > 1440 for midnight-crossing trains)
// to a display string like "06:15".
export function minutesToHHMM(minutes: number): string {
  const m = minutes % 1440;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

// Returns how many minutes until the departure from now.
export function minutesUntil(departure: number): number {
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  // Handle midnight-crossing: departure may be > 1440
  const base = departure % 1440;
  let diff = base - current;
  if (diff < -60) diff += 1440; // wrapped past midnight
  return diff;
}

export function formatCountdown(minutes: number): string {
  if (minutes <= 0) return 'Due';
  if (minutes === 1) return '1 min';
  return `${minutes} min`;
}
