import * as L from "leaflet";

export function isMobileViewport() {
    return typeof window !== "undefined" && window.innerWidth < 768;
}

export function getOffsetCenter(map, latlng, isMobile) {
    if (!map || !latlng) return;
    const zoom = map.getZoom();
    const size = map.getSize();
    const targetPt = map.project(L.latLng(latlng), zoom);

    let newPoint;
    if (isMobile) {
        newPoint = L.point(targetPt.x, targetPt.y + size.y * 0.25);
    } else {
        newPoint = L.point(targetPt.x - size.x * 0.25, targetPt.y);
    }

    return map.unproject(newPoint, zoom);
}

export function moveMapToOffset(map, latlng, { isMobile, mode = "fly" } = {}) {
    const nextCenter = getOffsetCenter(map, latlng, isMobile);
    if (!nextCenter) return;

    const zoom = map.getZoom();
    if (mode === "pan") {
        map.panTo(nextCenter, {
            animate: true,
            duration: 0.35,
        });
        return;
    }

    map.flyTo(nextCenter, zoom, { duration: 1.2 });
}
