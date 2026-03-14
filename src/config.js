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
    // satellite carino
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}";
// // scuro ma con i nomi delle regioni
// "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
// "https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}"
// "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png"
// "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
// "https://tile.jawg.io/jawg-light/{z}/{x}/{y}{r}.png?access-token={accessToken}"

// "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" //base
// "https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}"
// "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"
// "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"
// "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png"
// "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png"
// "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png"; //bianco nera

export const TILE_ATTRIBUTION =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors ' +
    '&copy; <a href="https://carto.com/attributions">CARTO</a>';

// ── Zoom ──────────────────────────────────────────────────────
export const MAP_MIN_ZOOM = 5;
export const MAP_MAX_ZOOM = 8.25;
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

// ── Stories overlay / connection interaction ────────────────────
export const ENABLE_CONNECTION_HITBOX = true;
export const CONNECTION_HITBOX_WIDTH = 25;

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

// ── RouteConnections ──────────────────────────────────────────

// Number of geo-positions kept in each particle's trail buffer
export const ROUTE_TRAIL_LEN = 18;

// Cycling palette for particle colours
export const ROUTE_PCOLORS = [
    "#ff9aa2",
    "#ffb347",
    "#fdfd96",
    "#b5ead7",
    "#a2c4f5",
    "#c9b1ff",
    "#f7a8d8",
];

// Pixel radius used for click / hover hit detection
export const ROUTE_HIT_RADIUS = 22;

// Ghost route
export const ROUTE_GHOST_COLOR = "rgba(150, 150, 150, 0.22)";
export const ROUTE_GHOST_WIDTH = 1.5; // px

// Colour-fade grey target (0–255) — used in routeColor() when t → 0
export const ROUTE_COLOR_GREY = 150;

// Progress line
export const ROUTE_PROGRESS_WIDTH = 2; // px
export const ROUTE_PROGRESS_ALPHA = 0.82;

// Dash pattern
export const ROUTE_DASH_ON = 6; // px
export const ROUTE_DASH_OFF = 5; // px

// Trail
export const ROUTE_TRAIL_WIDTH_MAX = 5; // px — scaled by frac
export const ROUTE_TRAIL_ALPHA_MAX = 0.7; // scaled by frac

// Active dot
export const ROUTE_DOT_RADIUS = 6; // px base radius
export const ROUTE_DOT_PULSE_AMP = 0.1; // fraction of radius
export const ROUTE_DOT_PULSE_SPEED = 400; // ms per cycle
export const ROUTE_DOT_STROKE = "#111";
export const ROUTE_DOT_STROKE_WIDTH = 1.5; // px

// Paused dot
export const ROUTE_DOT_PAUSED_RADIUS = 8; // px
export const ROUTE_DOT_PAUSED_FILL = "#fff";
export const ROUTE_DOT_PAUSED_STROKE = "#111";
export const ROUTE_DOT_PAUSED_WIDTH = 2; // px

// Pause icon bars (offsets from dot centre, px)
export const ROUTE_PAUSE_BAR_X1 = -3.5;
export const ROUTE_PAUSE_BAR_X2 = 1;
export const ROUTE_PAUSE_BAR_Y = -3.5;
export const ROUTE_PAUSE_BAR_W = 2.5;
export const ROUTE_PAUSE_BAR_H = 7;

// ── QR Code ───────────────────────────────────────────────────

export const QR_ENABLED = true;

// URL encoded into the QR code
export const QR_LINK = "https://scomodo-mappa-evento.pages.dev/";

// Size of the QR card.
// Any valid CSS length works: px, vw, vh, min(), clamp(), etc.
// Default: 1/16 of a 16:9 screen — one cell of a 4×4 grid.
const QR_SIDE_SIZE = 17;
export const QR_SIZE = `min(${QR_SIDE_SIZE}vw, ${QR_SIDE_SIZE}vh)`;

// ── Story Form ────────────────────────────────────────────────

// Set to false to hide the form button entirely
export const FORM_ENABLED = true;

// Size of the trigger button — same logic as QR_SIZE.
// Any valid CSS length: px, vw, vh, min(), clamp(), etc.
export const FORM_BUTTON_SIZE = "min(25vw, 25vh)";

