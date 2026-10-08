/**
 * @jest-environment jsdom
 */
import { describe, expect, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import { ManualBusca } from "../ManualBusca";

const index = [
    { href: "/manual/embargo", capitulo: "Embargo", titulo: "Embargo", texto: "embargo" },
    { href: "/manual/embargo#estender-o-embargo", capitulo: "Embargo", titulo: "Estender o embargo", texto: "estender o embargo" },
];

describe("ManualBusca", () => {
    test("lists matches as links while typing", () => {
        render(<ManualBusca index={index} />);

        fireEvent.change(screen.getByRole("searchbox"), { target: { value: "estender" } });

        const link = screen.getByRole("link", { name: /Estender o embargo/ });
        expect(link.getAttribute("href")).toBe("/manual/embargo#estender-o-embargo");
    });

    test("says when nothing matches", () => {
        render(<ManualBusca index={index} />);

        fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzz" } });

        expect(screen.getByText("Nada encontrado.")).toBeTruthy();
    });
});
