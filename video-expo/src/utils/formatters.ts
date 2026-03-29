/** ISO 8601 duration → "4:32" or "1:04:32" */
export function parseDuration(iso: string): string {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return "0:00";
  const h = parseInt(m[1] ?? "0");
  const min = parseInt(m[2] ?? "0");
  const s = parseInt(m[3] ?? "0");
  if (h > 0) {
    return `${h}:${String(min).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${min}:${String(s).padStart(2, "0")}`;
}

/** 2955 → "2.9K" | 1234567 → "1.2M" */
export function compactNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

/** ISO date string → "3 years ago" */
export function timeAgo(iso: string): string {
  const sec = (Date.now() - new Date(iso).getTime()) / 1000;
  const steps = [
    [31_536_000, "year"],
    [2_592_000, "month"],
    [604_800, "week"],
    [86_400, "day"],
    [3_600, "hour"],
    [60, "minute"],
  ] as const;
  for (const [s, label] of steps) {
    const n = Math.floor(sec / s);
    if (n >= 1) return `${n} ${label}${n !== 1 ? "s" : ""} ago`;
  }
  return "just now";
}

/** Deterministic avatar color from string */
export function avatarColor(seed: string): string {
  const palette = [
    "#B91C1C",
    "#B45309",
    "#15803D",
    "#1D4ED8",
    "#7C3AED",
    "#0F766E",
    "#C2410C",
    "#0369A1",
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++)
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return palette[Math.abs(hash) % palette.length];
}
