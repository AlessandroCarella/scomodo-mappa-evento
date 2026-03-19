import "./styles/Map.css";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import L from "leaflet";
import Pin from "./Pin";
import RouteConnections from "./RouteConnections";
import StoriesOverlay from "./StoriesOverlay";
import Banner from "./Banner";
import QRcode from "./QRcode";
import StoryFormButton from "./StoryFormButton";
import StoryForm from "./StoryForm";
import StoryFilters from "./StoryFilters";
import { useMapInit } from "./MapHelpers/useMapInit";
import { useWasdNavigation } from "./MapHelpers/useWasdNavigation";
import { useGamepad } from "./MapHelpers/useGamepad";
import {
    pairKey,
    processConnections,
} from "./ConnectionHelpers/connectionUtils";
import {
    QR_ENABLED,
    ITALY_BOUNDS_PADDING,
    BASE,
    LOCATIONS_URL,
    STORIES_URL,
    QR_LINK,
    QR_SIZE,
    FORM_ENABLED,
} from "../config";

function isMobileViewport() {
    return typeof window !== "undefined" && window.innerWidth < 768;
}

function getOffsetCenter(map, latlng, isMobile) {
    if (!map || !latlng) return;
    const zoom = map.getZoom();
    const size = map.getSize();
    const targetPt = map.project(L.latLng(latlng), zoom);

    let newPoint;
    if (isMobile) {
        newPoint = L.point(targetPt.x, targetPt.y + size.y * 0.25);
    } else {
        newPoint = L.point(targetPt.x - size.x * 0.25, targetPt.y);
    }

    return map.unproject(newPoint, zoom);
}

function moveMapToOffset(map, latlng, { isMobile, mode = "fly" } = {}) {
    const nextCenter = getOffsetCenter(map, latlng, isMobile);
    if (!nextCenter) return;

    const zoom = map.getZoom();
    if (mode === "pan") {
        map.panTo(nextCenter, {
            animate: true,
            duration: 0.35,
        });
        return;
    }

    map.flyTo(nextCenter, zoom, { duration: 1.2 });
}

function getStoryRouteKey(story) {
    if (!story?.cittaPartenza || !story?.cittaArrivo) return null;
    return pairKey(story.cittaPartenza, story.cittaArrivo);
}

function storyMatchesFilters(story, departureCity, arrivalCity) {
    if (departureCity && story.cittaPartenza !== departureCity) return false;
    if (arrivalCity && story.cittaArrivo !== arrivalCity) return false;
    return true;
}

function collectStoryLocations(stories) {
    const names = new Set();
    stories.forEach((story) => {
        if (story.cittaPartenza) names.add(story.cittaPartenza);
        if (story.cittaArrivo) names.add(story.cittaArrivo);
    });
    return names;
}

