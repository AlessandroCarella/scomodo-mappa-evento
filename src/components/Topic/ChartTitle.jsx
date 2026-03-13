import React from "react";
import styles from "./styles/ChartTitle.module.css";

export default function ChartTitle({ title, subtitle }) {
    return (
        <header className={styles.root}>
            <span className={styles.label}>{title}</span>
            {subtitle && <span className={styles.sub}>{subtitle}</span>}
        </header>
    );
}
