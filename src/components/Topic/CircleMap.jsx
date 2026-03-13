import React, { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

import ChartTitle from "./ChartTitle";
import {
    useSelection,
    useSelectKeyword,
} from "../../pages/Topic/store/selectionStore.jsx";
import { transformData } from "../../pages/Topic/utils/dataTransform";
import { getColorScale } from "../../pages/Topic/utils/color";
import {
    CHART_WIDTH,
    CHART_HEIGHT,
    PACK_PADDING,
    PACK_OUTER_PADDING,
    ZOOM_SCALE_MIN,
    ZOOM_SCALE_MAX,
    LABEL_MIN_FONT_SIZE,
    LABEL_MAX_FONT_SIZE,
    HIGHLIGHT_STROKE_COLOR,
    HIGHLIGHT_STROKE_WIDTH,
    DEFAULT_KEYWORD_STROKE_WIDTH,
    TOOLTIP_OFFSET_X,
    TOOLTIP_OFFSET_Y,
} from "../../pages/Topic/config.js";

import styles from "./styles/CircleMap.module.css";

export default function CircleMap({ data, maxTopics = 5, palette = "Set3" }) {
    const svgRef = useRef(null);
    const zoomRef = useRef(null);
    const nodesRef = useRef(null);
    const colorRef = useRef(null);
    const tooltipRef = useRef(null);

    const { selectedKeyword } = useSelection();
    const { selectKeyword } = useSelectKeyword();

    // ── full D3 rebuild ───────────────────────────────────────────────────────
    useEffect(() => {
        if (!data || !svgRef.current) return;

        const hierarchical = transformData(data, maxTopics);
        const colorScale = getColorScale(palette);
        colorRef.current = colorScale;

        const svgEl = d3.select(svgRef.current);
        svgEl.selectAll("*").remove();

        const pack = d3
            .pack()
            .size([CHART_WIDTH - 2, CHART_HEIGHT - 2])
            .padding(PACK_PADDING);

        const root = d3
            .hierarchy(hierarchical)
            .sum((d) => d.value)
            .sort((a, b) => b.value - a.value);

        pack(root);

        const svg = svgEl
            .attr("width", CHART_WIDTH)
            .attr("height", CHART_HEIGHT)
            .attr("viewBox", `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`);

        const container = svg.append("g");

        const zoom = d3
            .zoom()
            .scaleExtent([ZOOM_SCALE_MIN, ZOOM_SCALE_MAX])
            .on("zoom", (event) =>
                container.attr("transform", event.transform),
            );

        svg.call(zoom);
        zoomRef.current = zoom;

        // fit initial view
        const rootR = root.r;
        const pad = PACK_OUTER_PADDING;
        const scale = Math.min(
            (CHART_WIDTH - pad) / (rootR * 2),
            (CHART_HEIGHT - pad) / (rootR * 2),
        );
        const initScale = Math.min(scale, 1);
        const tx = (CHART_WIDTH - rootR * 2 * initScale) / 2;
        const ty = (CHART_HEIGHT - rootR * 2 * initScale) / 2;
        svg.call(
            zoom.transform,
            d3.zoomIdentity.translate(tx, ty).scale(initScale),
        );

        const tooltip = d3.select(tooltipRef.current);

        const node = container
            .selectAll("g")
            .data(root.descendants())
            .join("g")
            .attr("transform", (d) => `translate(${d.x},${d.y})`);

        nodesRef.current = node;

        node.append("circle")
            .attr("r", (d) => d.r)
            .attr("class", (d) => {
                if (d.depth === 0) return styles.nodeRoot;
                if (d.depth === 1) return styles.nodeTopic;
                return styles.nodeKeyword;
            })
            .style("fill", (d) => {
                if (d.depth === 0) return "none";
                if (d.depth === 1) return colorScale(d.data.name);
                return d3.color(colorScale(d.parent.data.name)).darker(1);
            })
            .style("stroke", (d) => {
                if (d.depth === 0) return "none";
                if (d.depth === 1)
                    return d3.color(colorScale(d.data.name)).darker(1.5);
                return d3.color(colorScale(d.parent.data.name)).darker(2);
            })
            .style("stroke-width", `${DEFAULT_KEYWORD_STROKE_WIDTH}px`)
            .on("mouseover", (event, d) => {
                if (d.depth === 1) {
                    tooltip
                        .html(`<strong>${d.data.name}</strong>`)
                        .style("opacity", 1)
                        .style("left", `${event.pageX + TOOLTIP_OFFSET_X}px`)
                        .style("top", `${event.pageY + TOOLTIP_OFFSET_Y}px`);
                } else if (d.depth === 2) {
                    tooltip
                        .html(
                            `<strong>${d.data.name}</strong><br/>Risposte: ${d.value}<br/>Topic: ${d.parent.data.name}`,
                        )
                        .style("opacity", 1)
                        .style("left", `${event.pageX + TOOLTIP_OFFSET_X}px`)
                        .style("top", `${event.pageY + TOOLTIP_OFFSET_Y}px`);
                }
            })
            .on("mouseout", () => tooltip.style("opacity", 0))
            .on("click", (event, d) => {
                if (d.depth === 2) {
                    event.stopPropagation();
                    selectKeyword(d);
                }
            });

        // keyword labels
        node.filter((d) => d.depth === 2).each(function (d) {
            const g = d3.select(this);
            const fontSize = Math.max(
                Math.min(d.r / 3, LABEL_MAX_FONT_SIZE),
                LABEL_MIN_FONT_SIZE,
            );
            const maxLen = Math.floor(d.r / 5);
            const truncated = d.data.name.length > maxLen;
            const display = truncated
                ? d.data.name.slice(0, maxLen) + "…"
                : d.data.name;

            const text = g
                .append("text")
                .attr("class", styles.labelKeyword)
                .style("font-size", `${fontSize}px`);

            const words = d.data.name.split(/\s+/);
            if (words.length > 1 && d.r > 25 && !truncated) {
                text.text(null);
                words.forEach((w, i) => {
                    text.append("tspan")
                        .attr("x", 0)
                        .attr("dy", i === 0 ? "0.35em" : "1.1em")
                        .text(w.length > 8 ? w.slice(0, 8) + "…" : w);
                });
            } else {
                text.text(display);
            }
        });
    }, [data, maxTopics, palette, selectKeyword]);

    // ── highlight sync (no full redraw) ──────────────────────────────────────
    useEffect(() => {
        if (!nodesRef.current || !colorRef.current) return;
        const colorScale = colorRef.current;

        nodesRef.current
            .selectAll("circle")
            .filter((d) => d.depth === 2)
            .classed(styles.selected, false)
            .style("stroke", (d) =>
                d3.color(colorScale(d.parent.data.name)).darker(2),
            )
            .style("stroke-width", `${DEFAULT_KEYWORD_STROKE_WIDTH}px`);

        if (!selectedKeyword) return;

        nodesRef.current
            .filter(
                (d) =>
                    d.depth === 2 &&
                    d.data.name === selectedKeyword.name &&
                    d.parent.data.name === selectedKeyword.topic,
            )
            .select("circle")
            .classed(styles.selected, true)
            .style("stroke", HIGHLIGHT_STROKE_COLOR)
            .style("stroke-width", `${HIGHLIGHT_STROKE_WIDTH}px`);
    }, [selectedKeyword]);

    const resetZoom = useCallback(() => {
        if (!svgRef.current || !zoomRef.current) return;
        const svgEl = d3.select(svgRef.current);
        const bounds = svgEl.select("g").node()?.getBBox();
        if (!bounds?.width) return;
        const pad = PACK_OUTER_PADDING;
        const scale = Math.min(
            (CHART_WIDTH - pad) / bounds.width,
            (CHART_HEIGHT - pad) / bounds.height,
        );
        const initScale = Math.min(scale, 1);
        const tx =
            (CHART_WIDTH - bounds.width * initScale) / 2 - bounds.x * initScale;
        const ty =
            (CHART_HEIGHT - bounds.height * initScale) / 2 -
            bounds.y * initScale;
        svgEl
            .transition()
            .duration(750)
            .call(
                zoomRef.current.transform,
                d3.zoomIdentity.translate(tx, ty).scale(initScale),
            );
    }, []);

    return (
        <div className={styles.wrapper}>
            <ChartTitle title="Raggruppamento per topics" />
            <div className={styles.chartFrame}>
                <svg ref={svgRef} className={styles.svg} />
            </div>
            <div ref={tooltipRef} className={styles.tooltip} />
        </div>
    );
}
