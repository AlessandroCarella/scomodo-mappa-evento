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
 *   onClick  : function called when pin is clicked (only if hasStories)
 *   hasStories : boolean, enables click interaction
 *   isActive : boolean, highlights the pin when true
 */
export default function Pin({
    map,
    location,
    onClick,
    hasStories = false,
    isActive = false,
}) {
    const markerRef = useRef(null);

    useEffect(() => {
        if (!map || !location) return;

        const markerOptions = hasStories
            ? PIN_STYLE
            : {
                  ...PIN_STYLE,
                  interactive: false,
              };

        const marker = L.circleMarker(
            [location.lat, location.lng],
            markerOptions,
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

        let handleMarkerClick;
        if (hasStories && typeof onClick === "function") {
            handleMarkerClick = () => onClick(location.name);
            marker.on("click", handleMarkerClick);
            const el = marker.getElement?.();
            if (el) el.style.cursor = "pointer";
        }

        markerRef.current = marker;
        return () => {
            if (handleMarkerClick) marker.off("click", handleMarkerClick);
            marker.remove();
        };
    }, [map, location, onClick, hasStories]);

    useEffect(() => {
        const marker = markerRef.current;
        if (!marker) return;

        const baseRadius =
            typeof PIN_STYLE.radius === "number" ? PIN_STYLE.radius : 6;
        const activeRadius = Math.round(baseRadius * 2.5);

        if (isActive) {
            marker.setStyle({
                weight: Math.max((PIN_STYLE.weight || 2) + 2, 4),
                fillOpacity: 0.95,
                opacity: 1,
                fillColor: "#00FFEA",
                color: "#FFFFFF",
            });
            if (typeof marker.setRadius === "function") {
                marker.setRadius(activeRadius);
            }
        } else {
            // restore base style
            marker.setStyle({
                ...PIN_STYLE,
                interactive: hasStories ? PIN_STYLE.interactive : false,
            });
            if (typeof marker.setRadius === "function") {
                marker.setRadius(baseRadius);
            }
        }
    }, [isActive, hasStories]);

    return null;
}
