// dataTransform.js  –  pure data-transformation helpers (no D3, no React)

/**
 * Transform raw JSON array into the nested D3-hierarchy shape used by
 * both Circle-packing and Treemap.
 *
 * @param {Array}  rawData   – array of topic objects from the JSON file
 * @param {number} maxTopics – how many top topics to keep
 * @returns {{ name: string, children: Array }} hierarchical root node
 */
export function transformData(rawData, maxTopics = 5) {
    if (!rawData?.length) return { name: "root", children: [] };

    const sortedTopics = rawData
        .map((topicObj) => {
            const topicName = Object.keys(topicObj)[0];
            const topicData = topicObj[topicName];
            return { name: topicName, data: topicData };
        })
        .sort(
            (a, b) => b.data["quantità risposte"] - a.data["quantità risposte"],
        )
        .slice(0, maxTopics);

    const children = sortedTopics.map((topic) => {
        const keywordEntries = Object.entries(topic.data["parole chiavi"]).sort(
            ([, a], [, b]) =>
                b["quantità risposte rappresentative"] -
                a["quantità risposte rappresentative"],
        );

        const keywords = keywordEntries.map(([keyword, kwData]) => ({
            name: capitalise(keyword),
            originalName: keyword,
            value: kwData["quantità risposte rappresentative"],
            type: "keyword",
            responses: kwData["risposte rappresentative"] ?? [],
        }));

        return {
            name: topic.name,
            value: topic.data["quantità risposte"],
            type: "topic",
            children: keywords,
        };
    });

    return { name: "root", children };
}

/**
 * Flatten nested topic→keyword hierarchy into a single-level list where every
 * leaf carries its parent topic name.  Used by the Treemap.
 */
export function flattenForTreemap(nestedData) {
    const children = [];

    nestedData.children?.forEach((topic) => {
        topic.children?.forEach((keyword) => {
            children.push({
                name: keyword.name,
                value: keyword.value,
                responses: keyword.responses,
                originalName: keyword.originalName ?? keyword.name,
                topic: topic.name,
                topicColor: topic.name,
            });
        });
    });

    return { name: "root", children };
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
function capitalise(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
