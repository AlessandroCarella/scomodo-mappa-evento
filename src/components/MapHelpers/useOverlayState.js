import { useState, useCallback } from "react";
import { getStoryRouteKey, getDefaultCityOverlayFilters } from "./storyFilters";

/**
 * Manages the stories overlay state: open/close route or city overlays,
 * active route, playback, and city overlay departure/arrival filters.
 */
export function useOverlayState() {
    const [overlayState, setOverlayState] = useState(null);
    const [cityOverlayFilters, setCityOverlayFilters] = useState(
        getDefaultCityOverlayFilters,
    );
    const [trackedLatLng, setTrackedLatLng] = useState(null);
    const [routePlaying, setRoutePlaying] = useState(false);
    const [activeRouteKey, setActiveRouteKey] = useState(null);

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
            setOverlayState({ type: "route", stories });
            syncStoryRoute(stories[0], preferredRouteKey);
        },
        [syncStoryRoute],
    );

    const openCityOverlay = useCallback(
        (cityName, departureStories, arrivalStories) => {
            if (departureStories.length === 0 && arrivalStories.length === 0)
                return;
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

    const toggleDepartures = useCallback(() => {
        setCityOverlayFilters((prev) => ({
            ...prev,
            showDepartures: !prev.showDepartures,
        }));
    }, []);

    const toggleArrivals = useCallback(() => {
        setCityOverlayFilters((prev) => ({
            ...prev,
            showArrivals: !prev.showArrivals,
        }));
    }, []);

    return {
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
    };
}
