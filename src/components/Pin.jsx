import "./styles/Pin.css";
import { useEffect, useRef } from "react";
import L from "leaflet";
import { PIN_STYLE } from "../config";

/**
 * Pin — renders a single Leaflet circleMarker with a hover tooltip.
 *
 * Props:
 *   map      : Leaflet map instance
 *   location : { name, lat, lng }
 */
export default function Pin({ map, location }) {
    const markerRef = useRef(null);

    useEffect(() => {
        if (!map || !location) return;

        const marker = L.circleMarker(
            [location.lat, location.lng],
            PIN_STYLE,
        ).addTo(map);

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
