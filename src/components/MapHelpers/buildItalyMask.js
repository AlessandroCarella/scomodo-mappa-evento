/**
 * buildItalyMask
 *
 * Given an Italy GeoJSON object (FeatureCollection, Feature, Polygon, or
 * MultiPolygon), returns the coordinate array needed by Leaflet's L.polygon
 * to create an inverted mask: a world-sized rectangle with Italy punched out.
 *
 * Usage:
 *   const coords = buildItalyMask(geoJSON);
 *   L.polygon(coords, { fillColor: "#000", fillOpacity: 0.32, stroke: false })
 *     .addTo(map);
 */
export function buildItalyMask(geoJSON) {
    // The outer ring covers the entire globe
    const worldRing = [
        [-90, -180],
        [-90, 180],
        [90, 180],
        [90, -180],
    ];

    const holes = [];

    // GeoJSON coords are [lng, lat]; Leaflet wants [lat, lng]
    const addRing = (ring) => holes.push(ring.map(([lng, lat]) => [lat, lng]));

    const addCoords = (coords) => coords.forEach(addRing);

    // Normalise to an array of geometry objects regardless of GeoJSON type
    const geometries = [];
    if (geoJSON.type === "FeatureCollection") {
        geoJSON.features.forEach(
            (f) => f.geometry && geometries.push(f.geometry),
        );
    } else if (geoJSON.type === "Feature") {
        if (geoJSON.geometry) geometries.push(geoJSON.geometry);
    } else {
        geometries.push(geoJSON);
    }

    geometries.forEach((g) => {
        if (!g) return;
        if (g.type === "Polygon") addCoords(g.coordinates);
        if (g.type === "MultiPolygon") g.coordinates.forEach(addCoords);
    });

    return [worldRing, ...holes];
}
