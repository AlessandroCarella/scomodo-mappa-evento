import React from "react";
import * as d3 from "d3";
import { getColorScale } from "../../pages/Topic/utils/color";
import styles from "./styles/TopicContainer.module.css";

export default function TopicContainer({ hierarchicalData, palette = "Set3" }) {
    if (!hierarchicalData?.children?.length) {
        return (
            <aside className={styles.container}>
                <h4 className={styles.title}>Topics</h4>
                <p className={styles.empty}>No topics loaded</p>
            </aside>
        );
    }

    const colorScale = getColorScale(palette);
    const topics = hierarchicalData.children;

    return (
        <aside className={styles.container}>
            <h4 className={styles.title}>Topics</h4>
            <ul className={styles.list}>
                {topics.map((topic) => {
                    const baseColor = colorScale(topic.name);
                    const borderColor = d3
                        .color(baseColor)
                        .darker(1.5)
                        .toString();
                    return (
                        <li key={topic.name} className={styles.item}>
                            <span
                                className={styles.swatch}
                                style={{ background: baseColor, borderColor }}
                            />
                            <span className={styles.label}>{topic.name}</span>
                            <span className={styles.count}>{topic.value}</span>
                        </li>
                    );
                })}
            </ul>
        </aside>
    );
}
