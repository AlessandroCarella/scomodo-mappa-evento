/**
 * src/pages/InDevelopment/MapBackground.jsx
 *
 * Renders the home map page (/) inside a hidden iframe as a purely
 * decorative background layer. No Leaflet init, no CSS dependencies —
 * the iframe brings its own fully-working map with it.
 *
 * pointer-events and tabIndex=-1 ensure it is completely inert.
 * aria-hidden removes it from the accessibility tree.
 */
export default function MapBackground({ className = "" }) {
    return (
        <iframe
            src="/"
            className={className}
            tabIndex={-1}
            aria-hidden="true"
            title=""
            style={{
                display: "block",
                width: "100%",
                height: "100%",
                border: "none",
                pointerEvents: "none",
            }}
        />
    );
}
