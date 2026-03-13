import React, { useState, useCallback } from "react";
import styles from "./styles/TextBox.module.css";

export default function TextBox({ response }) {
    const text = response?.["testo originale"] ?? "";
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(
        async (e) => {
            e.stopPropagation();
            try {
                await navigator.clipboard.writeText(text);
            } catch {
                const ta = document.createElement("textarea");
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand("copy");
                document.body.removeChild(ta);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        },
        [text],
    );

    return (
        <article
            className={styles.card}
            onClick={handleCopy}
            title="Click to copy"
        >
            <p className={styles.text}>{text}</p>
            <span
                className={`${styles.badge} ${copied ? styles.badgeCopied : ""}`}
            >
                {copied ? "✓ Copiato" : "Copia"}
            </span>
        </article>
    );
}
