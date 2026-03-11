import { useCallback, useEffect, useState } from "react";

/**
 * Keeps SVG overlay coordinates in sync with a Leaflet map instance.
 *
 * Listens for `move`, `zoom`, and `viewreset` events on the map and increments
 * an internal tick counter on each, which invalidates `toPoint` and forces
 * dependant components to recompute their pixel positions.
 *
 * @param {React.RefObject<L.Map>} mapRef - Ref holding the Leaflet map instance.
 * @param {boolean} ready - Signals that the map has finished initialising.
 *   The event listener is not attached until this is `true`, and changes to
 *   this value re-run the setup effect.
 * @returns {{ toPoint: (lat: number, lng: number) => { x: number, y: number } }}
 *   `toPoint` converts a lat/lng pair to pixel coordinates relative to the
 *   map's container. Returns `{ x: 0, y: 0 }` when the map is unavailable.
 *
 * @example
 * const mapRef = useRef(null);
 * const { toPoint } = useMapSync(mapRef, isReady);
 *
 * // Inside render — recalculates automatically after pan/zoom
 * const { x, y } = toPoint(51.505, -0.09);
 */
export function useMapSync(mapRef, ready) {
    const [tick, setTick] = useState(0);

    useEffect(() => {
        if (!mapRef.current) return;
        // Force an initial tick so toPoint is recomputed with real coordinates
        setTick((t) => t + 1);
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
