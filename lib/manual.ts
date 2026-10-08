import fs from "fs";
import path from "path";
import { MANUAL_CONTENT_DIR } from "../contants/ManualConstants";
import { ManualChapter, ManualSection, slugify } from "./manualSearch";

export interface ManualChapterSource extends ManualChapter {
    arquivo: string;
    source: string;
}

const FILE_NAME = /^(\d{2})-(.+)\.mdx$/;
const HEADER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function readHeader(file: string, source: string): Record<string, string> {
    const block = HEADER.exec(source);
    if (!block) {
        throw new Error(`${file}: falta o cabeçalho (titulo, ordem, resumo)`);
    }
    const fields: Record<string, string> = {};
    for (const line of block[1].split(/\r?\n/)) {
        const separator = line.indexOf(":");
        if (separator > 0) {
            fields[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
        }
    }
    return fields;
}

function readSections(source: string): ManualSection[] {
    const sections: ManualSection[] = [];
    let fenced = false;
    for (const line of source.replace(HEADER, "").split(/\r?\n/)) {
        if (line.startsWith("```")) {
            fenced = !fenced;
            continue;
        }
        const heading = !fenced && /^## (.+)$/.exec(line);
        if (heading) {
            const titulo = heading[1].replace(/[*`]/g, "").trim();
            sections.push({ id: slugify(titulo), titulo });
        }
    }
    return sections;
}

export function parseChapter(file: string, source: string): ManualChapterSource {
    const name = FILE_NAME.exec(file);
    if (!name) {
        throw new Error(`${file}: o nome deve ser NN-<slug>.mdx`);
    }
    const header = readHeader(file, source);
    for (const field of ["titulo", "ordem", "resumo"]) {
        if (!header[field]) {
            throw new Error(`${file}: falta ${field} no cabeçalho`);
        }
    }
    const ordem = Number(header.ordem);
    if (ordem !== Number(name[1])) {
        throw new Error(`${file}: a ordem (${header.ordem}) não bate com o número do arquivo`);
    }
    return {
        arquivo: file.replace(/\.mdx$/, ""),
        slug: name[2],
        titulo: header.titulo,
        ordem,
        resumo: header.resumo,
        secoes: readSections(source),
        source,
    };
}

export function readChapters(dir: string = path.join(process.cwd(), MANUAL_CONTENT_DIR)): ManualChapterSource[] {
    return fs
        .readdirSync(dir)
        .filter((file) => FILE_NAME.test(file))
        .sort()
        .map((file) => parseChapter(file, fs.readFileSync(path.join(dir, file), "utf8")));
}

export function toChapter({ slug, titulo, ordem, resumo, secoes }: ManualChapterSource): ManualChapter {
    return { slug, titulo, ordem, resumo, secoes };
}

export function findCapturas(source: string): { nome: string; alt: string }[] {
    return Array.from(source.matchAll(/<Captura\b([^>]*?)\/?>/g), ([, attributes]) => ({
        nome: /\bnome="([^"]*)"/.exec(attributes)?.[1] ?? "",
        alt: /\balt="([^"]*)"/.exec(attributes)?.[1] ?? "",
    }));
}
