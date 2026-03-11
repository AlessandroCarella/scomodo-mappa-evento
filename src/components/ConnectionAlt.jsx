import { useEffect, useRef } from "react";
import { colorForCount } from "./connectionUtils";

/**
 * ConnectionAlt – "Opacity" encoding.
 * Shape: arc (quadratic Bézier) or straight line, controlled by `shape` prop.
 * Visual variable: stroke OPACITY grows with connection count (width is fixed).
 *
 * Props:
 *   from     : { x, y }
 *   to       : { x, y }
 *   count    : number of connections for this pair
 *   maxCount : dataset maximum (for normalised colour + opacity)
 *   shape    : "arc" | "line"
 *   index    : stagger index
 */
export default function ConnectionAlt({
    from,
    to,
    count,
    maxCount,
    shape = "arc",
    index = 0,
}) {
    const pathRef = useRef(null);
    const animRef = useRef(false);

    const color = colorForCount(count, maxCount);

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;

    // Opacity: 0.20 → 0.95 based on count
    const minOp = 0.2,
        maxOp = 0.95;
    const t = maxCount > 1 ? (count - 1) / (maxCount - 1) : 0;
    const opacity = minOp + t * (maxOp - minOp);

    // Fixed width — encoding is purely opacity
    const strokeWidth = 2.5;

    let d;
    if (shape === "arc") {
        const cx = (from.x + to.x) / 2 - dy * 0.22;
        const cy = (from.y + to.y) / 2 + dx * 0.22;
        d = `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
    } else {
        d = `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
    }

    const arcLen = shape === "arc" ? len * 1.12 : len;

    useEffect(() => {
        const el = pathRef.current;
        if (!el || animRef.current) return;
        animRef.current = true;
        el.style.strokeDasharray = arcLen;
        el.style.strokeDashoffset = arcLen;
        const timer = setTimeout(
            () => {
                el.style.transition = `stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)`;
                el.style.strokeDashoffset = "0";
            },
            100 + index * 160,
        );
        return () => clearTimeout(timer);
    }, []);

    return (
        <g>
            {/* subtle glow, also opacity-driven */}
            <path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth + 8}
                strokeOpacity={opacity * 0.15}
                strokeLinecap="round"
            />
            {/* main stroke — opacity is the signal */}
            <path
                ref={pathRef}
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeOpacity={opacity}
                strokeLinecap="round"
                style={{ strokeDasharray: arcLen, strokeDashoffset: arcLen }}
            />
        </g>
    );
}
