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
    STORY_FILTERS_CONFIG,
    STORY_FILTER_MODES,
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

function normalizeConfiguredFilter(config) {
    const allowedModes = new Set(Object.values(STORY_FILTER_MODES));
    const mode = allowedModes.has(config?.mode)
        ? config.mode
        : STORY_FILTER_MODES.city;
    const city = typeof config?.city === "string" ? config.city.trim() : "";

    return {
        mode,
        city,
        cityOverlay: {
            showDeparturesByDefault:
                config?.cityOverlay?.showDeparturesByDefault !== false,
            showArrivalsByDefault:
                config?.cityOverlay?.showArrivalsByDefault !== false,
        },
    };
}

const CONFIGURED_STORY_FILTER = normalizeConfiguredFilter(STORY_FILTERS_CONFIG);

function getDefaultCityOverlayFilters() {
    return {
        showDepartures:
            CONFIGURED_STORY_FILTER.cityOverlay.showDeparturesByDefault,
        showArrivals: CONFIGURED_STORY_FILTER.cityOverlay.showArrivalsByDefault,
    };
}

function storyMatchesConfiguredFilter(story, filterConfig) {
    if (!filterConfig.city) return true;

    switch (filterConfig.mode) {
        case STORY_FILTER_MODES.departure:
            return story.cittaPartenza === filterConfig.city;
        case STORY_FILTER_MODES.arrival:
            return story.cittaArrivo === filterConfig.city;
        case STORY_FILTER_MODES.city:
            return (
                story.cittaPartenza === filterConfig.city ||
                story.cittaArrivo === filterConfig.city
            );
        default:
            return true;
    }
}

function collectStoryLocations(stories) {
    const names = new Set();
    stories.forEach((story) => {
        if (story.cittaPartenza) names.add(story.cittaPartenza);
        if (story.cittaArrivo) names.add(story.cittaArrivo);
    });
    return names;
}

function splitStoriesByCity(stories, cityName) {
    return {
        departureStories: stories.filter(
            (story) => story.cittaPartenza === cityName,
        ),
        arrivalStories: stories.filter(
            (story) => story.cittaArrivo === cityName,
        ),
    };
}

