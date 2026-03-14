import { useEffect } from "react";
import L from "leaflet";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const LOCATIONS_URL = `${BASE}/data/Locations.json`;

/**
 * useWasdNavigation
 *
 * W/A/S/D — navigate map city to city.
 * On arrival, calls onCityReached(cityName) so the caller can show the pin tooltip.
 *
 * Also supports gamepad right stick (axes 2/3) via the Gamepad API —
 * same directional logic, triggered when stick deflection > threshold.
 */
export function useWasdNavigation(mapRef, ready, { onCityReached } = {}) {
    useEffect(() => {
        if (!ready || !mapRef.current) return;

        let cities = [];

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

        const navigateTo = (dir) => {
            if (!mapRef.current || cities.length === 0) return;
            const map = mapRef.current;
            const centre = map.getCenter();

            let best = null,
                bestScore = -Infinity;
            for (const city of cities) {
                const dlat = city.lat - centre.lat;
                const dlng = city.lng - centre.lng;
                if (Math.abs(dlat) < 0.01 && Math.abs(dlng) < 0.01) continue;
                const dot = dir.dlat * dlat + dir.dlng * dlng;
                if (dot <= 0) continue;
                const dist = Math.sqrt(dlat * dlat + dlng * dlng);
                const score = dot / dist - dist * 0.01;
                if (score > bestScore) {
                    bestScore = score;
                    best = city;
                }
            }

            if (best) {
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
            const dir = KEY_DIR[e.key.toLowerCase()];
            if (!dir) return;
            e.preventDefault();
            navigateTo(dir);
        };

        window.addEventListener("keydown", onKey);

        // ── Gamepad right stick ──────────────────────────────────
        // Polled in rAF loop (Gamepad API is not event-driven for axes)
        let animFrame;
        let stickCooldown = 0; // ms timestamp until next repeat is allowed
        const STICK_THRESHOLD = 0.5;
        const STICK_COOLDOWN_MS = 400;

        const pollGamepad = (now) => {
            animFrame = requestAnimationFrame(pollGamepad);
            const pads = navigator.getGamepads?.() ?? [];
            for (const pad of pads) {
                if (!pad) continue;
                const ax = pad.axes[2] ?? 0; // right stick X
                const ay = pad.axes[3] ?? 0; // right stick Y
                if (now < stickCooldown) continue;
                if (
                    Math.abs(ax) < STICK_THRESHOLD &&
                    Math.abs(ay) < STICK_THRESHOLD
                )
                    continue;
                // Dominant axis wins
                const dir =
                    Math.abs(ax) > Math.abs(ay)
                        ? ax > 0
                            ? { dlat: 0, dlng: 1 }
                            : { dlat: 0, dlng: -1 }
                        : ay > 0
                          ? { dlat: -1, dlng: 0 }
                          : { dlat: 1, dlng: 0 };
                navigateTo(dir);
                stickCooldown = now + STICK_COOLDOWN_MS;
                break;
            }
        };
        animFrame = requestAnimationFrame(pollGamepad);

        return () => {
            window.removeEventListener("keydown", onKey);
            cancelAnimationFrame(animFrame);
        };
    }, [mapRef, ready, onCityReached]);
}
