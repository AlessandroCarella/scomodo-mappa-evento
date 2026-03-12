import { useEffect, useRef } from "react";
import {
    ANIM_BASE_DELAY,
    ANIM_STAGGER_DELAY,
    ANIM_DURATION,
    ANIM_EASING,
} from "../../config";

export function useConnectionAnim(arcLen, index) {
    const pathRef = useRef(null);

    useEffect(() => {
        const el = pathRef.current;
        if (!el) return;

        // Reset to hidden state
        el.style.transition = "none";
        el.style.strokeDasharray = arcLen;
        el.style.strokeDashoffset = arcLen;

        const delay = ANIM_BASE_DELAY + index * ANIM_STAGGER_DELAY;

        const timer = setTimeout(() => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (!pathRef.current) return;
                    pathRef.current.style.transition = `stroke-dashoffset ${ANIM_DURATION} ${ANIM_EASING}`;
                    pathRef.current.style.strokeDashoffset = "0";
                });
            });
        }, delay);

        return () => {
            clearTimeout(timer);
            // Reset on cleanup so second StrictMode mount starts fresh
            if (pathRef.current) {
                pathRef.current.style.transition = "none";
                pathRef.current.style.strokeDashoffset = arcLen;
            }
        };
    }, [arcLen, index]);

    return pathRef;
}