export default function Map() {
    const containerRef = useRef(null);
    const { mapRef, ready } = useMapInit(containerRef);

    const [allStories, setAllStories] = useState([]);
    const [locations, setLocations] = useState([]);
    const [paths, setPaths] = useState([]);
    const [dataReady, setDataReady] = useState(false);
    const [activeStories, setActiveStories] = useState([]);
    const [formOpen, setFormOpen] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [departureFilter, setDepartureFilter] = useState("");
    const [arrivalFilter, setArrivalFilter] = useState("");
    const [trackedLatLng, setTrackedLatLng] = useState(null);
    const [routePlaying, setRoutePlaying] = useState(false);
    const [activeRouteKey, setActiveRouteKey] = useState(null);

    const isStoriesOpenRef = useRef(false);
    const filteredStoriesRef = useRef([]);

    useEffect(() => {
        Promise.all([
            fetch(LOCATIONS_URL).then((r) => {
                if (!r.ok) {
                    throw new Error(
                        `Locations fetch failed: ${r.status} ${r.url}`,
                    );
                }
                return r.json();
            }),
            fetch(STORIES_URL).then((r) => {
                if (!r.ok) {
                    throw new Error(
                        `Stories fetch failed: ${r.status} ${r.url}`,
                    );
                }
                return r.json();
            }),
        ])
            .then(([rawLocations, rawStories]) => {
                const locByName = {};
                rawLocations.forEach((location) => {
                    locByName[location.name] = location;
                });

                const rawConnections = rawStories.map((story) => ({
                    from: story.cittaPartenza,
                    to: story.cittaArrivo,
                }));

                const { connections } = processConnections(
                    rawConnections,
                    locByName,
                );

                // Build a set of every city name referenced in any story
                const citiesInStories = new Set(
                    rawStories
                        .flatMap((s) => [s.cittaPartenza, s.cittaArrivo])
                        .filter(Boolean),
                );

                // Keep only locations that actually appear in a story
                const filteredLocations = rawLocations.filter((l) =>
                    citiesInStories.has(l.name),
                );

                // ↓ was rawLocations
                setLocations(filteredLocations);
                setAllStories(rawStories);

                setPaths(
                    connections.map((connection) => ({
                        from: connection.from.name,
                        to: connection.to.name,
                    })),
                );
                setDataReady(true);
            })
            .catch((err) => console.error("Failed to load data:", err));
    }, []);

    // ── Fit the map to every city that actually appears in the stories ────────
    // Runs once after both the map and the JSON data are ready.
    // useMapInit's ITALY_BOUNDS call acts as the immediate fallback view while
    // the fetch is in flight, so the map is never blank.
    useEffect(() => {
        if (!ready || !dataReady || !mapRef.current) return;

        // Collect every city name referenced in any story
        const cityNames = new Set();
        allStories.forEach((s) => {
            if (s.cittaPartenza) cityNames.add(s.cittaPartenza);
            if (s.cittaArrivo) cityNames.add(s.cittaArrivo);
        });

        // Look up coordinates for those cities
        const points = locations
            .filter((l) => cityNames.has(l.name))
            .map((l) => [l.lat, l.lng]);

        if (points.length === 0) return;

        import("leaflet").then(({ default: L }) => {
            if (!mapRef.current) return;
            mapRef.current.fitBounds(L.latLngBounds(points), {
                padding: ITALY_BOUNDS_PADDING,
            });
        });
    }, [ready, dataReady]); // eslint-disable-line react-hooks/exhaustive-deps

    const hasActiveFilters = departureFilter !== "" || arrivalFilter !== "";

    const filteredStories = useMemo(
        () =>
            allStories.filter((story) =>
                storyMatchesFilters(story, departureFilter, arrivalFilter),
            ),
        [allStories, departureFilter, arrivalFilter],
    );

    useEffect(() => {
        filteredStoriesRef.current = filteredStories;
    }, [filteredStories]);

    const allStoryLocations = useMemo(
        () => collectStoryLocations(allStories),
        [allStories],
    );

    const visibleStoryLocations = useMemo(
        () => collectStoryLocations(filteredStories),
        [filteredStories],
    );

    const filteredRouteKeys = useMemo(() => {
        const keys = new Set();
        filteredStories.forEach((story) => {
            const routeKey = getStoryRouteKey(story);
            if (routeKey) keys.add(routeKey);
        });
        return keys;
    }, [filteredStories]);

    const cityOptions = useMemo(
        () =>
            locations
                .map((location) => location.name)
                .sort((a, b) => a.localeCompare(b, "it")),
        [locations],
    );

    const syncStoryRoute = useCallback((story, preferredRouteKey = null) => {
        const nextRouteKey = preferredRouteKey ?? getStoryRouteKey(story);
        setActiveRouteKey((prev) =>
            prev === nextRouteKey ? prev : nextRouteKey,
        );
        setTrackedLatLng(null);
        setRoutePlaying(!!nextRouteKey);
    }, []);

    const openStories = useCallback(
        (matches, preferredRouteKey = null) => {
            if (matches.length === 0) return;

            isStoriesOpenRef.current = true;
            setActiveStories(matches);
            syncStoryRoute(matches[0], preferredRouteKey);
        },
        [syncStoryRoute],
    );

    const closeStories = useCallback(() => {
        isStoriesOpenRef.current = false;
        setActiveStories([]);
        setTrackedLatLng(null);
        setRoutePlaying(false);
        setActiveRouteKey(null);
    }, []);

    const focusTrackedLatLng = useCallback(
        (latlng) => {
            const map = mapRef.current;
            if (!map || !latlng) return;

            moveMapToOffset(map, [latlng.lat, latlng.lng], {
                isMobile: isMobileViewport(),
                mode: "pan",
            });
        },
        [mapRef],
    );

    const handleTrackedPosition = useCallback(({ lat, lng, isPlaying }) => {
        setTrackedLatLng({ lat, lng });
        setRoutePlaying(isPlaying);
    }, []);

    const handleStoryChange = useCallback(
        ({ story }) => {
            syncStoryRoute(story);
        },
        [syncStoryRoute],
    );

    const handleConnectionClick = useCallback(
        (fromName, toName, preferredRouteKey = null) => {
            const map = mapRef.current;
            if (!map) return;

            const fromLoc = locations.find(
                (location) => location.name === fromName,
            );
            const toLoc = locations.find(
                (location) => location.name === toName,
            );
            if (fromLoc && toLoc) {
                const midLat = (fromLoc.lat + toLoc.lat) / 2;
                const midLng = (fromLoc.lng + toLoc.lng) / 2;
                moveMapToOffset(map, [midLat, midLng], {
                    isMobile: isMobileViewport(),
                });
            }

            const matches = filteredStoriesRef.current.filter(
                (story) =>
                    (story.cittaPartenza === fromName &&
                        story.cittaArrivo === toName) ||
                    (story.cittaPartenza === toName &&
                        story.cittaArrivo === fromName),
            );

            openStories(
                matches,
                preferredRouteKey ?? pairKey(fromName, toName),
            );
        },
        [locations, mapRef, openStories],
    );

    const handlePinClick = useCallback(
        (locationName) => {
            if (!locationName) return;

            const map = mapRef.current;
            if (map) {
                const location = locations.find(
                    (loc) => loc.name === locationName,
                );
                if (location) {
                    moveMapToOffset(map, [location.lat, location.lng], {
                        isMobile: isMobileViewport(),
                    });
                }
            }

            const matches = filteredStoriesRef.current.filter(
                (story) =>
                    story.cittaArrivo === locationName ||
                    story.cittaPartenza === locationName,
            );
            openStories(matches);
        },
        [locations, mapRef, openStories],
    );

    const handleResetFilters = useCallback(() => {
        setDepartureFilter("");
        setArrivalFilter("");
    }, []);

    const wasdTooltipRef = useRef(null);
    const handleCityReached = useCallback(
        (cityName) => {
            const map = mapRef.current;
            if (!map) return;

            if (wasdTooltipRef.current) {
                wasdTooltipRef.current.remove();
                wasdTooltipRef.current = null;
            }

            const city = locations.find(
                (location) => location.name === cityName,
            );
            if (!city) return;

            import("leaflet").then(({ default: leaflet }) => {
                const tooltip = leaflet
                    .tooltip({
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

                wasdTooltipRef.current = tooltip;

                setTimeout(() => {
                    if (wasdTooltipRef.current === tooltip) {
                        tooltip.remove();
                        wasdTooltipRef.current = null;
                    }
                }, 2500);
            });
        },
        [mapRef, locations],
    );

    const { isAnimatingRef, currentCityRef, navigateToRef } = useWasdNavigation(
        mapRef,
        ready,
        {
            onCityReached: handleCityReached,
            isStoriesOpenRef,
        },
    );

    useGamepad(mapRef, ready, {
        onPinClick: handlePinClick,
        currentCityRef,
        isAnimatingRef,
        isStoriesOpenRef,
        onCloseStories: closeStories,
        navigateToRef,
    });

    const showOverlay = ready && dataReady;
    const storiesOpen = activeStories.length > 0;
    const overlayActive = storiesOpen || formOpen;
    const showMapControls = !overlayActive;

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
                        onParticleClick={({ from, to, routeKey }) =>
                            handleConnectionClick(from, to, routeKey)
                        }
                        activeRouteKey={activeRouteKey}
                        visibleRouteKeys={filteredRouteKeys}
                        hasActiveFilters={hasActiveFilters}
                        onTrackedPosition={handleTrackedPosition}
                    />
                )}
            </div>

            {showOverlay &&
                locations.map((location) => (
                    <Pin
                        key={location.name}
                        map={mapRef.current}
                        location={location}
                        hasStories={allStoryLocations.has(location.name)}
                        isInteractive={visibleStoryLocations.has(location.name)}
                        isDimmed={!visibleStoryLocations.has(location.name)}
                        onClick={handlePinClick}
                    />
                ))}

            {showMapControls && (
                <StoryFilters
                    isOpen={filtersOpen}
                    onToggle={() => setFiltersOpen((prev) => !prev)}
                    departureValue={departureFilter}
                    arrivalValue={arrivalFilter}
                    cities={cityOptions}
                    onDepartureChange={setDepartureFilter}
                    onArrivalChange={setArrivalFilter}
                    onReset={handleResetFilters}
                    storyCount={filteredStories.length}
                    routeCount={filteredRouteKeys.size}
                />
            )}

            {showMapControls && QR_ENABLED && (
                <QRcode link={QR_LINK} size={QR_SIZE} />
            )}

            {showMapControls && FORM_ENABLED && (
                <StoryFormButton onClick={() => setFormOpen(true)} />
            )}

            <Banner overlayActive={overlayActive} />

            <StoriesOverlay
                stories={activeStories}
                onClose={closeStories}
                currentLatLng={trackedLatLng}
                isPlaying={routePlaying}
                onStoryChange={handleStoryChange}
                focusTrackedLatLng={focusTrackedLatLng}
            />

            {formOpen && <StoryForm onClose={() => setFormOpen(false)} />}
        </div>
    );
}
