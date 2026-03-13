import React from "react";
import styles from "./styles/Setters.module.css";

export default function TopicSlider({ value, min = 1, max = 20, onChange }) {
    return (
        <div className={styles.control}>
            <label className={styles.label} htmlFor="topicSlider">
                Numero Topics
            </label>
            <div className={styles.sliderRow}>
                <input
                    id="topicSlider"
                    type="range"
                    className={styles.slider}
                    min={min}
                    max={max}
                    value={value}
                    step={1}
                    onChange={(e) => onChange(Number(e.target.value))}
                />
                <span className={styles.pill}>{value}</span>
            </div>
        </div>
    );
}
