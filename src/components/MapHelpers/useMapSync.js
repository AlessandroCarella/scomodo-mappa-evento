import { useCallback, useEffect, useState } from "react";

/**
 * useMapSync
 *
 * Listens to Leaflet's move/zoom/viewreset events and increments a `tick`
 * counter on each event.  Components use the returned `toPoint` helper —
 * which is re-memoised on every tick — to convert lat/lng to live SVG
 * pixel coordinates.
 *
 * @param {React.MutableRefObject} mapRef  — ref to the Leaflet map instance
 * @param {boolean}                ready  — only attach listeners once ready
 *
 * Returns:
 *   toPoint(lat, lng) → { x, y }   pixel position in container space
 */
export function useMapSync(mapRef, ready) {
    const [tick, setTick] = useState(0);

    useEffect(() => {
        if (!mapRef.current) return;
        const handler = () => setTick((t) => t + 1);
        mapRef.current.on("move zoom viewreset", handler);
        return () => mapRef.current?.off("move zoom viewreset", handler);
    }, [ready]);

    const toPoint = useCallback(
        (lat, lng) => {
            if (!mapRef.current) return { x: 0, y: 0 };
            const p = mapRef.current.latLngToContainerPoint([lat, lng]);
            return { x: p.x, y: p.y };
        },
        [tick], // eslint-disable-line react-hooks/exhaustive-deps
    );

    return { toPoint };
}
