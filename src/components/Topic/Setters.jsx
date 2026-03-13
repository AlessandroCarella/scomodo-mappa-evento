import React from "react";
import TopicSlider from "./TopicSlider";
import PaletteSelect from "./PaletteSelect";
import { DEFAULT_TOPIC_COUNT, DEFAULT_PALETTE } from "../../pages/Topic/config";
import styles from "./styles/Setters.module.css";

export default function Setters({
    topicCount = DEFAULT_TOPIC_COUNT,
    maxTopics = 20,
    palette = DEFAULT_PALETTE,
    onTopicChange,
    onPaletteChange,
}) {
    return (
        <div className={styles.bar}>
            <TopicSlider
                value={topicCount}
                min={1}
                max={maxTopics}
                onChange={onTopicChange}
            />
            <PaletteSelect value={palette} onChange={onPaletteChange} />
        </div>
    );
}
