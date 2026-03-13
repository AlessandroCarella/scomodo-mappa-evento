// color.js  –  D3 color-scale factory
import * as d3 from "d3";
import {
    schemeSet3,
    schemeSet1,
    schemeSet2,
    schemeCategory10,
    schemePastel1,
    schemePastel2,
    schemeDark2,
    schemeAccent,
    schemePaired,
    schemeTableau10,
    schemeSpectral,
    schemeRdYlBu,
    schemeRdBu,
    schemePiYG,
} from "d3-scale-chromatic";

const PALETTES = {
    Set3: schemeSet3,
    Set1: schemeSet1,
    Set2: schemeSet2,
    Category10: schemeCategory10,
    Pastel1: schemePastel1,
    Pastel2: schemePastel2,
    Dark2: schemeDark2,
    Accent: schemeAccent,
    Paired: schemePaired,
    Tableau10: schemeTableau10,
    Spectral: schemeSpectral[11],
    RdYlBu: schemeRdYlBu[11],
    RdBu: schemeRdBu[11],
    PiYG: schemePiYG[11],
};

/**
 * Returns a D3 ordinal scale for the given palette name.
 * Falls back to Set3 if the name is not recognised.
 */
export function getColorScale(paletteName) {
    const colors = PALETTES[paletteName] ?? PALETTES.Set3;
    return d3.scaleOrdinal(colors);
}
