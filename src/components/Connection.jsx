import { useEffect, useRef } from "react";
import { colorForCount } from "./connectionUtils";

/**
 * Connection – "Width" encoding.
 * Shape: arc (quadratic Bézier) or straight line, controlled by `shape` prop.
 * Visual variable: stroke WIDTH grows with connection count.
 *
 * Props:
 *   from     : { x, y }
 *   to       : { x, y }
 *   count    : number of connections for this pair
 *   maxCount : dataset maximum (for normalised colour)
 *   shape    : "arc" | "line"
 *   index    : stagger index
 */
export default function Connection({
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

    // Width: 1.5px baseline, up to 7px at maxCount
    const minW = 1.5,
        maxW = 7;
    const t = maxCount > 1 ? (count - 1) / (maxCount - 1) : 0;
    const strokeWidth = minW + t * (maxW - minW);

    // Path definition
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
        const t = setTimeout(
            () => {
                el.style.transition = `stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)`;
                el.style.strokeDashoffset = "0";
            },
            100 + index * 160,
        );
        return () => clearTimeout(t);
    }, []);

    return (
        <g>
            {/* glow halo */}
            <path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth + 6}
                strokeOpacity={0.12}
                strokeLinecap="round"
            />
            {/* main stroke */}
            <path
                ref={pathRef}
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeOpacity={0.85}
                strokeLinecap="round"
                style={{ strokeDasharray: arcLen, strokeDashoffset: arcLen }}
            />
        </g>
    );
}
