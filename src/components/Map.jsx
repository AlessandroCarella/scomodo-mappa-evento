import "./styles/Map.css";
import { useRef, useEffect, useCallback, useMemo } from "react";
import * as L from "leaflet";
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
import { useMapData } from "./MapHelpers/useMapData";
import { useOverlayState } from "./MapHelpers/useOverlayState";
import { useCityTooltip } from "./MapHelpers/useCityTooltip";
import { moveMapToOffset, isMobileViewport } from "./MapHelpers/mapViewUtils";
import {
    CONFIGURED_STORY_FILTER,
    getStoryRouteKey,
    storyMatchesConfiguredFilter,
    collectStoryLocations,
    splitStoriesByCity,
} from "./MapHelpers/storyFilters";
import { pairKey } from "./ConnectionHelpers/connectionUtils";
import {
    QR_ENABLED,
    ITALY_BOUNDS_PADDING,
    LOCATIONS_URL,
    QR_LINK,
    QR_SIZE,
    FORM_ENABLED,
    PARTENZE_ARRIVI,
} from "../config";
import { useState } from "react";

export default function Map() {
    const containerRef = useRef(null);
    const { mapRef, ready } = useMapInit(containerRef);
    const interactionLockRef = useRef(0);

    const { allStories, locations, paths, dataReady } = useMapData();

    const [formOpen, setFormOpen] = useState(false);
    const [mapCityFilter, setMapCityFilter] = useState(null); // only used in "All" mode

    const {
        overlayState,
        cityOverlayFilters,
        trackedLatLng,
        routePlaying,
        activeRouteKey,
        openRouteOverlay,
        openCityOverlay,
        closeStories,
        handleTrackedPosition,
        handleStoryChange,
        toggleDepartures,
        toggleArrivals,
    } = useOverlayState();

    // ── Fit map to story cities once both map and data are ready ─────────────
    useEffect(() => {
        if (!ready || !dataReady || !mapRef.current) return;

        const cityNames = new Set();
        allStories.forEach((s) => {
            if (s.cittaPartenza) cityNames.add(s.cittaPartenza);
            if (s.cittaArrivo) cityNames.add(s.cittaArrivo);
        });

        const points = locations
            .filter((l) => cityNames.has(l.name))
            .map((l) => [l.lat, l.lng]);

        if (points.length === 0) return;

        mapRef.current.fitBounds(L.latLngBounds(points), {
            padding: ITALY_BOUNDS_PADDING,
        });
    }, [ready, dataReady]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Derived story lists ───────────────────────────────────────────────────

    // In "All" mode collect unique city names for the picker
    const allCityNames = useMemo(() => {
        if (PARTENZE_ARRIVI !== "All") return [];
        const names = new Set();
        allStories.forEach((s) => {
            if (s.cittaPartenza) names.add(s.cittaPartenza);
            if (s.cittaArrivo) names.add(s.cittaArrivo);
        });
        return [...names].sort();
    }, [allStories]);

    // In "All" mode the picker selection acts as a live CITTA_SCELTA
    const activeFilterConfig = useMemo(() => {
        if (PARTENZE_ARRIVI === "All" && mapCityFilter) {
            return { ...CONFIGURED_STORY_FILTER, city: mapCityFilter };
        }
        return CONFIGURED_STORY_FILTER;
    }, [mapCityFilter]);

    const baseFilteredStories = useMemo(
        () =>
            allStories.filter((story) =>
                storyMatchesConfiguredFilter(story, activeFilterConfig),
            ),
        [allStories, activeFilterConfig],
    );

    const overlayVisibleStories = useMemo(() => {
        if (overlayState?.type !== "city") return null;
        const nextStories = [];
        if (cityOverlayFilters.showDepartures)
            nextStories.push(...overlayState.departureStories);
        if (cityOverlayFilters.showArrivals)
            nextStories.push(...overlayState.arrivalStories);
        return nextStories;
    }, [overlayState, cityOverlayFilters]);

    const highlightedStories = overlayVisibleStories ?? baseFilteredStories;

    const hasConfiguredStoryFilter = Boolean(activeFilterConfig.city);
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

    // ── Tracks which city pin is currently hovered (tooltip visible) ─────────
    const hoveredCityRef = useRef(null);

    // ── Ref for WASD / gamepad: knows whether the overlay is open ────────────
    const isStoriesOpenRef = useRef(false);
    const filteredStoriesRef = useRef([]);

    useEffect(() => {
        isStoriesOpenRef.current = overlayState !== null;
    }, [overlayState]);

    useEffect(() => {
        filteredStoriesRef.current = baseFilteredStories;
    }, [baseFilteredStories]);

    // ── Map interaction handlers ──────────────────────────────────────────────
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

    const handleConnectionClick = useCallback(
        (fromName, toName, preferredRouteKey = null) => {
            const map = mapRef.current;
            if (!map) return;
            interactionLockRef.current = performance.now() + 450;

            const fromLoc = locations.find((l) => l.name === fromName);
            const toLoc = locations.find((l) => l.name === toName);
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
            interactionLockRef.current = performance.now() + 450;

            const map = mapRef.current;
            if (map) {
                const location = locations.find((l) => l.name === locationName);
                if (location) {
                    moveMapToOffset(map, [location.lat, location.lng], {
                        isMobile: isMobileViewport(),
                    });
                }
            }

            const matches = allStories.filter((story) => {
                const isPartenza = story.cittaPartenza === locationName;
                const isArrivo = story.cittaArrivo === locationName;
                if (PARTENZE_ARRIVI === "Partenze") return isPartenza;
                if (PARTENZE_ARRIVI === "Arrivi") return isArrivo;
                return isPartenza || isArrivo;
            });
            const { departureStories, arrivalStories } = splitStoriesByCity(
                matches,
                locationName,
            );
            openCityOverlay(locationName, departureStories, arrivalStories);
        },
        [allStories, locations, mapRef, openCityOverlay],
    );

    const handleCloseStories = useCallback(() => {
        interactionLockRef.current = performance.now() + 450;
        hoveredCityRef.current = null;
        closeStories();
    }, [closeStories]);

    // ── WASD & gamepad ────────────────────────────────────────────────────────
    const { handleCityReached } = useCityTooltip(mapRef, locations);

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
        onCloseStories: handleCloseStories,
        navigateToRef,
    });

    // ── Render ────────────────────────────────────────────────────────────────
    const showOverlay = ready && dataReady;
    const storiesOpen = overlayState !== null;
    const overlayActive = storiesOpen || formOpen;
    const showMapControls = !overlayActive;

    useEffect(() => {
        if (overlayActive) {
            hoveredCityRef.current = null;
        }
    }, [overlayActive]);

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
                        hoveredCityRef={hoveredCityRef}
                        onCityClick={handlePinClick}
                        interactionsEnabled={!overlayActive}
                        interactiveCityNames={allStoryLocations}
                        interactionLockRef={interactionLockRef}
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
                        isInteractive={
                            !overlayActive &&
                            allStoryLocations.has(location.name)
                        }
                        isDimmed={false}
                        onClick={handlePinClick}
                        onHoverStart={(name) => { hoveredCityRef.current = name; }}
                        onHoverEnd={() => { hoveredCityRef.current = null; }}
                    />
                ))}

            {showMapControls && PARTENZE_ARRIVI === "All" && allCityNames.length > 0 && (
                <div className="map-city-picker">
                    <span className="map-city-picker__label">Città</span>
                    <select
                        className="map-city-picker__select"
                        value={mapCityFilter ?? ""}
                        onChange={(e) =>
                            setMapCityFilter(e.target.value || null)
                        }
                    >
                        <option value="">Tutte</option>
                        {allCityNames.map((city) => (
                            <option key={city} value={city}>
                                {city}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {showMapControls && QR_ENABLED && (
                <QRcode link={QR_LINK} size={QR_SIZE} />
            )}

            {showMapControls && FORM_ENABLED && (
                <StoryFormButton onClick={() => setFormOpen(true)} />
            )}

            <img src="/logo.svg" className="map-logo" alt="" aria-hidden draggable={false} />

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
                onToggleDepartures={toggleDepartures}
                onToggleArrivals={toggleArrivals}
                onClose={handleCloseStories}
                currentLatLng={trackedLatLng}
                isPlaying={routePlaying}
                onStoryChange={handleStoryChange}
                focusTrackedLatLng={focusTrackedLatLng}
            />

            {formOpen && <StoryForm onClose={() => setFormOpen(false)} />}
        </div>
    );
}
