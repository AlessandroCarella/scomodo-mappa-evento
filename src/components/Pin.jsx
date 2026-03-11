import { useEffect, useRef } from "react";
import L from "leaflet";

/**
 * Pin – renders a single Leaflet circleMarker.
 * Tooltip shows city name in a large, styled popup.
 *
 * Props:
 *   map      : Leaflet map instance
 *   location : { name, lat, lng }
 */
export default function Pin({ map, location }) {
    const markerRef = useRef(null);

    useEffect(() => {
        if (!map || !location) return;

        const marker = L.circleMarker([location.lat, location.lng], {
            radius: 5,
            fillColor: "#e8e0d0",
            color: "#b0a080",
            weight: 1.5,
            fillOpacity: 0.95,
            opacity: 0.9,
        }).addTo(map);

        marker.bindTooltip(
            `<span class="pin-tooltip-name">${location.name}</span>`,
            {
                permanent: false,
                direction: "top",
                offset: [0, -10],
                className: "pin-tooltip",
            },
        );

        markerRef.current = marker;
        return () => marker.remove();
    }, [map, location]);

    return null;
}
