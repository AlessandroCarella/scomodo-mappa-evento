import "./styles/Pin.css";
import { useEffect, useRef } from "react";
import L from "leaflet";
import { PIN_STYLE } from "../config";

/**
 * Pin - renders a single Leaflet circleMarker with a hover tooltip.
 *
 * Props:
 *   map           : Leaflet map instance
 *   location      : { name, lat, lng }
 *   onClick       : function called when pin is clicked
 *   hasStories    : whether the city has stories in the full dataset
 *   isInteractive : whether the city is clickable under the current filters
 *   isDimmed      : whether the city should appear de-emphasized
 */
export default function Pin({
    map,
    location,
    onClick,
    hasStories = false,
    isInteractive = false,
    isDimmed = false,
    onHoverStart,
    onHoverEnd,
}) {
    const markerRef = useRef(null);

    useEffect(() => {
        if (!map || !location) return;

        const marker = L.circleMarker([location.lat, location.lng], {
            ...PIN_STYLE,
            interactive: hasStories && isInteractive,
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

        let handleMarkerClick;
        if (hasStories && isInteractive && typeof onClick === "function") {
            handleMarkerClick = () => onClick(location.name);
            marker.on("click", handleMarkerClick);
            if (typeof onHoverStart === "function")
                marker.on("mouseover", () => onHoverStart(location.name));
            if (typeof onHoverEnd === "function")
                marker.on("mouseout", () => onHoverEnd());
        }

        markerRef.current = marker;
        return () => {
            if (handleMarkerClick) {
                marker.off("click", handleMarkerClick);
                marker.off("mouseover");
                marker.off("mouseout");
            }
            marker.remove();
        };
    }, [map, location, onClick, hasStories, isInteractive, onHoverStart, onHoverEnd]);

    useEffect(() => {
        const marker = markerRef.current;
        if (!marker) return;

        const markerElement = marker.getElement?.();

        marker.setStyle({
            ...PIN_STYLE,
            interactive: hasStories && isInteractive,
            fillOpacity: isDimmed ? 0.18 : 0.95,
            opacity: isDimmed ? 0.28 : 0.9,
            color: isDimmed ? "rgba(176,160,128,0.52)" : PIN_STYLE.color,
        });

        if (markerElement) {
            markerElement.style.cursor =
                hasStories && isInteractive ? "pointer" : "";
        }
    }, [hasStories, isDimmed, isInteractive]);

    return null;
}
