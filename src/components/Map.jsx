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

    const mockStories = [
        {
            id: "s1",
            nome: "Martina",
            cittaProvenienza: "Milano",
            cittaDestinazione: "Roma",
            periodoViaggio: "2024",
            testo: "Sul treno per Roma ho trovato un post-it sotto il sedile. Diceva: “se ti senti fuori posto, forse sei semplicemente in viaggio”. L’ho attaccato al finestrino e l’ho lasciato andare con la prima galleria.",
        },
        {
            id: "s2",
            nome: "Nadir",
            cittaProvenienza: "Bologna",
            cittaDestinazione: "Firenze",
            periodoViaggio: "Autunno 2023",
            testo: "Pioveva forte, e la stazione sembrava un acquario. Ho scritto due righe su un post-it e l’ho infilato in un libro del book-crossing. Non so chi l’ha letto, ma spero gli abbia fatto compagnia almeno per una fermata.",
        },
        {
            id: "s3",
            nome: "Chiara",
            cittaProvenienza: "Roma",
            cittaDestinazione: "Napoli",
            periodoViaggio: "Estate 2022",
            testo: "Tra Roma e Napoli le luci cambiano colore. Avevo promesso che non avrei pianto, ma ho ceduto all’ultima curva prima del mare. Ho lasciato un post-it: “torna quando ti va, non quando devi”.",
        },
    ];

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
