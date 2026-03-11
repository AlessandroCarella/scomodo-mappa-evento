/**
 * Order-independent key for a city pair.
 */
export function pairKey(a, b) {
    return [a, b].sort().join("|||");
}

/**
 * 5-step color scale, index 0–4 mapped from normalised connection count.
 * The actual thresholds are computed dynamically from the dataset's max count.
 */
const COLOR_SCALE = [
    "#5b9bd5", // 1/5 — cool steel blue
    "#6ecda0", // 2/5 — seafoam
    "#f0c040", // 3/5 — amber
    "#f07840", // 4/5 — orange
    "#e63030", // 5/5 — vivid red
];

/**
 * Returns a colour from the 5-step scale based on the connection count,
 * normalised against the maximum count in the dataset.
 */
export function colorForCount(count, maxCount) {
    if (maxCount <= 1) return COLOR_SCALE[0];
    const idx = Math.round(
        ((count - 1) / (maxCount - 1)) * (COLOR_SCALE.length - 1),
    );
    return COLOR_SCALE[Math.max(0, Math.min(idx, COLOR_SCALE.length - 1))];
}

/**
 * Given raw connections array and location lookup map, returns a
 * deduplicated array of { from, to, count } objects.
 * Also returns the maxCount found.
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
        if (!seen.has(key)) {
            seen.add(key);
            const fromLoc = locByName[from];
            const toLoc = locByName[to];
            if (fromLoc && toLoc) {
                result.push({ from: fromLoc, to: toLoc, count: countMap[key] });
            }
        }
    });

    return { connections: result, maxCount };
}
