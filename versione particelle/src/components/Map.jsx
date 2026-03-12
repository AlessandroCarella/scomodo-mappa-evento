import "./styles/Map.css";
import { useState, useRef, useEffect } from "react";
import Pin from "./Pin";
import Connection from "./Connection";
import ConnectionAlt from "./ConnectionAlt";
import ConnectionSwitcher from "./ConnectionSwitcher";
import { useMapInit } from "./MapHelpers/useMapInit";
import { useMapSync } from "./MapHelpers/useMapSync";
import { processConnections } from "./connectionUtils";
import { DATA_PATHS } from "@/config";
import ViaggioNavButton from "./Viaggi/ViaggioNavButton";

export default function Map() {
    const containerRef = useRef(null);

    const { mapRef, ready } = useMapInit(containerRef);
    const { toPoint } = useMapSync(mapRef, ready);

    const [shape, setShape] = useState("arc");
    const [encoding, setEncoding] = useState("width");

    // Data fetched from public/ at runtime
    const [locations, setLocations] = useState([]);
    const [connections, setConnections] = useState([]);
    const [maxCount, setMaxCount] = useState(1);
    const [dataReady, setDataReady] = useState(false);

    useEffect(() => {
        Promise.all([
            fetch(DATA_PATHS.locations).then((r) => r.json()),
            fetch(DATA_PATHS.connections).then((r) => r.json()),
        ])
            .then(([rawLocations, rawConnections]) => {
                const locByName = {};
                rawLocations.forEach((l) => {
                    locByName[l.name] = l;
                });

                const { connections: conns, maxCount: max } =
                    processConnections(rawConnections, locByName);

                setLocations(rawLocations);
                setConnections(conns);
                setMaxCount(max);
                setDataReady(true);
            })
            .catch((err) => console.error("Failed to load data:", err));
    }, []);

    const [dims, setDims] = useState({ w: 0, h: 0 });
    useEffect(() => {
        if (!containerRef.current) return;
        const obs = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            setDims({ w: width, h: height });
        });
        obs.observe(containerRef.current);
        return () => obs.disconnect();
    }, []);
    const { w, h } = dims;

    const ConnectionComponent =
        encoding === "width" ? Connection : ConnectionAlt;
    const modeKey = `${shape}-${encoding}`;
    const showOverlay = ready && dataReady;

    return (
        <div className="map-root">
            <div ref={containerRef} className="map-container" />

            {showOverlay && (
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

            {showOverlay &&
                locations.map((loc) => (
                    <Pin key={loc.name} map={mapRef.current} location={loc} />
                ))}

            <ConnectionSwitcher
                shape={shape}
                encoding={encoding}
                onShape={setShape}
                onEncoding={setEncoding}
            />
            <ViaggioNavButton />
        </div>
    );
}
