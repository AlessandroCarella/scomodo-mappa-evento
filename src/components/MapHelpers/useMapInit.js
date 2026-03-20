import { useEffect, useRef, useState } from "react";
import * as L from "leaflet";
import { buildItalyMask } from "./buildItalyMask";
import {
    TILE_URL,
    TILE_ATTRIBUTION,
    MAP_MIN_ZOOM,
    MAP_MAX_ZOOM,
    MAP_ZOOM_SNAP,
    ITALY_BOUNDS,
    ITALY_BOUNDS_PADDING,
    ITALY_GEOJSON_URL,
    ITALY_POLYGON_STYLE,
    WORLD_MASK_OPACITY,
} from "../../config";

/**
 * useMapInit
 *
 * Initialises a Leaflet map inside `containerRef`, adds the tile layer,
 * fetches the Italy GeoJSON, draws the highlight polygon + world dim-mask,
 * and fits the view to Italy.
 *
 * Returns:
 *   mapRef  — ref holding the live Leaflet map instance (or null)
 *   ready   — boolean: true once GeoJSON has loaded and layers are added
 */
export function useMapInit(containerRef) {
    const mapRef = useRef(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (mapRef.current) return; // StrictMode guard

        let disposed = false;
        let map = null;
        let initFrame = 0;
        let fitFrame = 0;

        const initMap = () => {
            if (disposed || mapRef.current || !containerRef.current) return;

            map = L.map(containerRef.current, {
                zoomControl: false,
                attributionControl: true,
                zoomSnap: MAP_ZOOM_SNAP,
            });

            L.tileLayer(TILE_URL, {
                attribution: TILE_ATTRIBUTION,
                maxZoom: MAP_MAX_ZOOM,
                minZoom: MAP_MIN_ZOOM,
            }).addTo(map);

            mapRef.current = map;
            fitFrame = requestAnimationFrame(() => {
                if (!mapRef.current || mapRef.current !== map) return;
                map.invalidateSize(false);
                map.fitBounds(ITALY_BOUNDS, { padding: ITALY_BOUNDS_PADDING });
            });

            fetch(ITALY_GEOJSON_URL)
                .then((r) => r.json())
                .then((geoJSON) => {
                    // Bail if StrictMode destroyed this instance before the fetch resolved
                    if (!mapRef.current || mapRef.current !== map) return;

                    // Italy highlight polygon
                    // L.geoJSON(geoJSON, { style: ITALY_POLYGON_STYLE }).addTo(map);

                    // // World dim-mask (inverted polygon)
                    // L.polygon(buildItalyMask(geoJSON), {
                    //     fillColor: "#000",
                    //     fillOpacity: WORLD_MASK_OPACITY,
                    //     stroke: false,
                    //     interactive: false,
                    // }).addTo(map);

                    setReady(true);
                })
                .catch((err) => {
                    console.error("Failed to load Italy GeoJSON:", err);
                    setReady(true); // degrade gracefully — show pins/connections anyway
                });
        };

        initFrame = requestAnimationFrame(initMap);

        return () => {
            disposed = true;
            cancelAnimationFrame(initFrame);
            cancelAnimationFrame(fitFrame);
            map?.remove();
            mapRef.current = null;
        };
    }, []);

    return { mapRef, ready };
}
