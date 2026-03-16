import { colorForCount } from "./connectionUtils";
import { buildPath } from "./ConnectionHelpers/buildPath";
import { useConnectionAnim } from "./ConnectionHelpers/useConnectionAnim";
import { CONNECTION_WIDTH_MIN, CONNECTION_WIDTH_MAX } from "../config";

/**
 * Connection — "Width" encoding.
 *
 * Visual variable: stroke WIDTH scales with connection count.
 * Shape is controlled by the `shape` prop ("arc" | "line").
 *
 * Props:
 *   from     : { x, y }
 *   to       : { x, y }
 *   count    : number of connections for this pair
 *   maxCount : dataset maximum (drives colour + width normalisation)
 *   shape    : "arc" | "line"
 *   index    : render order (used for animation stagger)
 *   onClick  : optional click handler (used to open stories)
 */
export default function Connection({
    from,
    to,
    count,
    maxCount,
    shape = "arc",
    index = 0,
    onClick,
}) {
    const color = colorForCount(count, maxCount);

    const t = maxCount > 1 ? (count - 1) / (maxCount - 1) : 0;
    const strokeWidth =
        CONNECTION_WIDTH_MIN +
        t * (CONNECTION_WIDTH_MAX - CONNECTION_WIDTH_MIN);

    const { d, arcLen } = buildPath(from, to, shape);
    const pathRef = useConnectionAnim(arcLen, index);

    return (
        <g
            style={{ cursor: "pointer", pointerEvents: "auto" }}
            onClick={onClick}
        >
            {/* glow halo */}
            <path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth + 6}
                strokeOpacity={0.12}
                strokeLinecap="round"
            />
            {/* main animated stroke */}
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
