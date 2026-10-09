import { describe, expect, test } from '@jest/globals';
import { buildSearchIndex, searchManual } from "../manualSearch";

const chapters = [
    {
        slug: "embargo", titulo: "Embargo", ordem: 8, resumo: "Quem acessa o quê.",
        secoes: [{ id: "estender-o-embargo", titulo: "Estender o embargo" }],
    },
    {
        slug: "citacao-e-doi", titulo: "Citação e DOI", ordem: 7, resumo: "DOI automático e manual.",
        secoes: [{ id: "estados-do-doi", titulo: "Estados do DOI" }],
    },
];

const index = buildSearchIndex(chapters);

describe("buildSearchIndex", () => {
    test("has one entry per chapter and per section", () => {
        expect(index).toHaveLength(4);
    });

    test("links a section to its anchor", () => {
        expect(index.find((entry) => entry.titulo === "Estados do DOI")?.href).toBe("/manual/citacao-e-doi#estados-do-doi");
    });
});

describe("searchManual", () => {
    test("finds a section by words in its title", () => {
        expect(searchManual(index, "estender").map((entry) => entry.titulo)).toEqual(["Estender o embargo"]);
    });

    test("ignores case and accents", () => {
        expect(searchManual(index, "CITACAO")[0].href).toBe("/manual/citacao-e-doi");
    });

    test("puts chapters before sections when both match", () => {
        expect(searchManual(index, "embargo").map((entry) => entry.titulo)).toEqual(["Embargo", "Estender o embargo"]);
    });

    test("returns nothing for a blank or unknown query", () => {
        expect(searchManual(index, "  ")).toEqual([]);
        expect(searchManual(index, "zzz")).toEqual([]);
    });
});
