/**
 * @jest-environment jsdom
 */
import { describe, expect, test } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { Captura } from "../Captura";

describe("Captura", () => {
    test("shows the image inside a figure with its caption", () => {
        render(<Captura nome="cadastro-formulario" alt="Formulário de cadastro" legenda="O formulário de cadastro." />);

        const image = screen.getByRole("img", { name: "Formulário de cadastro" });
        expect(image.getAttribute("src")).toBe("/manual/img/cadastro-formulario.png");
        expect(screen.getByText("O formulário de cadastro.").tagName).toBe("FIGCAPTION");
    });

    test("refuses an empty alt", () => {
        expect(() => render(<Captura nome="cadastro-formulario" alt=" " />)).toThrow("alt");
    });
});
