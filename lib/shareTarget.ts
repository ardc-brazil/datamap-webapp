export type ShareTarget =
    | { kind: "email", value: string }
    | { kind: "orcid", value: string }
    | { kind: "invalid_orcid", value: string }
    | { kind: "text", value: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ORCID = /^(?:https?:\/\/orcid\.org\/)?(\d{4}-\d{4}-\d{4}-\d{3}[\dXx])$/;

// ISO 7064 mod 11-2, the same check the gatekeeper applies.
export function isValidOrcidChecksum(orcid: string): boolean {
    const digits = orcid.replace(/-/g, "").toUpperCase();
    if (!/^\d{15}[\dX]$/.test(digits)) {
        return false;
    }
    let total = 0;
    for (const c of digits.slice(0, 15)) {
        total = (total + Number(c)) * 2;
    }
    const result = (12 - (total % 11)) % 11;
    return digits[15] === (result === 10 ? "X" : String(result));
}

export function classifyShareInput(raw: string): ShareTarget {
    const value = raw.trim();
    const orcid = ORCID.exec(value);
    if (orcid) {
        const bare = orcid[1].toUpperCase();
        return isValidOrcidChecksum(bare)
            ? { kind: "orcid", value: bare }
            : { kind: "invalid_orcid", value: bare };
    }
    if (EMAIL.test(value)) {
        return { kind: "email", value: value.toLowerCase() };
    }
    return { kind: "text", value };
}
