import "./styles/Map.css";
import { useState, useRef, useEffect, useCallback } from "react";
import Pin from "./Pin";
import RouteConnections from "./RouteConnections";
import StoriesOverlay from "./StoriesOverlay";
import Banner from "./Banner";
import { useMapInit } from "./MapHelpers/useMapInit";
import { useWasdNavigation } from "./MapHelpers/useWasdNavigation";
import { useGamepad } from "./MapHelpers/useGamepad";
import { processConnections } from "./ConnectionHelpers/connectionUtils";

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
    const [activePinName, setActivePinName] = useState(null);

    // Refs to Pin marker instances, keyed by city name
    // Pin.jsx exposes nothing, so we track tooltips separately via a
    // lightweight Leaflet tooltip we open/close on the map directly.
    const wasdTooltipRef = useRef(null); // the currently shown WASD tooltip

    useEffect(() => {
        Promise.all([
            fetch(LOCATIONS_URL).then((r) => {
                if (!r.ok) throw new Error(`${r.status} ${r.url}`);
                return r.json();
            }),
            fetch(STORIES_URL).then((r) => {
                if (!r.ok) throw new Error(`${r.status} ${r.url}`);
                return r.json();
            }),
        ])
            .then(([rawLocations, rawStories]) => {
                const locByName = {};
                rawLocations.forEach((l) => {
                    locByName[l.name] = l;
                });
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

    // ── WASD: show pin label on arrival ───────────────────────────
    const handleCityReached = useCallback(
        (cityName) => {
            const map = mapRef.current;
            if (!map) return;

            // Remove previous tooltip if any
            if (wasdTooltipRef.current) {
                wasdTooltipRef.current.remove();
                wasdTooltipRef.current = null;
            }

            const city = locations.find((l) => l.name === cityName);
            if (!city) return;

            // Create a standalone Leaflet tooltip at the city's coordinates
            const tooltip = window.L
                ? window.L.tooltip({
                      permanent: true,
                      direction: "top",
                      offset: [0, -14],
                      className: "pin-tooltip pin-tooltip--wasd",
                  })
                : null;

            if (!tooltip) return;

            import("leaflet").then(({ default: L }) => {
                const t = L.tooltip({
                    permanent: true,
                    direction: "top",
                    offset: [0, -14],
                    className: "pin-tooltip pin-tooltip--wasd",
                })
                    .setLatLng([city.lat, city.lng])
                    .setContent(
                        `<span class="pin-tooltip-name">${city.name}</span>`,
                    )
                    .addTo(map);

                wasdTooltipRef.current = t;

                // Auto-dismiss after 2.5 s
                setTimeout(() => {
                    if (wasdTooltipRef.current === t) {
                        t.remove();
                        wasdTooltipRef.current = null;
                    }
                }, 2500);
            });
        },
        [mapRef, locations],
    );

    useWasdNavigation(mapRef, ready, { onCityReached: handleCityReached });
    useGamepad(mapRef, ready);

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

            {activeStories.length > 0 && (
                <StoriesOverlay
                    stories={activeStories}
                    onClose={() => setActiveStories([])}
                />
            )}
        </div>
    );
}
