import React, { useEffect, useRef } from "react";
import TextBox from "./TextBox";
import { useSelection } from "../../pages/Topic/store/selectionStore";

import styles from "./styles/AnswersContainer.module.css";

export default function AnswersContainer() {
    const { selectedKeyword } = useSelection();
    const containerRef = useRef(null);
    const isFirstKeyword = useRef(true);

    useEffect(() => {
        if (selectedKeyword) {
            // Skip scroll on the initial auto-selection at page load;
            // only scroll when the user explicitly clicks a keyword.
            if (isFirstKeyword.current) {
                isFirstKeyword.current = false;
                return;
            }
            if (containerRef.current) {
                containerRef.current.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }
        }
    }, [selectedKeyword]);

    if (!selectedKeyword) {
        return (
            <section ref={containerRef} className={styles.container}>
                <h3 className={styles.title}>
                    Clicca su una parola chiave per vedere le risposte
                </h3>
            </section>
        );
    }

    const responses = selectedKeyword.responses ?? [];

    return (
        <section ref={containerRef} className={styles.container}>
            <h3 className={styles.title}>
                Risposte per:{" "}
                <span className={styles.keyword}>
                    &ldquo;{selectedKeyword.name}&rdquo;
                </span>
                <span className={styles.topicBadge}>
                    {selectedKeyword.topic}
                </span>
            </h3>

            {responses.length === 0 ? (
                <p className={styles.empty}>
                    Nessuna risposta disponibile per questa parola chiave.
                </p>
            ) : (
                <div className={styles.grid}>
                    {responses.map((resp, i) => (
                        <TextBox key={i} response={resp} />
                    ))}
                </div>
            )}
        </section>
    );
}
