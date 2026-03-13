import React from "react";
import { PALETTE_OPTIONS } from "../../pages/Topic/config";
import styles from "./styles/Setters.module.css";

export default function PaletteSelect({ value, onChange }) {
    return (
        <div className={styles.control}>
            <label className={styles.label} htmlFor="paletteSelect">
                Palette Colori
            </label>
            <select
                id="paletteSelect"
                className={styles.select}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                {PALETTE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