export default function Map() {
    const containerRef = useRef(null);
    const { mapRef, ready } = useMapInit(containerRef);

    const [allStories, setAllStories] = useState([]);
    const [locations, setLocations] = useState([]);
    const [paths, setPaths] = useState([]);
    const [dataReady, setDataReady] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [overlayState, setOverlayState] = useState(null);
    const [cityOverlayFilters, setCityOverlayFilters] = useState(
        getDefaultCityOverlayFilters,
    );
    const [trackedLatLng, setTrackedLatLng] = useState(null);
    const [routePlaying, setRoutePlaying] = useState(false);
    const [activeRouteKey, setActiveRouteKey] = useState(null);

    const isStoriesOpenRef = useRef(false);
    const filteredStoriesRef = useRef([]);

    useEffect(() => {
        isStoriesOpenRef.current = overlayState !== null;
    }, [overlayState]);

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

    const baseFilteredStories = useMemo(
        () =>
            allStories.filter((story) =>
                storyMatchesConfiguredFilter(story, CONFIGURED_STORY_FILTER),
            ),
        [allStories],
    );

    useEffect(() => {
        filteredStoriesRef.current = baseFilteredStories;
    }, [baseFilteredStories]);

    const overlayVisibleStories = useMemo(() => {
        if (overlayState?.type !== "city") return null;

        const nextStories = [];
        if (cityOverlayFilters.showDepartures) {
            nextStories.push(...overlayState.departureStories);
        }
        if (cityOverlayFilters.showArrivals) {
            nextStories.push(...overlayState.arrivalStories);
        }

        return nextStories;
    }, [overlayState, cityOverlayFilters]);

    const highlightedStories = overlayVisibleStories ?? baseFilteredStories;

    const hasConfiguredStoryFilter = Boolean(CONFIGURED_STORY_FILTER.city);
    const hasVisualStoryFilter =
        hasConfiguredStoryFilter || overlayState?.type === "city";

    const allStoryLocations = useMemo(
        () => collectStoryLocations(allStories),
        [allStories],
    );

    const visibleRouteKeys = useMemo(() => {
        const keys = new Set();
        highlightedStories.forEach((story) => {
            const routeKey = getStoryRouteKey(story);
            if (routeKey) keys.add(routeKey);
        });
        return keys;
    }, [highlightedStories]);

    const syncStoryRoute = useCallback((story, preferredRouteKey = null) => {
        const nextRouteKey = preferredRouteKey ?? getStoryRouteKey(story);
        setActiveRouteKey((prev) =>
            prev === nextRouteKey ? prev : nextRouteKey,
        );
        setTrackedLatLng(null);
        setRoutePlaying(!!nextRouteKey);
    }, []);

    const openRouteOverlay = useCallback(
        (stories, preferredRouteKey = null) => {
            if (stories.length === 0) return;

            setOverlayState({
                type: "route",
                stories,
            });
            syncStoryRoute(stories[0], preferredRouteKey);
        },
        [syncStoryRoute],
    );

    const openCityOverlay = useCallback(
        (cityName, departureStories, arrivalStories) => {
            if (departureStories.length === 0 && arrivalStories.length === 0) {
                return;
            }

            setCityOverlayFilters(getDefaultCityOverlayFilters());
            setOverlayState({
                type: "city",
                cityName,
                departureStories,
                arrivalStories,
            });
            setTrackedLatLng(null);
            setRoutePlaying(false);
            setActiveRouteKey(null);
        },
        [],
    );

    const closeStories = useCallback(() => {
        setOverlayState(null);
        setCityOverlayFilters(getDefaultCityOverlayFilters());
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

            openRouteOverlay(
                matches,
                preferredRouteKey ?? pairKey(fromName, toName),
            );
        },
        [locations, mapRef, openRouteOverlay],
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

            const matches = allStories.filter(
                (story) =>
                    story.cittaArrivo === locationName ||
                    story.cittaPartenza === locationName,
            );
            const { departureStories, arrivalStories } = splitStoriesByCity(
                matches,
                locationName,
            );
            openCityOverlay(locationName, departureStories, arrivalStories);
        },
        [allStories, locations, mapRef, openCityOverlay],
    );

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
    const storiesOpen = overlayState !== null;
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
                        visibleRouteKeys={visibleRouteKeys}
                        hasActiveFilters={hasVisualStoryFilter}
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
                        isInteractive={allStoryLocations.has(location.name)}
                        isDimmed={false}
                        onClick={handlePinClick}
                    />
                ))}

            {showMapControls && QR_ENABLED && (
                <QRcode link={QR_LINK} size={QR_SIZE} />
            )}

            {showMapControls && FORM_ENABLED && (
                <StoryFormButton onClick={() => setFormOpen(true)} />
            )}

            <Banner overlayActive={overlayActive} />

            <StoriesOverlay
                isOpen={storiesOpen}
                mode={overlayState?.type ?? "route"}
                stories={
                    overlayState?.type === "route" ? overlayState.stories : []
                }
                cityName={
                    overlayState?.type === "city" ? overlayState.cityName : ""
                }
                departureStories={
                    overlayState?.type === "city"
                        ? overlayState.departureStories
                        : []
                }
                arrivalStories={
                    overlayState?.type === "city"
                        ? overlayState.arrivalStories
                        : []
                }
                showDepartures={cityOverlayFilters.showDepartures}
                showArrivals={cityOverlayFilters.showArrivals}
                onToggleDepartures={() =>
                    setCityOverlayFilters((prev) => ({
                        ...prev,
                        showDepartures: !prev.showDepartures,
                    }))
                }
                onToggleArrivals={() =>
                    setCityOverlayFilters((prev) => ({
                        ...prev,
                        showArrivals: !prev.showArrivals,
                    }))
                }
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
