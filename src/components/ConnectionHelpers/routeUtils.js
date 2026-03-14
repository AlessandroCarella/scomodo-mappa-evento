// ── Pure helpers ──────────────────────────────────────────────────────────────

/** Linear interpolation between a and b by t ∈ [0, 1]. */
export const lerp = (a, b, t) => a + (b - a) * t;

/** Cubic ease-in-out. */
export const ease = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/**
 * Interpolates a hex colour toward neutral grey as t approaches 0,
 * then applies the given alpha.
 */
export function routeColor(hex, t, alpha, grey = 150) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255,
        g = (n >> 8) & 255,
        b = n & 255;
    return `rgba(${Math.round(lerp(grey, r, t))},${Math.round(lerp(grey, g, t))},${Math.round(lerp(grey, b, t))},${alpha})`;
}

/**
 * Maps a distance in kilometres to an animation duration in milliseconds.
 * Clamped to [5 000, 30 000] ms.
 */
export function durationForKm(km) {
    return Math.max(5000, Math.min(30000, km * 30));
}

/**
 * Returns the great-circle distance in kilometres between two
 * {lat, lng} points using the Haversine formula.
 */
export function haversineKm(a, b) {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((a.lat * Math.PI) / 180) *
            Math.cos((b.lat * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
