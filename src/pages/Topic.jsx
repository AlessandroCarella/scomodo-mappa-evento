/**
 * src/pages/Topic.jsx
 *
 * Full Topic Analysis page.
 * Owns data-fetching, control state, layout and the SelectionProvider.
 */
import React, { useState, useMemo, useEffect, useCallback } from "react";

import {
    SelectionProvider,
    useSelectKeyword,
} from "./Topic/store/selectionStore";
import { useData } from "./Topic/hooks/useData";
import { transformData } from "./Topic/utils/dataTransform";

import Setters from "../components/Topic/Setters";
import CircleMap from "../components/Topic/CircleMap";
import TreeMap from "../components/Topic/TreeMap";
import TopicContainer from "../components/Topic/TopicContainer";
import AnswersContainer from "../components/Topic/AnswersContainer";

import {
    DEFAULT_TOPIC_COUNT,
    DEFAULT_PALETTE,
    MAX_TOPICS_FALLBACK,
} from "./Topic/config";

import MapBackground from "./Topic/MapBackground";
import styles from "./styles/Topic.module.css";

// ─── inner component (needs SelectionProvider in tree) ───────────────────────

function TopicAnalysis({ onBack }) {
    const { data, loading, error } = useData();
    const { restoreOrAutoSelect } = useSelectKeyword();

    const [topicCount, setTopicCount] = useState(DEFAULT_TOPIC_COUNT);
    const [palette, setPalette] = useState(DEFAULT_PALETTE);

    const maxTopics = data ? data.length : MAX_TOPICS_FALLBACK;

    const hierarchicalData = useMemo(
        () => (data ? transformData(data, topicCount) : null),
        [data, topicCount],
    );

    useEffect(() => {
        if (hierarchicalData) restoreOrAutoSelect(null, hierarchicalData);
    }, [hierarchicalData, restoreOrAutoSelect]);

    const handleTopicChange = useCallback((n) => setTopicCount(n), []);
    const handlePaletteChange = useCallback((p) => setPalette(p), []);

    // ── render guards ─────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className={styles.state}>
                <div className={styles.spinner} />
                <p>Caricamento dati…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`${styles.state} ${styles.error}`}>
                <p>⚠️ Impossibile caricare i dati</p>
                <code>{error}</code>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className={styles.page}>
            {/* ── top bar ── */}
            <header className={styles.topBar}>
                <button
                    className={styles.backBtn}
                    onClick={onBack}
                    aria-label="Torna alla home"
                >
                    <span className={styles.backArrow}>←</span>
                    Home
                </button>
                <h1 className={styles.pageTitle}>Topic Analysis</h1>
                <div className={styles.topBarSpacer} />
            </header>

            {/* ── controls ── */}
            <Setters
                topicCount={topicCount}
                maxTopics={maxTopics}
                palette={palette}
                onTopicChange={handleTopicChange}
                onPaletteChange={handlePaletteChange}
            />

            {/* ── visualisations ── */}
            <div className={styles.vizRow}>
                <CircleMap
                    data={data}
                    maxTopics={topicCount}
                    palette={palette}
                />
                <TopicContainer
                    hierarchicalData={hierarchicalData}
                    palette={palette}
                />
                <TreeMap data={data} maxTopics={topicCount} palette={palette} />
            </div>

            {/* ── responses panel ── */}
            <AnswersContainer />
        </div>
    );
}

// ─── exported page (wraps inner component with provider) ────────────────────

export default function TopicPage({ onBack }) {
    return (
        <>
            <MapBackground className={styles.mapBg} />
            <div className={styles.mapOverlay} aria-hidden="true" />
            <SelectionProvider>
                <TopicAnalysis onBack={onBack} />
            </SelectionProvider>
        </>
    );
}
