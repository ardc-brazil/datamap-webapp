import { describe, expect, test } from '@jest/globals';
import { classifyShareInput, isValidOrcidChecksum } from "../shareTarget";

describe('isValidOrcidChecksum', () => {
    test.each([
        "0000-0002-1825-0097",
        "0000-0001-5109-3700",
        "0000-0002-6356-145X",
        "0000-0002-1694-233X",
    ])('%s is valid', (orcid) => {
        expect(isValidOrcidChecksum(orcid)).toBe(true);
    });

    test('a wrong check digit is invalid', () => {
        expect(isValidOrcidChecksum("0000-0002-1825-0098")).toBe(false);
    });

    test('anything that is not 16 characters of digits is invalid', () => {
        expect(isValidOrcidChecksum("0000-0002-1825")).toBe(false);
    });
});

describe('classifyShareInput', () => {
    test('a bare ORCID', () => {
        expect(classifyShareInput("0000-0002-1825-0097")).toEqual({ kind: "orcid", value: "0000-0002-1825-0097" });
    });

    test('an ORCID URL becomes the bare form', () => {
        expect(classifyShareInput(" https://orcid.org/0000-0002-6356-145x ")).toEqual({ kind: "orcid", value: "0000-0002-6356-145X" });
    });

    test('a mistyped ORCID is recognised as an invalid ORCID, not as text', () => {
        expect(classifyShareInput("0000-0002-1825-0098")).toEqual({ kind: "invalid_orcid", value: "0000-0002-1825-0098" });
    });

    test('an email', () => {
        expect(classifyShareInput("Ana.Souza@USP.br")).toEqual({ kind: "email", value: "ana.souza@usp.br" });
    });

    test('anything else is text to search with', () => {
        expect(classifyShareInput("ana sou")).toEqual({ kind: "text", value: "ana sou" });
        expect(classifyShareInput("ana@")).toEqual({ kind: "text", value: "ana@" });
    });
});
