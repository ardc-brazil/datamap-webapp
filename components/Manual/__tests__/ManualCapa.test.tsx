/**
 * @jest-environment jsdom
 */
import { describe, expect, test } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { ManualCapa } from "../ManualCapa";

const chapters = [
    { slug: "primeiros-passos", titulo: "Primeiros passos", ordem: 1, resumo: "", secoes: [] },
    { slug: "embargo", titulo: "Embargo", ordem: 8, resumo: "", secoes: [] },
];

describe("ManualCapa", () => {
    test("shows the title, the date, the short commit and the address of the guide", () => {
        render(<ManualCapa chapters={chapters} date="8 de outubro de 2026" commit="a1b2c3d" />);

        expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Guia do usuário");
        expect(screen.getByText(/8 de outubro de 2026/)).toBeTruthy();
        expect(screen.getByText(/a1b2c3d/)).toBeTruthy();
        expect(screen.getByText("https://datamap.pcs.usp.br/manual")).toBeTruthy();
    });

    test("links each chapter in the index to its place in the document, with no page numbers", () => {
        render(<ManualCapa chapters={chapters} date="8 de outubro de 2026" commit="a1b2c3d" />);

        const link = screen.getByRole("link", { name: /Embargo/ });
        expect(link.getAttribute("href")).toBe("#capitulo-embargo");
        expect(screen.getAllByRole("link")).toHaveLength(2);
    });
});
