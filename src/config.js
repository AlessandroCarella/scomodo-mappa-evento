// ─────────────────────────────────────────────────────────────
//  CONFIG
//  Single source of truth for all tunable constants.
//  Change things here; nothing else needs to be touched.
// ─────────────────────────────────────────────────────────────

// ── Data paths ────────────────────────────────────────────────
export const DATA_PATHS = {
  locations:   "/src/data/locations.json",
  connections: "/src/data/connections.json",
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
export const ITALY_BOUNDS = [[35.4, 6.6], [47.1, 18.8]];
export const ITALY_BOUNDS_PADDING = [24, 24]; // px padding inside viewport

// ── Italy GeoJSON ─────────────────────────────────────────────
// Fetched at runtime from a public CDN — no local file needed.
export const ITALY_GEOJSON_URL =
  "https://raw.githubusercontent.com/johan/world.geo.json/master/countries/ITA.geo.json";

// ── Italy polygon highlight style ────────────────────────────
export const ITALY_POLYGON_STYLE = {
  fillColor:   "#a0c8e8",
  fillOpacity: 0.10,
  color:       "#7aafd4",
  weight:      1.5,
  opacity:     0.60,
};

// ── World dim-mask opacity (everything outside Italy) ─────────
export const WORLD_MASK_OPACITY = 0.32;

// ── Connection color scale (5 stops, low → high count) ────────
export const CONNECTION_COLOR_SCALE = [
  "#5b9bd5", // 1 — steel blue
  "#6ecda0", // 2 — seafoam
  "#f0c040", // 3 — amber
  "#f07840", // 4 — orange
  "#e63030", // 5 — vivid red
];

// ── Connection width encoding (min/max stroke width in px) ────
export const CONNECTION_WIDTH_MIN = 1.5;
export const CONNECTION_WIDTH_MAX = 7.0;

// ── Connection opacity encoding (min/max opacity) ─────────────
export const CONNECTION_OPACITY_MIN = 0.20;
export const CONNECTION_OPACITY_MAX = 0.95;

// Fixed stroke width used in opacity-encoding mode
export const CONNECTION_OPACITY_STROKE_WIDTH = 2.5;

// Bézier arc curvature factor (0 = straight, higher = more curved)
export const CONNECTION_ARC_FACTOR = 0.22;

// ── Animation ─────────────────────────────────────────────────
// Draw-on animation: base delay + per-connection stagger (both in ms)
export const ANIM_BASE_DELAY    = 100;
export const ANIM_STAGGER_DELAY = 160;
export const ANIM_DURATION      = "1.2s";
export const ANIM_EASING        = "cubic-bezier(0.4,0,0.2,1)";

// ── Pin marker style ──────────────────────────────────────────
export const PIN_STYLE = {
  radius:      5,
  fillColor:   "#e8e0d0",
  color:       "#b0a080",
  weight:      1.5,
  fillOpacity: 0.95,
  opacity:     0.9,
};