// ── Story Form field constraints ──────────────────────────────
export const FORM_STORIA_MAX_LENGTH = 1000;
export const FORM_ETA_MIN = 1;
export const FORM_ETA_MAX = 120;

// ── Story Form UI strings ─────────────────────────────────────
// Change these to localise or rebrand the form without touching JSX.
export const FORM_EYEBROW = "Scomodo · Mappa dei viaggi";
export const FORM_TITLE = "La tua storia";
export const FORM_DESC =
    "Hai viaggiato in Italia? Condividi la tua esperienza — apparirà sulla mappa insieme alle altre storie.";
export const FORM_SUBMIT_LABEL = "Manda la tua storia →";
export const FORM_SENDING_LABEL = "Invio in corso…";

export const FORM_SUCCESS_TITLE = "Storia inviata!";
export const FORM_SUCCESS_BODY = "Grazie per aver condiviso il tuo viaggio.";
export const FORM_SUCCESS_RESET = "Invia un'altra storia";
export const FORM_SUCCESS_CLOSE = "Chiudi";

export const FORM_ERROR_TITLE = "Invio fallito";
export const FORM_ERROR_BODY =
    "Qualcosa è andato storto. Riprova tra qualche istante.";
export const FORM_ERROR_RETRY = "Riprova";

export const FORM_STORIA_LABEL = "Racconta la tua storia";
export const FORM_STORIA_HINT =
    "Cosa ti è rimasto di quel viaggio? Max {max} caratteri.";
export const FORM_STORIA_PLACEHOLDER = "Scrivi qui la tua storia…";

/**
 * FIELDS
 *
 * Ordered list of field descriptors for the story submission form.
 * Each entry drives both the rendered <input> and the validation logic —
 * add, remove, or reorder entries here and the form updates automatically.
 *
 * Shape:
 *   id           — matches the key in the form values object and storie.json
 *   label        — visible label text
 *   hint         — secondary helper text shown below the label
 *   type         — HTML input type
 *   placeholder  — input placeholder
 *   autoComplete — HTML autocomplete attribute (omit to default to "off")
 *   min / max    — numeric bounds (only meaningful when type === "number")
 */
export const FIELDS = [
    {
        id: "nome",
        label: "Nome",
        hint: "Come ti chiami?",
        type: "text",
        placeholder: "Es. Matteo",
        autoComplete: "given-name",
    },
    {
        id: "eta",
        label: "Età",
        hint: "Quanti anni hai?",
        type: "number",
        placeholder: "Es. 28",
        min: FORM_ETA_MIN,
        max: FORM_ETA_MAX,
    },
    {
        id: "cittaPartenza",
        label: "Città di partenza",
        hint: "Da dove sei partito/a?",
        type: "text",
        placeholder: "Es. Milano",
    },
    {
        id: "cittaArrivo",
        label: "Città di arrivo",
        hint: "Dove sei arrivato/a?",
        type: "text",
        placeholder: "Es. Torino",
    },
    {
        id: "data",
        label: "Data del viaggio",
        hint: "Quando è avvenuto il viaggio?",
        type: "date",
        placeholder: "",
    },
];

/**
 * EMPTY_FORM
 *
 * Initial / reset state for the form values object.
 * Derived automatically from FIELDS so it stays in sync if fields change.
 * The `storia` textarea is not in FIELDS (it's rendered separately) so it
 * is added explicitly.
 */
export const EMPTY_FORM = {
    ...Object.fromEntries(FIELDS.map(({ id }) => [id, ""])),
    storia: "",
};

// ── EmailJS ───────────────────────────────────────────────────
// Fill these in after running: npm install @emailjs/browser
// Get them from https://dashboard.emailjs.com
export const EMAILJS_SERVICE_ID = "mappa_evento_arriv_parti"; // e.g. "service_xxxxxxx"
export const EMAILJS_TEMPLATE_ID = "template_zv8c2s4"; // e.g. "template_xxxxxxx"
export const EMAILJS_PUBLIC_KEY = "E5ISTDoY7oB1S-uC-"; // e.g. "xxxxxxxxxxxxxxxxxxxx"
export const EMAILJS_TO_EMAIL = "scomodobarimappe@gmail.com"; // destination address
