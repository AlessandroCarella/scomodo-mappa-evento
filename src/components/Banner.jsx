import "./styles/Banner.css";
import { useRef } from "react";
import { useBannerVisibility } from "./BannerHelpers/useBannerVisibility";
import { useDynamicFontSize } from "./BannerHelpers/useDynamicFontSize";
import {
    BANNER_ENABLED,
    BANNER_TEXT_LEFT,
    BANNER_TEXT_RIGHT,
    BANNER_WIDTH_PERCENT,
    BANNER_BLUR_PX,
    BANNER_BG_COLOR,
    BANNER_MASK_SOLID_STOP,
    BANNER_TEXT_COLOR,
    BANNER_FONT_FAMILY_LEFT,
    BANNER_FONT_FAMILY_RIGHT,
    BANNER_FONT_WEIGHT,
    BANNER_LETTER_SPACING,
    BANNER_TRANSITION_DURATION,
} from "@/config";

// True when this page is loaded inside an iframe (e.g. MapBackground on /form).
// Evaluated once at module level — never changes during a session.
const IS_EMBEDDED = window.self !== window.top;

/**
 * BannerPanel — a single side panel with dynamically sized text.
 */
function BannerPanel({ side, text, fontFamily, panelCssVars, hidden }) {
    const innerRef = useRef(null);
    const fontSize = useDynamicFontSize(innerRef, text, fontFamily);

    return (
        <aside
            className={`banner-panel banner-panel--${side}${hidden ? " banner-hidden" : ""}`}
            style={panelCssVars}
            aria-hidden="true"
        >
            <div className="banner-inner" ref={innerRef}>
                <span
                    className="banner-text"
                    style={{
                        fontSize,
                        fontFamily,
                        fontWeight: BANNER_FONT_WEIGHT,
                        letterSpacing: BANNER_LETTER_SPACING,
                    }}
                >
                    {text}
                </span>
            </div>
        </aside>
    );
}

/**
 * Banner — two frosted-glass side panels that frame the map.
 *
 * Props:
 *   overlayActive  boolean  — when true the banner is force-hidden
 *                             (e.g. while the StoriesOverlay is open)
 *
 * ── Console API ───────────────────────────────────────────────
 *   __banner.hide()    hide the banner permanently
 *   __banner.show()    show it again
 *   __banner.toggle()  flip current state
 *   __banner.status()  log current state
 * ─────────────────────────────────────────────────────────────
 */
export default function Banner({ overlayActive = false }) {
    const { visible } = useBannerVisibility();

    // Never show when disabled in config, or when rendered inside an iframe
    // (e.g. as the decorative background of the /form page).
    if (!BANNER_ENABLED || IS_EMBEDDED) return null;

    const panelCssVars = {
        "--banner-width": `${BANNER_WIDTH_PERCENT}%`,
        "--banner-blur": `${BANNER_BLUR_PX}px`,
        "--banner-bg": BANNER_BG_COLOR,
        "--banner-mask-stop": `${BANNER_MASK_SOLID_STOP}%`,
        "--banner-text-color": BANNER_TEXT_COLOR,
        "--banner-transition": BANNER_TRANSITION_DURATION,
    };

    const hidden = !visible || overlayActive;

    return (
        <>
            <BannerPanel
                side="left"
                text={BANNER_TEXT_LEFT}
                fontFamily={BANNER_FONT_FAMILY_LEFT}
                panelCssVars={panelCssVars}
                hidden={hidden}
            />
            <BannerPanel
                side="right"
                text={BANNER_TEXT_RIGHT}
                fontFamily={BANNER_FONT_FAMILY_RIGHT}
                panelCssVars={panelCssVars}
                hidden={hidden}
            />
        </>
    );
}
