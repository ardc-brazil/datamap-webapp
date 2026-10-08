import { useSession } from "next-auth/react";
import { useState } from "react";
import { MaterialSymbol } from "react-material-symbols";
import useSWR from "swr";
import { initialsOf } from "../../lib/embargoDisplay";
import { fetcher } from "../../lib/fetcher";
import { GetDatasetDetailsResponse } from "../../types/BffAPI";
import { ShareState } from "../../types/GatekeeperAPI";
import { ShareDialog } from "../Share/ShareDialog";

export function AccessCard(props: { dataset: GetDatasetDetailsResponse }) {
    const [show, setShow] = useState(false);
    const session = useSession();
    const canShare = props.dataset.access?.can_share === true;
    const { data } = useSWR(canShare ? `/api/datasets/${props.dataset.id}/share` : null, fetcher);
    const state = data as ShareState;

    if (!canShare || !state) {
        return null;
    }

    const me = (session?.data?.user as any)?.uid;
    const people = [state.owner, ...state.permissions.map((permission) => permission.user)];
    const others = people.filter((person) => person.id !== me).length;
    const pending = state.invitations.filter((invitation) => !invitation.accepted_at && !invitation.revoked_at).length;
    const links = state.anonymous_links.filter((link) => !link.revoked_at);
    const views = links.reduce((total, link) => total + link.views.count, 0);
    const shown = people.slice(0, 4);

    return (
        <div data-testid="access-card" className="flex flex-col gap-2.5 rounded-lg border border-primary-200 bg-primary-0 p-4">
            <div className="flex justify-between items-baseline">
                <span className="text-[11px] tracking-[0.08em] uppercase font-semibold text-primary-500">Who has access</span>
                <button type="button" data-testid="access-manage" className="text-[13px] font-medium text-primary-600 hover:text-primary-900" onClick={() => setShow(true)}>Manage</button>
            </div>
            <div className="flex items-center">
                {shown.map((person, index) => (
                    <span key={person.id} className={`flex items-center justify-center h-7 w-7 rounded-full border-2 border-primary-0 text-[11px] font-semibold ${index === 0 ? "bg-primary-900 text-primary-50" : "-ml-2 bg-secondary-900 text-primary-900"}`}>
                        {initialsOf(person.name)}
                    </span>
                ))}
                {people.length + pending > shown.length &&
                    <span className="-ml-1.5 flex items-center justify-center h-7 w-7 rounded-full border border-dashed border-primary-400 bg-primary-0 text-[11px] font-semibold text-primary-500">
                        +{people.length + pending - shown.length}
                    </span>
                }
            </div>
            <span className="text-[13px] leading-[19px] text-primary-600">
                {me && people.some((person) => person.id === me) ? `You and ${others} ${others === 1 ? "person" : "people"}` : `${people.length} people`}
                {pending > 0 && ` · ${pending} pending invitation${pending === 1 ? "" : "s"}`}
            </span>
            {props.dataset.embargo?.active &&
                <>
                    <div className="h-px bg-primary-100"></div>
                    <div className="flex justify-between text-[13px]">
                        <span className="text-primary-600">Anonymous links</span>
                        <span className="font-medium text-primary-900">{links.length} · {views} views</span>
                    </div>
                    <button type="button" aria-label="New anonymous link" className="self-start inline-flex items-center gap-1.5 rounded-md border border-primary-300 bg-primary-0 px-2.5 py-1.5 text-[13px] font-semibold text-primary-900" onClick={() => setShow(true)}>
                        <MaterialSymbol icon="add_link" size={16} grade={-25} weight={400} aria-hidden="true" /> New anonymous link
                    </button>
                </>
            }
            <ShareDialog dataset={props.dataset} show={show} onClose={() => setShow(false)} />
        </div>
    );
}
