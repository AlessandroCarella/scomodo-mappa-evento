import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import Pin from "./Pin";
import Connection from "./Connection";
import ConnectionAlt from "./ConnectionAlt";
import ConnectionSwitcher from "./ConnectionSwitcher";
import { processConnections } from "./connectionUtils";
import rawLocations from "../data/locations.json";
import rawConnections from "../data/connections.json";

const MAP_MAX_ZOOM = 10;
const MAP_MIN_ZOOM = 5;

// Italy bounds — used for fitBounds on init
const ITALY_BOUNDS = [
    [35.4, 6.6],
    [47.1, 18.8],
];

// Public Italy GeoJSON — fetched at runtime, no local file needed
// Source: https://github.com/johan/world.geo.json
const ITALY_GEOJSON_URL =
    "https://raw.githubusercontent.com/johan/world.geo.json/master/countries/ITA.geo.json";

// Build lookup: name → location
const locByName = {};
rawLocations.forEach((l) => {
    locByName[l.name] = l;
});

const { connections, maxCount } = processConnections(rawConnections, locByName);

export default function Map() {
    const containerRef = useRef(null);
    const mapRef = useRef(null);

    const [tick, setTick] = useState(0);
    const [ready, setReady] = useState(false);
    const [shape, setShape] = useState("arc");
    const [encoding, setEncoding] = useState("width");

    /* ── Init Leaflet ─────────────────────────────────── */
    useEffect(() => {
        // Guard: if already initialised (React StrictMode double-invoke), skip
        if (mapRef.current) return;

        const map = L.map(containerRef.current, {
            zoomControl: true,
            attributionControl: true,
            zoomSnap: 0.25,
        });

        L.tileLayer(
            "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png",
            {
                attribution:
                    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                maxZoom: MAP_MAX_ZOOM,
                minZoom: MAP_MIN_ZOOM,
            },
        ).addTo(map);

        map.fitBounds(ITALY_BOUNDS, { padding: [24, 24] });

        mapRef.current = map;

        // Fetch Italy GeoJSON from public CDN — avoids local file issues
        fetch(ITALY_GEOJSON_URL)
            .then((r) => r.json())
            .then((geoJSON) => {
                // If StrictMode destroyed this map instance before the fetch resolved, bail out
                if (!mapRef.current || mapRef.current !== map) return;

                /* Italy polygon highlight */
                L.geoJSON(geoJSON, {
                    style: {
                        fillColor: "#a0c8e8",
                        fillOpacity: 0.1,
                        color: "#7aafd4",
                        weight: 1.5,
                        opacity: 0.6,
                    },
                }).addTo(map);

                /* World dim mask — a large rectangle with Italy punched out as holes */
                const worldRing = [
                    [-90, -180],
                    [-90, 180],
                    [90, 180],
                    [90, -180],
                ];

                // Collect every polygon ring from the GeoJSON as a hole
                const holes = [];
                const addRings = (coords) => {
                    coords.forEach((ring) => {
                        // GeoJSON is [lng, lat]; Leaflet polygon wants [lat, lng]
                        holes.push(ring.map(([lng, lat]) => [lat, lng]));
                    });
                };

                const geom =
                    geoJSON.type === "FeatureCollection"
                        ? geoJSON.features.map((f) => f.geometry)
                        : [geoJSON.geometry ?? geoJSON];

                geom.forEach((g) => {
                    if (!g) return;
                    if (g.type === "Polygon") addRings(g.coordinates);
                    if (g.type === "MultiPolygon")
                        g.coordinates.forEach(addRings);
                });

                L.polygon([worldRing, ...holes], {
                    fillColor: "#000",
                    fillOpacity: 0.32,
                    stroke: false,
                    interactive: false,
                }).addTo(map);

                setReady(true);
            })
            .catch((err) => {
                console.error("Failed to load Italy GeoJSON:", err);
                // Still show the map even if the polygon fails
                setReady(true);
            });

        /* Cleanup: destroy map so StrictMode re-mount works cleanly */
        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    /* ── Sync SVG on map move ─────────────────────────── */
    useEffect(() => {
        if (!mapRef.current) return;
        const handler = () => setTick((t) => t + 1);
        mapRef.current.on("move zoom viewreset", handler);
        return () => mapRef.current?.off("move zoom viewreset", handler);
    }, [ready]);

    const toPoint = useCallback(
        (lat, lng) => {
            if (!mapRef.current) return { x: 0, y: 0 };
            const p = mapRef.current.latLngToContainerPoint([lat, lng]);
            return { x: p.x, y: p.y };
        },
        [tick],
    );

    const w = containerRef.current?.offsetWidth || 0;
    const h = containerRef.current?.offsetHeight || 0;

    const ConnectionComponent =
        encoding === "width" ? Connection : ConnectionAlt;
    const modeKey = `${shape}-${encoding}`;

    return (
        <div className="map-root">
            <div ref={containerRef} className="map-container" />

            {ready && (
                <svg
                    className="map-svg-overlay"
                    width={w}
                    height={h}
                    style={{ pointerEvents: "none" }}
                >
                    {connections.map((conn, i) => {
                        const from = toPoint(conn.from.lat, conn.from.lng);
                        const to = toPoint(conn.to.lat, conn.to.lng);
                        return (
                            <ConnectionComponent
                                key={`${conn.from.name}-${conn.to.name}-${modeKey}`}
                                from={from}
                                to={to}
                                count={conn.count}
                                maxCount={maxCount}
                                shape={shape}
                                index={i}
                            />
                        );
                    })}
                </svg>
            )}

            {ready &&
                rawLocations.map((loc) => (
                    <Pin key={loc.name} map={mapRef.current} location={loc} />
                ))}

            <ConnectionSwitcher
                shape={shape}
                encoding={encoding}
                onShape={setShape}
                onEncoding={setEncoding}
            />
        </div>
    );
}
