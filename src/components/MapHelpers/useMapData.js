import { useState, useEffect } from "react";
import { processConnections } from "../ConnectionHelpers/connectionUtils";
import { LOCATIONS_URL, STORIES_URL, MIN_STORIES_COUNT } from "../../config";

/**
 * Fetches locations and stories, processes connections, and returns
 * the data once ready.
 */
export function useMapData() {
    const [allStories, setAllStories] = useState([]);
    const [locations, setLocations] = useState([]);
    const [paths, setPaths] = useState([]);
    const [dataReady, setDataReady] = useState(false);

    useEffect(() => {
        Promise.all([
            fetch(LOCATIONS_URL).then((r) => {
                if (!r.ok)
                    throw new Error(
                        `Locations fetch failed: ${r.status} ${r.url}`,
                    );
                return r.json();
            }),
            fetch(STORIES_URL).then((r) => {
                if (!r.ok)
                    throw new Error(
                        `Stories fetch failed: ${r.status} ${r.url}`,
                    );
                return r.json();
            }),
        ])
            .then(([rawLocations, allRawStories]) => {
                const trueStories = allRawStories.filter(
                    (s) => s.tipo === true,
                );
                const fakeStories = allRawStories.filter(
                    (s) => s.tipo === false,
                );
                const needed = Math.max(0, MIN_STORIES_COUNT - trueStories.length);
                const shuffledFakes = fakeStories
                    .slice()
                    .sort(() => Math.random() - 0.5)
                    .slice(0, needed);
                const rawStories = [...trueStories, ...shuffledFakes];

                const locByName = {};
                rawLocations.forEach((location) => {
                    locByName[location.name] = location;
                });

                const rawConnections = rawStories.map((story) => ({
                    from: story.cittaPartenza,
                    to: story.cittaArrivo,
                }));

                const { connections } = processConnections(
                    rawConnections,
                    locByName,
                );

                const citiesInStories = new Set(
                    rawStories
                        .flatMap((s) => [s.cittaPartenza, s.cittaArrivo])
                        .filter(Boolean),
                );

                const filteredLocations = rawLocations.filter((l) =>
                    citiesInStories.has(l.name),
                );

                setLocations(filteredLocations);
                setAllStories(rawStories);
                setPaths(
                    connections.map((connection) => ({
                        from: connection.from.name,
                        to: connection.to.name,
                    })),
                );
                setDataReady(true);
            })
            .catch((err) => console.error("Failed to load data:", err));
    }, []);

    return { allStories, locations, paths, dataReady };
}
