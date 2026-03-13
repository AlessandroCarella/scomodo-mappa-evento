import "./styles/Map.css";
import { useState, useRef, useEffect } from "react";
import Pin from "./Pin";
import Connection from "./Connection";
import ConnectionAlt from "./ConnectionAlt";
import ConnectionSwitcher from "./ConnectionSwitcher";
import StoriesOverlay from "./StoriesOverlay";
import { useMapInit } from "./MapHelpers/useMapInit";
import { useMapSync } from "./MapHelpers/useMapSync";
import { processConnections } from "./ConnectionHelpers/connectionUtils";
import { DATA_PATHS } from "@/config";

export default function Map() {
    const containerRef = useRef(null);

    const { mapRef, ready } = useMapInit(containerRef);
    const { toPoint } = useMapSync(mapRef, ready);

    const [shape, setShape] = useState("arc");
    const [encoding, setEncoding] = useState("width");

    const [activeStories, setActiveStories] = useState([]);

    const [mockStories, setMockStories] = useState([]);

    const passengers = [
        "Martina",
        "Nadir",
        "Chiara",
        "Elia",
        "Sara",
        "Giulio",
        "Amina",
        "Tommaso",
        "Irene",
        "Samuele",
    ];

    const periods = [
        "Estate 2022",
        "Autunno 2023",
        "Inverno 2023",
        "Primavera 2024",
        "2024",
        "Inizio 2025",
    ];

    function hashString(s) {
        let h = 0;
        for (let i = 0; i < s.length; i += 1) {
            h = (h * 31 + s.charCodeAt(i)) >>> 0;
        }
        return h;
    }

    function buildStoryForConnection(conn, idx) {
        const fromName = conn?.from?.name || "—";
        const toName = conn?.to?.name || "—";
        const key = `${fromName}→${toName}`;
        const h = hashString(key);

        const nome = passengers[h % passengers.length];
        const periodoViaggio = periods[(h >>> 3) % periods.length];
        const count = conn?.count ?? 1;

        const testo = `Tra ${fromName} e ${toName} ho annotato questo post-it: “non è la distanza, è il cambio di passo”. ${
            count > 1
                ? `Questa tratta l’ho ripetuta ${count} volte: ogni volta una sfumatura diversa.`
                : "Una sola corsa, ma mi è rimasta addosso."
        }`;

        return {
            id: `conn-${idx}-${fromName}-${toName}`,
            nome,
            cittaProvenienza: fromName,
            cittaDestinazione: toName,
            periodoViaggio,
            testo,
        };
    }

    function handleConnectionClick(fromName, toName) {
        const matches = mockStories.filter(
            (s) =>
                s.cittaProvenienza === fromName &&
                s.cittaDestinazione === toName,
        );
        setActiveStories(matches);
    }

    function handlePinClick(locationName) {
        const matches = mockStories.filter(
            (s) => s.cittaDestinazione === locationName,
        );
        setActiveStories(matches);
    }

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
                setMockStories(conns.map((c, i) => buildStoryForConnection(c, i)));
                setMaxCount(max);
                setDataReady(true);
            })
            .catch((err) => console.error("Failed to load data:", err));
    }, []);

    const w = containerRef.current?.offsetWidth || 0;
    const h = containerRef.current?.offsetHeight || 0;

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
                                onClick={() =>
                                    handleConnectionClick(
                                        conn.from.name,
                                        conn.to.name,
                                    )
                                }
                            />
                        );
                    })}
                </svg>
            )}

            {showOverlay &&
                locations.map((loc) => (
                    <Pin
                        key={loc.name}
                        map={mapRef.current}
                        location={loc}
                        hasStories={mockStories.some(
                            (s) => s.cittaDestinazione === loc.name,
                        )}
                        onClick={handlePinClick}
                    />
                ))}

            <ConnectionSwitcher
                shape={shape}
                encoding={encoding}
                onShape={setShape}
                onEncoding={setEncoding}
            />

            {activeStories.length > 0 && (
                <StoriesOverlay
                    stories={activeStories}
                    onClose={() => setActiveStories([])}
                />
            )}
        </div>
    );
}
