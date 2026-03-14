/**
 * Order-independent key for a city pair.
 * "Milano" ↔ "Roma"  →  "Milano|||Roma"  (always sorted)
 */
export function pairKey(a, b) {
    return [a, b].sort().join("|||");
}

/**
 * processConnections
 *
 * Deduplicates a flat `{ from, to }` array (duplicates = higher count),
 * resolves city names to location objects, and returns the condensed list
 * plus the maximum count found.
 *
 * @param {{ from: string, to: string }[]} rawConnections
 * @param {Record<string, { name, lat, lng }>} locByName
 * @returns {{ connections: object[], maxCount: number }}
 */
export function processConnections(rawConnections, locByName) {
    const countMap = {};
    rawConnections.forEach(({ from, to }) => {
        const key = pairKey(from, to);
        countMap[key] = (countMap[key] || 0) + 1;
    });

    const maxCount = Math.max(...Object.values(countMap), 1);

    const seen = new Set();
    const result = [];
    rawConnections.forEach(({ from, to }) => {
        const key = pairKey(from, to);
        if (seen.has(key)) return;
        seen.add(key);
        const fromLoc = locByName[from];
        const toLoc = locByName[to];
        if (fromLoc && toLoc) {
            result.push({ from: fromLoc, to: toLoc, count: countMap[key] });
        }
    });

    return { connections: result, maxCount };
}
