import { useEffect, useState } from "react";
import { MaterialSymbol } from "react-material-symbols";
import { SHARE_PERSON_DETAIL_CLASS, SHARE_PERSON_NAME_CLASS } from "../../contants/ShareConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import { useDebouncedValue } from "../../hooks/UseDebouncedValue";
import { classifyShareInput } from "../../lib/shareTarget";
import { GrantRequest, PermissionLevel, ShareUser } from "../../types/GatekeeperAPI";
import { PersonInitial } from "./PersonInitial";

interface Props {
    datasetId: string
    tenancyName: string
    onGrant(request: GrantRequest): Promise<void>
}

function Highlighted(props: { name: string, typed: string }) {
    const start = props.name.toLowerCase().indexOf(props.typed.toLowerCase());
    if (start < 0 || !props.typed) {
        return <>{props.name}</>;
    }
    const end = start + props.typed.length;
    return <>{props.name.slice(0, start)}<strong className="font-bold">{props.name.slice(start, end)}</strong>{props.name.slice(end)}</>;
}

export function ShareInput(props: Props) {
    const [bffGateway] = useState(() => new BFFAPI());
    const [text, setText] = useState("");
    const [level, setLevel] = useState<PermissionLevel>("read");
    const [suggestions, setSuggestions] = useState<ShareUser[]>([]);
    const debounced = useDebouncedValue(text, 300);
    const target = classifyShareInput(text);

    useEffect(() => {
        const settled = classifyShareInput(debounced);
        if (settled.kind !== "text" || settled.value.length < 2) {
            setSuggestions([]);
            return;
        }
        let cancelled = false;
        bffGateway.searchShareCandidates(props.datasetId, settled.value)
            .then((users) => { if (!cancelled) setSuggestions(users); })
            .catch(() => { if (!cancelled) setSuggestions([]); });
        return () => { cancelled = true; };
    }, [debounced, props.datasetId, bffGateway]);

    async function grant(request: GrantRequest) {
        await props.onGrant(request);
        setText("");
        setSuggestions([]);
    }

    const panel = "mt-1.5 w-full max-w-[460px] rounded-lg border border-primary-200 bg-primary-0 shadow-lg shadow-primary-900/10 overflow-hidden";
    const option = "grid grid-cols-[32px_minmax(0,1fr)] gap-3 items-center w-full px-3.5 py-2.5 text-left hover:bg-primary-100";

    return (
        <div className="relative">
            <div className="flex gap-2">
                <div className={`flex flex-1 items-center gap-2.5 h-11 px-3.5 rounded-md border bg-primary-0 ${text ? "border-primary-900" : "border-primary-300"}`}>
                    <MaterialSymbol icon="person_add" size={20} grade={-25} weight={400} className="text-primary-400" />
                    <input
                        aria-label="Add people by name, email or ORCID"
                        type="text"
                        autoComplete="off"
                        className="w-full h-full p-0 border-0 bg-transparent text-sm text-primary-900 placeholder:text-primary-400 focus:outline-none focus:ring-0"
                        placeholder="Add people by name, email or ORCID"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                </div>
                <select
                    aria-label="Access level"
                    className="h-11 w-auto flex-none rounded-md border border-primary-300 bg-primary-0 pl-3 pr-8 text-sm font-medium text-primary-900"
                    value={level}
                    onChange={(e) => setLevel(e.target.value as PermissionLevel)}
                >
                    <option value="read">Can read</option>
                    <option value="write">Can write</option>
                </select>
            </div>

            {target.kind === "invalid_orcid" &&
                <div role="alert" className="mt-1.5 grid grid-cols-[32px_minmax(0,1fr)] gap-3 items-center max-w-[460px] rounded-lg border border-danger-200 bg-danger-50 px-3.5 py-2.5">
                    <MaterialSymbol icon="error" size={18} grade={-25} weight={400} className="justify-self-center text-danger-700" />
                    <span className="flex flex-col">
                        <span className="text-sm font-medium text-danger-700">{target.value} isn&apos;t a valid ORCID</span>
                        <span className="text-xs text-danger-800">The last digit doesn&apos;t check out. Compare it with the person&apos;s ORCID page.</span>
                    </span>
                </div>
            }

            {(target.kind === "email" || target.kind === "orcid") &&
                <div className={panel}>
                    <button
                        type="button"
                        className={option}
                        onClick={() => grant(target.kind === "email" ? { email: target.value, level } : { orcid: target.value, level })}
                    >
                        <PersonInitial pendingIcon={target.kind === "email" ? "mail" : "badge"} />
                        <span className="flex flex-col min-w-0">
                            <span className={SHARE_PERSON_NAME_CLASS}>Invite {target.kind === "email" ? target.value : `ORCID ${target.value}`}</span>
                            <span className={SHARE_PERSON_DETAIL_CLASS}>
                                {target.kind === "email"
                                    ? "If they have no account yet, they'll get an email with a link"
                                    : "If no account has this ORCID, you'll get a link to send them"}
                            </span>
                        </span>
                    </button>
                </div>
            }

            {target.kind === "text" && suggestions.length > 0 &&
                <div className={panel}>
                    <ul className="m-0 p-0 list-none">
                        {suggestions.map((user) => (
                            <li key={user.id}>
                                <button type="button" aria-label={`${user.name} ${user.email}`} className={option} onClick={() => grant({ user_id: user.id, level })}>
                                    <PersonInitial name={user.name} />
                                    <span className="flex flex-col min-w-0">
                                        <span className={SHARE_PERSON_NAME_CLASS}><Highlighted name={user.name} typed={text.trim()} /></span>
                                        <span className={SHARE_PERSON_DETAIL_CLASS}>{user.email}</span>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    <p className="m-0 px-3.5 py-2 border-t border-primary-100 text-xs text-primary-500">
                        Someone outside {props.tenancyName}? Type their full email or ORCID.
                    </p>
                </div>
            }
        </div>
    );
}
