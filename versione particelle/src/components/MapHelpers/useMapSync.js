import { useCallback, useEffect, useState } from "react";

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
