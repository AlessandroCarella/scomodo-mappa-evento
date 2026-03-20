import { useRef, useCallback } from "react";
import * as L from "leaflet";

/**
 * Shows a brief floating tooltip on the map when WASD navigation reaches a city.
 */
export function useCityTooltip(mapRef, locations) {
    const wasdTooltipRef = useRef(null);

    const handleCityReached = useCallback(
        (cityName) => {
            const map = mapRef.current;
            if (!map) return;

            if (wasdTooltipRef.current) {
                wasdTooltipRef.current.remove();
                wasdTooltipRef.current = null;
            }

            const city = locations.find(
                (location) => location.name === cityName,
            );
            if (!city) return;

            const tooltip = L.tooltip({
                permanent: true,
                direction: "top",
                offset: [0, -14],
                className: "pin-tooltip pin-tooltip--wasd",
            })
                .setLatLng([city.lat, city.lng])
                .setContent(
                    `<span class="pin-tooltip-name">${city.name}</span>`,
                )
                .addTo(map);

            wasdTooltipRef.current = tooltip;

            setTimeout(() => {
                if (wasdTooltipRef.current === tooltip) {
                    tooltip.remove();
                    wasdTooltipRef.current = null;
                }
            }, 2500);
        },
        [mapRef, locations],
    );

    return { handleCityReached };
}
