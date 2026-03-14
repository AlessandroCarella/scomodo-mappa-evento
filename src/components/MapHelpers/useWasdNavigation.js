import { useEffect, useRef } from "react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const LOCATIONS_URL = `${BASE}/data/Locations.json`;

export function useWasdNavigation(
    mapRef,
    ready,
    { onCityReached, isStoriesOpenRef } = {},
) {
    const isAnimatingRef = useRef(false);
    const currentCityRef = useRef(null);
    // Exposed so useGamepad can call navigate from the right stick
    const navigateToRef = useRef(null);

    useEffect(() => {
        if (!ready || !mapRef.current) return;

        let cities = [];

        fetch(LOCATIONS_URL)
            .then((r) => r.json())
            .then((data) => {
                cities = data;
                // Init currentCity to the nearest city to the initial map centre
                const centre = mapRef.current?.getCenter();
                if (centre && !currentCityRef.current) {
                    let best = null,
                        bestDist = Infinity;
                    for (const city of cities) {
                        const d = Math.hypot(
                            city.lat - centre.lat,
                            city.lng - centre.lng,
                        );
                        if (d < bestDist) {
                            bestDist = d;
                            best = city;
                        }
                    }
                    if (best) currentCityRef.current = best.name;
                }
                // Make navigateTo available to consumers (e.g. useGamepad right stick)
                navigateToRef.current = navigateTo;
            })
            .catch((err) => console.error("useWasdNavigation:", err));

        const KEY_DIR = {
            w: { dlat: 1, dlng: 0 },
            s: { dlat: -1, dlng: 0 },
            a: { dlat: 0, dlng: -1 },
            d: { dlat: 0, dlng: 1 },
        };

        const navigateTo = (dir) => {
            if (
                isAnimatingRef.current ||
                isStoriesOpenRef?.current ||
                !mapRef.current ||
                cities.length === 0
            )
                return;
            const map = mapRef.current;
            const centre = map.getCenter();

            let best = null,
                bestScore = -Infinity;
            for (const city of cities) {
                const dlat = city.lat - centre.lat;
                const dlng = city.lng - centre.lng;
                if (Math.abs(dlat) < 0.01 && Math.abs(dlng) < 0.01) continue;
                const dot = dir.dlat * dlat + dir.dlng * dlng;
                // Cone at ~120°: also accepts cities slightly off-axis
                if (dot <= -0.3) continue;
                const dist = Math.sqrt(dlat * dlat + dlng * dlng);
                // Reward alignment, penalise distance slightly
                const score = dot / dist - dist * 0.008;
                if (score > bestScore) {
                    bestScore = score;
                    best = city;
                }
            }

            if (best) {
                isAnimatingRef.current = true;
                currentCityRef.current = best.name;
                map.once("moveend", () => {
                    isAnimatingRef.current = false;
                });
                map.flyTo([best.lat, best.lng], map.getZoom(), {
                    animate: true,
                    duration: 0.6,
                });
                onCityReached?.(best.name);
            }
        };

        const onKey = (e) => {
            if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
                return;
            // Stories overlay: block all keyboard navigation
            if (isStoriesOpenRef?.current) return;

            const key = e.key.toLowerCase();
            const dir = KEY_DIR[key];
            if (!dir) return;
            e.preventDefault();
            navigateTo(dir);
        };

        window.addEventListener("keydown", onKey);

        return () => {
            window.removeEventListener("keydown", onKey);
            navigateToRef.current = null;
        };
    }, [mapRef, ready, onCityReached, isStoriesOpenRef]);

    return { isAnimatingRef, currentCityRef, navigateToRef };
}
