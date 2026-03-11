import "./styles/ConnectionSwitcher.css";

/**
 * ConnectionSwitcher — two independent pill controls.
 *
 *   Shape pill   : Arc | Line
 *   Encode pill  : Width | Opacity
 *
 * Props:
 *   shape      : "arc" | "line"
 *   encoding   : "width" | "opacity"
 *   onShape    : (shape: string) => void
 *   onEncoding : (encoding: string) => void
 */
export default function ConnectionSwitcher({ shape, encoding, onShape, onEncoding }) {
  return (
    <div className="switcher-wrap">

      <div className="switcher-group">
        <span className="switcher-label">Shape</span>
        <div className="switcher-pill">
          <button className={`switcher-btn ${shape === "arc"  ? "active" : ""}`} onClick={() => onShape("arc")}>
            <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
              <path d="M1 11 Q10 1 19 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
            Arc
          </button>
          <button className={`switcher-btn ${shape === "line" ? "active" : ""}`} onClick={() => onShape("line")}>
            <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
              <line x1="1" y1="6" x2="19" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Line
          </button>
        </div>
      </div>

      <div className="switcher-group">
        <span className="switcher-label">Encode</span>
        <div className="switcher-pill">
          <button className={`switcher-btn ${encoding === "width"   ? "active" : ""}`} onClick={() => onEncoding("width")}>
            <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
              <line x1="1" y1="9" x2="19" y2="9" stroke="currentColor" strokeWidth="4"   strokeLinecap="round" />
              <line x1="1" y1="3" x2="19" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Width
          </button>
          <button className={`switcher-btn ${encoding === "opacity" ? "active" : ""}`} onClick={() => onEncoding("opacity")}>
            <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
              <line x1="1" y1="9" x2="19" y2="9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.95" />
              <line x1="1" y1="3" x2="19" y2="3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.25" />
            </svg>
            Opacity
          </button>
        </div>
      </div>

    </div>
  );
}
