import React from "react";
import TextBox from "./TextBox";
import { useSelection } from "../../pages/Topic/store/selectionStore";

import styles from "./styles/AnswersContainer.module.css";

export default function AnswersContainer() {
    const { selectedKeyword } = useSelection();

    if (!selectedKeyword) {
        return (
            <section className={styles.container}>
                <h3 className={styles.title}>
                    Clicca su una parola chiave per vedere le risposte
                </h3>
            </section>
        );
    }

    const responses = selectedKeyword.responses ?? [];

    return (
        <section className={styles.container}>
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
