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

/**
 * BannerPanel — a single side panel with dynamically sized text.
 *
 * Font size is computed so that the longest word in `text` fills
 * BANNER_FONT_FILL_RATIO of the panel's inner width.
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
 * ── Console API ───────────────────────────────────────────────
 *   __banner.hide()    hide the banner permanently
 *   __banner.show()    show it again
 *   __banner.toggle()  flip current state
 *   __banner.status()  log current state
 * ─────────────────────────────────────────────────────────────
 */
export default function Banner() {
    const { visible } = useBannerVisibility();

    if (!BANNER_ENABLED) return null;

    const panelCssVars = {
        "--banner-width": `${BANNER_WIDTH_PERCENT}%`,
        "--banner-blur": `${BANNER_BLUR_PX}px`,
        "--banner-bg": BANNER_BG_COLOR,
        "--banner-mask-stop": `${BANNER_MASK_SOLID_STOP}%`,
        "--banner-text-color": BANNER_TEXT_COLOR,
        "--banner-transition": BANNER_TRANSITION_DURATION,
    };

    return (
        <>
            <BannerPanel
                side="left"
                text={BANNER_TEXT_LEFT}
                fontFamily={BANNER_FONT_FAMILY_LEFT}
                panelCssVars={panelCssVars}
                hidden={!visible}
            />
            <BannerPanel
                side="right"
                text={BANNER_TEXT_RIGHT}
                fontFamily={BANNER_FONT_FAMILY_RIGHT}
                panelCssVars={panelCssVars}
                hidden={!visible}
            />
        </>
    );
}
