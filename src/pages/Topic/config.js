// ─────────────────────────────────────────────────────────────────────────────
// config.js  –  single source of truth for all magic numbers, palettes & tokens
// ─────────────────────────────────────────────────────────────────────────────

// ---------------------------------------------------------------------------
// Chart dimensions
// ---------------------------------------------------------------------------
export const CHART_WIDTH = 700;
export const CHART_HEIGHT = 700;

// ---------------------------------------------------------------------------
// Data source  (served from /public)
// ---------------------------------------------------------------------------
export const DATA_PATH = "/data/analisi_storie.json";

// ---------------------------------------------------------------------------
// Default control values
// ---------------------------------------------------------------------------
export const DEFAULT_TOPIC_COUNT = 5;
export const DEFAULT_PALETTE = "Set3";
export const MIN_TOPICS = 1;
export const MAX_TOPICS_FALLBACK = 20; // overridden once data loads

// ---------------------------------------------------------------------------
// Circle-packing layout
// ---------------------------------------------------------------------------
export const PACK_PADDING = 8; // px between circles
export const PACK_OUTER_PADDING = 20; // px gap before viewport edge
export const ZOOM_SCALE_MIN = 0.5;
export const ZOOM_SCALE_MAX = 10;
export const ZOOM_RESET_DURATION = 750; // ms

// ---------------------------------------------------------------------------
// Treemap layout
// ---------------------------------------------------------------------------
export const TREEMAP_PADDING_INNER = 3;
export const TREEMAP_PADDING_OUTER = 2;

// ---------------------------------------------------------------------------
// Label rendering thresholds
// ---------------------------------------------------------------------------
export const LABEL_MIN_RADIUS = 10; // px – hide keyword label below this circle radius
export const LABEL_MAX_FONT_SIZE = 14; // px
export const LABEL_MIN_FONT_SIZE = 8; // px
export const TREEMAP_MIN_RECT_W = 40; // px – hide label below this rect width
export const TREEMAP_MIN_RECT_H = 20; // px
export const TREEMAP_MULTILINE_H = 40; // px – use multi-line below this height
export const TREEMAP_MAX_CHARS = 12; // chars before truncation in multi-line mode
export const TREEMAP_FONT_AREA_DIV = 12; // divisor for sqrt(area) font-size calc
export const TREEMAP_FONT_MAX = 16;
export const TREEMAP_FONT_MIN = 10;
export const TREEMAP_CHAR_W_RATIO = 0.6; // estimated char-width = fontSize * ratio

// ---------------------------------------------------------------------------
// Selection / highlight styles
// ---------------------------------------------------------------------------
export const HIGHLIGHT_STROKE_COLOR = "#e74c3c";
export const HIGHLIGHT_STROKE_WIDTH = 4;
export const DEFAULT_KEYWORD_STROKE_WIDTH = 1;
export const HOVER_STROKE_COLOR = "#2c3e50";
export const HOVER_STROKE_WIDTH = 3;

// ---------------------------------------------------------------------------
// Color palettes
// Actual scheme arrays are imported from d3-scale-chromatic inside color.js
// Keys here are used as <select> option values and palette display names.
// ---------------------------------------------------------------------------
export const PALETTE_OPTIONS = [
    { value: "Set3", label: "Set3 (Default)" },
    { value: "Set1", label: "Set1" },
    { value: "Set2", label: "Set2" },
    { value: "Category10", label: "Category10" },
    { value: "Pastel1", label: "Pastel1" },
    { value: "Pastel2", label: "Pastel2" },
    { value: "Dark2", label: "Dark2" },
    { value: "Accent", label: "Accent" },
    { value: "Paired", label: "Paired" },
    { value: "Tableau10", label: "Tableau10" },
    { value: "Spectral", label: "Spectral" },
    { value: "RdYlBu", label: "RdYlBu" },
    { value: "RdBu", label: "RdBu" },
    { value: "PiYG", label: "PiYG" },
];

// ---------------------------------------------------------------------------
// UI / layout tokens
// ---------------------------------------------------------------------------
export const LEGEND_WIDTH = 280; // px – sidebar legend panel
export const RESPONSES_MAX_H = 700; // px – scrollable response grid
export const RESPONSE_CARD_MIN_H = 120; // px
export const TOOLTIP_OFFSET_X = 10; // px from cursor
export const TOOLTIP_OFFSET_Y = -10; // px from cursor

// ---------------------------------------------------------------------------
// Animation / transition
// ---------------------------------------------------------------------------
export const TRANSITION_DURATION = 300; // ms – CSS transitions
