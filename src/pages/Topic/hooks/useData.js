// useData.js  –  fetches & caches the topic JSON once
import { useState, useEffect } from "react";
import { DATA_PATH } from "../config";

/**
 * Loads the JSON data file from /public.
 * Returns { data, loading, error }.
 */
export function useData() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function fetchData() {
            try {
                const res = await fetch(DATA_PATH);
                if (!res.ok)
                    throw new Error(`HTTP ${res.status} – ${res.statusText}`);
                const json = await res.json();
                if (!cancelled) setData(json);
            } catch (err) {
                if (!cancelled) {
                    console.error("[useData] Failed to load data:", err);
                    setError(err.message);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchData();
        return () => {
            cancelled = true;
        };
    }, []);

    return { data, loading, error };
}
