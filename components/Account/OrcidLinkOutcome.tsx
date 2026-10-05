import { ORCID_LINK_OUTCOMES, OrcidLinkOutcomeKind } from "../../contants/AccountConstants";

function isOutcome(value: unknown): value is OrcidLinkOutcomeKind {
    return typeof value === "string" && Object.prototype.hasOwnProperty.call(ORCID_LINK_OUTCOMES, value);
}

/** What happened after "Connect ORCID", read from the query string the sign-in came back with. */
export function OrcidLinkOutcome(props: { outcome?: string | string[] }) {
    if (!isOutcome(props.outcome)) {
        return null;
    }
    const { message, role } = ORCID_LINK_OUTCOMES[props.outcome];
    const tone = role === "alert" ? "text-danger-700" : "text-primary-900";
    return (
        <p role={role} className={`m-0 border-b border-primary-100 px-4 py-3 text-sm font-semibold ${tone}`}>
            {message}
        </p>
    );
}
