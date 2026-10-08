import { describe, expect, test } from '@jest/globals';
import fs from "fs";
import path from "path";
import { MANUAL_CHAPTER_COUNT, MANUAL_IMAGE_DIR } from "../../contants/ManualConstants";
import { findCapturas, parseChapter, readChapters } from "../manual";
import { slugify } from "../manualSearch";

const VALID = `---
titulo: Primeiros passos
ordem: 1
resumo: O que é o DataMap.
---

Texto de abertura.

## Criar a conta

Passos.

## Entrar e sair

Mais passos.
`;

describe("parseChapter", () => {
    test("reads the header and the sections", () => {
        const chapter = parseChapter("01-primeiros-passos.mdx", VALID);

        expect(chapter.slug).toBe("primeiros-passos");
        expect(chapter.titulo).toBe("Primeiros passos");
        expect(chapter.ordem).toBe(1);
        expect(chapter.resumo).toBe("O que é o DataMap.");
        expect(chapter.secoes).toEqual([
            { id: "criar-a-conta", titulo: "Criar a conta" },
            { id: "entrar-e-sair", titulo: "Entrar e sair" },
        ]);
    });

    test.each(["titulo", "ordem", "resumo"])("rejects a chapter without %s", (field) => {
        const source = VALID.split("\n").filter((line) => !line.startsWith(`${field}:`)).join("\n");

        expect(() => parseChapter("01-primeiros-passos.mdx", source)).toThrow(field);
    });

    test("rejects a chapter without a header block", () => {
        expect(() => parseChapter("01-primeiros-passos.mdx", "Só texto.")).toThrow("cabeçalho");
    });

    test("rejects an order that disagrees with the file name", () => {
        expect(() => parseChapter("02-primeiros-passos.mdx", VALID)).toThrow("ordem");
    });

    test("ignores headings inside code fences", () => {
        const source = VALID + "\n```\n## Não é seção\n```\n";

        expect(parseChapter("01-primeiros-passos.mdx", source).secoes).toHaveLength(2);
    });
});

describe("slugify", () => {
    test("drops accents and punctuation", () => {
        expect(slugify("Citação e DOI")).toBe("citacao-e-doi");
        expect(slugify("Envio e download de arquivos!")).toBe("envio-e-download-de-arquivos");
    });
});

describe("findCapturas", () => {
    test("returns the name and the alt of each capture", () => {
        const source = `<Captura nome="a" alt="Tela A" />\n\n<Captura nome="b" alt="Tela B" legenda="x" />`;

        expect(findCapturas(source)).toEqual([
            { nome: "a", alt: "Tela A" },
            { nome: "b", alt: "Tela B" },
        ]);
    });

    test("reports a capture without alt as empty", () => {
        expect(findCapturas(`<Captura nome="a" />`)).toEqual([{ nome: "a", alt: "" }]);
    });
});

describe("the chapters in content/manual", () => {
    const chapters = readChapters();

    test("are all there, in order", () => {
        expect(chapters.map((chapter) => chapter.ordem)).toEqual(
            Array.from({ length: MANUAL_CHAPTER_COUNT }, (_, index) => index + 1)
        );
    });

    test("have unique slugs", () => {
        expect(new Set(chapters.map((chapter) => chapter.slug)).size).toBe(chapters.length);
    });

    test("point every Captura to an image that exists", () => {
        const missing = chapters.flatMap((chapter) =>
            findCapturas(chapter.source)
                .filter(({ nome }) => !fs.existsSync(path.join(process.cwd(), MANUAL_IMAGE_DIR, `${nome}.png`)))
                .map(({ nome }) => `${chapter.slug}: ${nome}.png`)
        );

        expect(missing).toEqual([]);
    });

    test("never leave a Captura with an empty alt", () => {
        const empty = chapters.flatMap((chapter) =>
            findCapturas(chapter.source)
                .filter(({ alt }) => alt.trim() === "")
                .map(({ nome }) => `${chapter.slug}: ${nome}`)
        );

        expect(empty).toEqual([]);
    });
});
