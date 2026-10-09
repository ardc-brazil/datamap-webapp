import { MANUAL_ROUTE } from "../contants/ManualConstants";

export interface ManualSection {
    id: string;
    titulo: string;
}

export interface ManualChapter {
    slug: string;
    titulo: string;
    ordem: number;
    resumo: string;
    secoes: ManualSection[];
}

export interface SearchEntry {
    href: string;
    capitulo: string;
    titulo: string;
    texto: string;
}

export function normalize(text: string): string {
    return text
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase();
}

export function slugify(text: string): string {
    return normalize(text)
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function buildSearchIndex(chapters: ManualChapter[]): SearchEntry[] {
    return [...chapters]
        .sort((a, b) => a.ordem - b.ordem)
        .flatMap((chapter) => [
            {
                href: `${MANUAL_ROUTE}/${chapter.slug}`,
                capitulo: chapter.titulo,
                titulo: chapter.titulo,
                texto: normalize(`${chapter.titulo} ${chapter.resumo}`),
            },
            ...chapter.secoes.map((section) => ({
                href: `${MANUAL_ROUTE}/${chapter.slug}#${section.id}`,
                capitulo: chapter.titulo,
                titulo: section.titulo,
                texto: normalize(section.titulo),
            })),
        ]);
}

export function searchManual(index: SearchEntry[], query: string): SearchEntry[] {
    const words = normalize(query).split(/\s+/).filter(Boolean);
    if (words.length === 0) {
        return [];
    }
    const matches = index.filter((entry) => words.every((word) => entry.texto.includes(word)));
    const isChapter = (entry: SearchEntry) => !entry.href.includes("#");

    return [...matches.filter(isChapter), ...matches.filter((entry) => !isChapter(entry))];
}
