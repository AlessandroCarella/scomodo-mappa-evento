import L from "leaflet";
import "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "@maplibre/maplibre-gl-leaflet"; // adds L.maplibreGL
import { BASEMAP_STYLE_URL, BASEMAP_ATTRIBUTION } from "../../config";

/**
 * Basemap: OpenFreeMap Positron (free, commercial use allowed), labels removed.
 * Drop-in replacement for L.tileLayer(...): returns the layer synchronously,
 * the style is fetched in the background.
 */
export function positronLayer(options) {
    const layer = L.maplibreGL({
        style: { version: 8, sources: {}, layers: [] },
        attributionControl: { customAttribution: BASEMAP_ATTRIBUTION },
        ...options,
    });
    fetch(BASEMAP_STYLE_URL)
        .then((r) => r.json())
        .then((style) => {
            style.layers = style.layers.filter((l) => l.type !== "symbol"); // no labels/icons
            layer.options.style = style;
            layer.getMaplibreMap()?.setStyle(style);
        });
    return layer;
}
