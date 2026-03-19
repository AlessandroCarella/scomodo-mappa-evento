/**
 * src/pages/InDevelopment.jsx
 *
 * Placeholder page shown while a section is still being built.
 * Uses the same map-backdrop pattern as Form.jsx.
 * Route: /sviluppo
 */
import { useNavigate } from "react-router-dom";
import MapBackground from "./InDevelopment/MapBackground";
import styles from "./styles/InDevelopment.module.css";

export default function InDevelopmentPage() {
    const navigate = useNavigate();

    return (
        <>
            {/* ── map backdrop + dim — fixed siblings, outside the scroll
                 container so they never create a stacking-context conflict ── */}
            <MapBackground className={styles.mapBg} />
            <div className={styles.mapOverlay} aria-hidden="true" />

            <div className={styles.page}>
                <main className={styles.main}>
                    <div className={styles.card}>

                        <div className={styles.iconWrap} aria-hidden="true">
                            🚧
                        </div>

                        <h1 className={styles.title}>In sviluppo</h1>

                        <p className={styles.body}>
                            Questa pagina è ancora in sviluppo.
                            <br />
                            Torna a trovarci presto!
                        </p>
                    </div>
                </main>
            </div>
        </>
    );
}
