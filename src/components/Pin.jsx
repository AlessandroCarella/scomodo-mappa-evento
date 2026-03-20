import "./styles/Pin.css";
import { useEffect, useRef } from "react";
import * as L from "leaflet";
import { PIN_STYLE } from "../config";

function canUseMarkerInteractions() {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

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
    const markerInteractionsEnabled =
        canUseMarkerInteractions() && hasStories && isInteractive;

    useEffect(() => {
        if (!map || !location) return;

        const marker = L.circleMarker([location.lat, location.lng], {
            ...PIN_STYLE,
            interactive: markerInteractionsEnabled,
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
        let handleMarkerMouseOver;
        let handleMarkerMouseOut;
        if (markerInteractionsEnabled && typeof onClick === "function") {
            handleMarkerClick = () => onClick(location.name);
            marker.on("click", handleMarkerClick);
            if (typeof onHoverStart === "function") {
                handleMarkerMouseOver = () => onHoverStart(location.name);
                marker.on("mouseover", handleMarkerMouseOver);
            }
            if (typeof onHoverEnd === "function") {
                handleMarkerMouseOut = () => onHoverEnd();
                marker.on("mouseout", handleMarkerMouseOut);
            }
        }

        markerRef.current = marker;
        return () => {
            if (handleMarkerClick) {
                marker.off("click", handleMarkerClick);
            }
            if (handleMarkerMouseOver) marker.off("mouseover", handleMarkerMouseOver);
            if (handleMarkerMouseOut) marker.off("mouseout", handleMarkerMouseOut);
            marker.remove();
        };
    }, [
        map,
        location,
        markerInteractionsEnabled,
        onClick,
        onHoverStart,
        onHoverEnd,
    ]);

    useEffect(() => {
        const marker = markerRef.current;
        if (!marker) return;

        const markerElement = marker.getElement?.();

        marker.setStyle({
            ...PIN_STYLE,
            interactive: markerInteractionsEnabled,
            fillOpacity: isDimmed ? 0.18 : 0.95,
            opacity: isDimmed ? 0.28 : 0.9,
            color: isDimmed ? "rgba(176,160,128,0.52)" : PIN_STYLE.color,
        });

        if (markerElement) {
            markerElement.style.cursor = markerInteractionsEnabled ? "pointer" : "";
        }
    }, [isDimmed, markerInteractionsEnabled]);

    return null;
}
