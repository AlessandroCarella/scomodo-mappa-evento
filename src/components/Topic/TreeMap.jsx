import React, { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

import ChartTitle from "./ChartTitle";
import {
    useSelection,
    useSelectKeyword,
} from "../../pages/Topic/store/selectionStore";
import {
    flattenForTreemap,
    transformData,
} from "../../pages/Topic/utils/dataTransform";
import { getColorScale } from "../../pages/Topic/utils/color";
import {
    CHART_WIDTH,
    CHART_HEIGHT,
    TREEMAP_PADDING_INNER,
    TREEMAP_PADDING_OUTER,
    TREEMAP_MIN_RECT_W,
    TREEMAP_MIN_RECT_H,
    TREEMAP_MULTILINE_H,
    TREEMAP_MAX_CHARS,
    TREEMAP_FONT_AREA_DIV,
    TREEMAP_FONT_MAX,
    TREEMAP_FONT_MIN,
    TREEMAP_CHAR_W_RATIO,
    ZOOM_SCALE_MIN,
    ZOOM_SCALE_MAX,
    HIGHLIGHT_STROKE_COLOR,
    HIGHLIGHT_STROKE_WIDTH,
    HOVER_STROKE_COLOR,
    HOVER_STROKE_WIDTH,
    TOOLTIP_OFFSET_X,
    TOOLTIP_OFFSET_Y,
} from "../../pages/Topic/config";

import styles from "./styles/TreeMap.module.css";

function calcFontSize(d) {
    const w = d.x1 - d.x0;
    const h = d.y1 - d.y0;
    return Math.min(
        Math.max(Math.sqrt(w * h) / TREEMAP_FONT_AREA_DIV, TREEMAP_FONT_MIN),
        TREEMAP_FONT_MAX,
    );
}

function textFits(text, d, fontSize) {
    const w = d.x1 - d.x0;
    const h = d.y1 - d.y0;
    return (
        text.length * fontSize * TREEMAP_CHAR_W_RATIO < w - 8 &&
        fontSize < h - 8
    );
}

export default function TreeMap({ data, maxTopics = 5, palette = "Set3" }) {
    const svgRef = useRef(null);
    const zoomRef = useRef(null);
    const leavesRef = useRef(null);
    const colorRef = useRef(null);
    const tooltipRef = useRef(null);

    const { selectedKeyword } = useSelection();
    const { selectKeyword } = useSelectKeyword();

    // ── full D3 rebuild ───────────────────────────────────────────────────────
    useEffect(() => {
        if (!data || !svgRef.current) return;

        const nested = transformData(data, maxTopics);
        const flat = flattenForTreemap(nested);
        const colorScale = getColorScale(palette);
        colorRef.current = colorScale;

        const svgEl = d3.select(svgRef.current);
        svgEl.selectAll("*").remove();

        const treemap = d3
            .treemap()
            .size([CHART_WIDTH, CHART_HEIGHT])
            .paddingInner(TREEMAP_PADDING_INNER)
            .paddingOuter(TREEMAP_PADDING_OUTER)
            .round(true);

        const root = d3
            .hierarchy(flat)
            .sum((d) => d.value ?? 0)
            .sort((a, b) => b.value - a.value);

        treemap(root);

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
        svg.call(zoom.transform, d3.zoomIdentity.scale(1));

        const tooltip = d3.select(tooltipRef.current);

        const leaf = container
            .selectAll("g")
            .data(root.leaves())
            .join("g")
            .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

        leavesRef.current = leaf;

        leaf.append("rect")
            .attr("width", (d) => d.x1 - d.x0)
            .attr("height", (d) => d.y1 - d.y0)
            .attr("class", styles.nodeKeyword)
            .style("fill", (d) => colorScale(d.data.topic))
            .style("stroke", "#fff")
            .style("stroke-width", "2px")
            .style("cursor", "pointer")
            .on("mouseover", function (event, d) {
                const fs = calcFontSize(d);
                const tip = !textFits(d.data.name, d, fs)
                    ? `<strong>${d.data.originalName}</strong><br/>Topic: ${d.data.topic}`
                    : `<strong>${d.data.name}</strong><br/>Risposte: ${d.value}<br/>Topic: ${d.data.topic}`;

                tooltip
                    .html(tip)
                    .style("opacity", 1)
                    .style("left", `${event.pageX + TOOLTIP_OFFSET_X}px`)
                    .style("top", `${event.pageY + TOOLTIP_OFFSET_Y}px`);

                const isSel =
                    selectedKeyword?.name === d.data.name &&
                    selectedKeyword?.topic === d.data.topic;
                if (!isSel)
                    d3.select(this)
                        .style("stroke", HOVER_STROKE_COLOR)
                        .style("stroke-width", `${HOVER_STROKE_WIDTH}px`);
            })
            .on("mouseout", function (event, d) {
                tooltip.style("opacity", 0);
                const isSel =
                    selectedKeyword?.name === d.data.name &&
                    selectedKeyword?.topic === d.data.topic;
                if (!isSel)
                    d3.select(this)
                        .style("stroke", "#fff")
                        .style("stroke-width", "2px");
            })
            .on("click", (event, d) => {
                event.stopPropagation();
                selectKeyword(d.data);
            });

        leaf.each(function (d) {
            const g = d3.select(this);
            const w = d.x1 - d.x0;
            const h = d.y1 - d.y0;
            const fs = calcFontSize(d);

            if (w < TREEMAP_MIN_RECT_W || h < TREEMAP_MIN_RECT_H) return;

            const text = g
                .append("text")
                .attr("class", styles.labelKeyword)
                .attr("x", w / 2)
                .attr("y", h / 2)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .style("font-size", `${fs}px`)
                .style("pointer-events", "none");

            const words = d.data.name.split(/\s+/);
            if (
                words.length > 1 &&
                h > TREEMAP_MULTILINE_H &&
                textFits(d.data.name, d, fs)
            ) {
                words.forEach((word, i) => {
                    text.append("tspan")
                        .attr("x", w / 2)
                        .attr("dy", i === 0 ? 0 : "1.1em")
                        .text(
                            word.length > TREEMAP_MAX_CHARS
                                ? word.slice(0, TREEMAP_MAX_CHARS) + "…"
                                : word,
                        );
                });
            } else {
                const maxChars = Math.floor(w / (fs * TREEMAP_CHAR_W_RATIO));
                text.text(
                    d.data.name.length > maxChars
                        ? d.data.name.slice(0, maxChars - 3) + "…"
                        : d.data.name,
                );
            }
        });
    }, [data, maxTopics, palette, selectKeyword]);

    // ── highlight sync ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!leavesRef.current) return;

        leavesRef.current
            .selectAll("rect")
            .classed(styles.selected, false)
            .style("stroke", "#fff")
            .style("stroke-width", "2px");

        if (!selectedKeyword) return;

        leavesRef.current
            .filter(
                (d) =>
                    d.data.name === selectedKeyword.name &&
                    d.data.topic === selectedKeyword.topic,
            )
            .select("rect")
            .classed(styles.selected, true)
            .style("stroke", HIGHLIGHT_STROKE_COLOR)
            .style("stroke-width", `${HIGHLIGHT_STROKE_WIDTH}px`);
    }, [selectedKeyword]);

    const resetZoom = useCallback(() => {
        if (!svgRef.current || !zoomRef.current) return;
        d3.select(svgRef.current)
            .transition()
            .duration(750)
            .call(zoomRef.current.transform, d3.zoomIdentity.scale(1));
    }, []);

    return (
        <div className={styles.wrapper}>
            <ChartTitle title="Treemap" />
            <div className={styles.chartFrame}>
                <svg ref={svgRef} className={styles.svg} />
            </div>
            <div ref={tooltipRef} className={styles.tooltip} />
        </div>
    );
}
