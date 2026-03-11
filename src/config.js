// ─────────────────────────────────────────────────────────────
//  CONFIG
//  Single source of truth for all tunable constants.
//  Change things here; nothing else needs to be touched.
// ─────────────────────────────────────────────────────────────

// ── Data paths (served from /public, fetched at runtime) ─────
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
export const DATA_PATHS = {
    locations: `${BASE}/data/Locations.json`,
    connections: `${BASE}/data/Connections.json`,
};

// ── Map tile layer ─────────────────────────────────────────────
export const TILE_URL =
    "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png";

export const TILE_ATTRIBUTION =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors ' +
    '&copy; <a href="https://carto.com/attributions">CARTO</a>';

// ── Zoom ──────────────────────────────────────────────────────
export const MAP_MIN_ZOOM = 5;
export const MAP_MAX_ZOOM = 10;
export const MAP_ZOOM_SNAP = 0.25;

// Italy bounding box: [[south, west], [north, east]]
export const ITALY_BOUNDS = [
    [35.4, 6.6],
    [47.1, 18.8],
];
export const ITALY_BOUNDS_PADDING = [24, 24];

// Fetched at runtime from a public CDN — no local file needed.
// ── Italy GeoJSON ─────────────────────────────────────────────
export const ITALY_GEOJSON_URL =
    "https://raw.githubusercontent.com/johan/world.geo.json/master/countries/ITA.geo.json";

// ── Italy polygon highlight style ────────────────────────────
export const ITALY_POLYGON_STYLE = {
    fillColor: "#a0c8e8",
    fillOpacity: 0.1,
    color: "#7aafd4",
    weight: 1.5,
    opacity: 0.6,
};

// ── World dim-mask opacity (everything outside Italy) ─────────
export const WORLD_MASK_OPACITY = 0.32;

// ── Connection color scale (5 stops, low → high count) ────────
export const CONNECTION_COLOR_SCALE = [
    "#5b9bd5",
    "#6ecda0",
    "#f0c040",
    "#f07840",
    "#e63030",
];

// ── Connection width encoding ─────────────────────────────────
export const CONNECTION_WIDTH_MIN = 1.5;
export const CONNECTION_WIDTH_MAX = 7.0;

// ── Connection opacity encoding ───────────────────────────────
export const CONNECTION_OPACITY_MIN = 0.2;
export const CONNECTION_OPACITY_MAX = 0.95;
export const CONNECTION_OPACITY_STROKE_WIDTH = 2.5;

// ── Bézier arc curvature ──────────────────────────────────────
export const CONNECTION_ARC_FACTOR = 0.22;

// ── Animation ─────────────────────────────────────────────────
export const ANIM_BASE_DELAY = 100;
export const ANIM_STAGGER_DELAY = 160;
export const ANIM_DURATION = "1.2s";
export const ANIM_EASING = "cubic-bezier(0.4,0,0.2,1)";

// ── Pin marker style ──────────────────────────────────────────
export const PIN_STYLE = {
    radius: 5,
    fillColor: "#e8e0d0",
    color: "#b0a080",
    weight: 1.5,
    fillOpacity: 0.95,
    opacity: 0.9,
};

// ── Banner ────────────────────────────────────────────────────

// Set VITE_BANNER_ENABLED=false in .env or CLI to disable at build time:
//   VITE_BANNER_ENABLED=false vite
//   VITE_BANNER_ENABLED=false vite build
// To toggle at runtime from the browser console see README / Banner.jsx.
export const BANNER_ENABLED = import.meta.env.VITE_BANNER_ENABLED !== "false";

// Width of each side panel as a percentage of the viewport width
export const BANNER_WIDTH_PERCENT = 30;

// Text shown in each panel (each word will be measured independently)
export const BANNER_TEXT_LEFT = "HELLO HELLO HELLO";
export const BANNER_TEXT_RIGHT = "SCOMODO SCOMODO SCOMODO";

// Milliseconds of mouse inactivity before the banner reappears
export const BANNER_REAPPEAR_DELAY = 1000;

// Minimum viewport width (px) to show the banner
export const BANNER_DESKTOP_MIN_WIDTH = 1024;

// ── Banner visual style ───────────────────────────────────────

// Backdrop blur strength (px)
export const BANNER_BLUR_PX = 6;

// Background tint — keep alpha low to let map show through
export const BANNER_BG_COLOR = "rgba(6, 10, 20, 0.25)";

// Inner-edge fade solid stop (%) — higher = sharper edge
export const BANNER_MASK_SOLID_STOP = 55;

// Text color
export const BANNER_TEXT_COLOR = "rgba(224, 208, 176, 0.90)";

// Font families — can differ between left and right panels.
// Any Google Font or system font is valid; make sure it is loaded in global.css.
export const BANNER_FONT_FAMILY_LEFT = "'Syne', sans-serif";
export const BANNER_FONT_FAMILY_RIGHT = "'Syne', sans-serif";

// Font weight applied when measuring and rendering
export const BANNER_FONT_WEIGHT = 700;

// Letter spacing (em) — accounted for during font-size calculation
export const BANNER_LETTER_SPACING = "0.10em";

// Fraction of the panel's inner width the longest word should fill (0–1).
// 0.9 = the longest word occupies 90 % of the available space.
export const BANNER_FONT_FILL_RATIO = 0.9;

// Fade in/out transition duration
export const BANNER_TRANSITION_DURATION = "0.6s";
