import { colorForCount } from "./ConnectionHelpers/connectionUtils";
import { buildPath } from "./ConnectionHelpers/buildPath";
import { useConnectionAnim } from "./ConnectionHelpers/useConnectionAnim";
import {
    CONNECTION_OPACITY_MIN,
    CONNECTION_OPACITY_MAX,
    CONNECTION_OPACITY_STROKE_WIDTH,
} from "../config";

/**
 * ConnectionAlt — "Opacity" encoding.
 *
 * Visual variable: stroke OPACITY scales with connection count (width is fixed).
 * Shape is controlled by the `shape` prop ("arc" | "line").
 *
 * Props:
 *   from     : { x, y }
 *   to       : { x, y }
 *   count    : number of connections for this pair
 *   maxCount : dataset maximum (drives colour + opacity normalisation)
 *   shape    : "arc" | "line"
 *   index    : render order (used for animation stagger)
 */
export default function ConnectionAlt({
    from,
    to,
    count,
    maxCount,
    shape = "arc",
    index = 0,
}) {
    const color = colorForCount(count, maxCount);

    const t = maxCount > 1 ? (count - 1) / (maxCount - 1) : 0;
    const opacity =
        CONNECTION_OPACITY_MIN +
        t * (CONNECTION_OPACITY_MAX - CONNECTION_OPACITY_MIN);

    const { d, arcLen } = buildPath(from, to, shape);
    const pathRef = useConnectionAnim(arcLen, index);

    return (
        <g>
            {/* glow halo — opacity-driven */}
            <path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={CONNECTION_OPACITY_STROKE_WIDTH + 8}
                strokeOpacity={opacity * 0.15}
                strokeLinecap="round"
            />
            {/* main animated stroke — opacity is the encoding signal */}
            <path
                ref={pathRef}
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={CONNECTION_OPACITY_STROKE_WIDTH}
                strokeOpacity={opacity}
                strokeLinecap="round"
                style={{ strokeDasharray: arcLen, strokeDashoffset: arcLen }}
            />
        </g>
    );
}
