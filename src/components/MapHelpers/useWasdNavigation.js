import { useEffect } from "react";
import L from "leaflet";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const LOCATIONS_URL = `${BASE}/data/Locations.json`;

/**
 * useWasdNavigation
 *
 * W/A/S/D keys navigate the map city-to-city.
 * From the current map centre, finds the nearest city in the pressed direction
 * and flies to it.
 *
 * Direction logic:
 *   W → north  (highest positive Δlat, must have some northward component)
 *   S → south  (most negative Δlat)
 *   A → west   (most negative Δlng)
 *   D → east   (most positive Δlng)
 *
 * Uses a "directional score" that rewards movement in the target axis
 * and penalises perpendicular drift, so pressing D from Napoli goes to Bari
 * rather than jumping to a city that's only slightly east but far north.
 */
export function useWasdNavigation(mapRef, ready) {
    useEffect(() => {
        if (!ready || !mapRef.current) return;

        let cities = []; // [{name, lat, lng}]
        let currentCity = null; // name of last city navigated to

        fetch(LOCATIONS_URL)
            .then((r) => r.json())
            .then((data) => {
                cities = data;
            })
            .catch((err) =>
                console.error(
                    "useWasdNavigation: failed to load locations",
                    err,
                ),
            );

        const KEY_DIR = {
            w: { dlat: 1, dlng: 0 },
            s: { dlat: -1, dlng: 0 },
            a: { dlat: 0, dlng: -1 },
            d: { dlat: 0, dlng: 1 },
        };

        const onKey = (e) => {
            // Don't hijack if user is typing in an input/textarea
            if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
                return;

            const dir = KEY_DIR[e.key.toLowerCase()];
            if (!dir || !mapRef.current || cities.length === 0) return;

            e.preventDefault();

            const map = mapRef.current;
            const centre = map.getCenter();
            const clat = centre.lat;
            const clng = centre.lng;

            // Score each city: dot product with direction vector,
            // normalised by distance so nearby cities don't always win.
            // We only consider cities that have a positive component in the
            // pressed direction (i.e., they are actually in that direction).
            let best = null,
                bestScore = -Infinity;

            for (const city of cities) {
                const dlat = city.lat - clat;
                const dlng = city.lng - clng;

                // Skip the city we're currently centred on
                if (Math.abs(dlat) < 0.01 && Math.abs(dlng) < 0.01) continue;
                // Skip if it's in the wrong half-plane
                const dot = dir.dlat * dlat + dir.dlng * dlng;
                if (dot <= 0) continue;

                // Score = projection on desired axis / total distance
                // This prefers cities that are mostly in the right direction
                const dist = Math.sqrt(dlat * dlat + dlng * dlng);
                const score = dot / dist; // cosine of angle, weighted by nothing

                // Tie-break by proximity: among similar angles, prefer closer
                const finalScore = score - dist * 0.01;

                if (finalScore > bestScore) {
                    bestScore = finalScore;
                    best = city;
                }
            }

            if (best) {
                currentCity = best.name;
                map.flyTo([best.lat, best.lng], map.getZoom(), {
                    animate: true,
                    duration: 0.6,
                });
            }
        };

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [mapRef, ready]);
}
