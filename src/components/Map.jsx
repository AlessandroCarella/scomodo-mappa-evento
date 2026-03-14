import "./styles/Map.css";
import { useState, useRef, useEffect } from "react";
import Pin from "./Pin";
import RouteConnections from "./RouteConnections";
import StoriesOverlay from "./StoriesOverlay";
import Banner from "./Banner";
import QRcode from "./QRcode";
import { useMapInit } from "./MapHelpers/useMapInit";
import { processConnections } from "./ConnectionHelpers/connectionUtils";
import { QR_ENABLED, QR_LINK, QR_SIZE } from "../config";

// Vite's BASE_URL respects the `base` option in vite.config.js.
// Without this prefix, fetches return index.html (→ JSON parse error)
// when the app is served from a non-root path.
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const LOCATIONS_URL = `${BASE}/data/Locations.json`;
const STORIES_URL = `${BASE}/data/storie.json`;

export default function Map() {
    const containerRef = useRef(null);
    const { mapRef, ready } = useMapInit(containerRef);

    const [allStories, setAllStories] = useState([]);
    const [locations, setLocations] = useState([]);
    const [paths, setPaths] = useState([]);
    const [dataReady, setDataReady] = useState(false);

    const [activeStories, setActiveStories] = useState([]);

    useEffect(() => {
        Promise.all([
            fetch(LOCATIONS_URL).then((r) => {
                if (!r.ok)
                    throw new Error(
                        `Locations fetch failed: ${r.status} ${r.url}`,
                    );
                return r.json();
            }),
            fetch(STORIES_URL).then((r) => {
                if (!r.ok)
                    throw new Error(
                        `Stories fetch failed: ${r.status} ${r.url}`,
                    );
                return r.json();
            }),
        ])
            .then(([rawLocations, rawStories]) => {
                const locByName = {};
                rawLocations.forEach((l) => {
                    locByName[l.name] = l;
                });

                // Map storie.json fields → { from, to } for processConnections
                const rawConnections = rawStories.map((s) => ({
                    from: s.cittaPartenza,
                    to: s.cittaArrivo,
                }));

                const { connections: conns } = processConnections(
                    rawConnections,
                    locByName,
                );

                setLocations(rawLocations);
                setAllStories(rawStories);
                setPaths(
                    conns.map((c) => ({ from: c.from.name, to: c.to.name })),
                );
                setDataReady(true);
            })
            .catch((err) => console.error("Failed to load data:", err));
    }, []);

    function handleConnectionClick(fromName, toName) {
        const matches = allStories.filter(
            (s) =>
                (s.cittaPartenza === fromName && s.cittaArrivo === toName) ||
                (s.cittaPartenza === toName && s.cittaArrivo === fromName),
        );
        setActiveStories(matches);
    }

    function handlePinClick(locationName) {
        const matches = allStories.filter(
            (s) =>
                s.cittaArrivo === locationName ||
                s.cittaPartenza === locationName,
        );
        setActiveStories(matches);
    }

    const showOverlay = ready && dataReady;

    return (
        <div className="map-root">
            <div className="map-wrapper">
                <div ref={containerRef} className="map-container" />

                {showOverlay && (
                    <RouteConnections
                        map={mapRef.current}
                        paths={paths}
                        locationsUrl={LOCATIONS_URL}
                        speedMult={2}
                        loop={true}
                        onParticleClick={({ from, to }) =>
                            handleConnectionClick(from, to)
                        }
                    />
                )}
            </div>

            {showOverlay &&
                locations.map((loc) => (
                    <Pin
                        key={loc.name}
                        map={mapRef.current}
                        location={loc}
                        hasStories={allStories.some(
                            (s) =>
                                s.cittaArrivo === loc.name ||
                                s.cittaPartenza === loc.name,
                        )}
                        onClick={handlePinClick}
                    />
                ))}

            <Banner />

            {QR_ENABLED && <QRcode link={QR_LINK} size={QR_SIZE} />}

            {activeStories.length > 0 && (
                <StoriesOverlay
                    stories={activeStories}
                    onClose={() => setActiveStories([])}
                />
            )}
        </div>
    );
}
