import { MaterialSymbol } from "react-material-symbols";
import { SHARE_DANGER_ACTION_CLASS, SHARE_PERSON_DETAIL_CLASS, SHARE_ROW_CLASS, SHARE_SECTION_LABEL_CLASS } from "../../contants/ShareConstants";
import { describeLinkStats } from "../../lib/embargoDisplay";
import { AnonymousLink } from "../../types/GatekeeperAPI";

interface Props {
    links: AnonymousLink[]
    busy?: boolean
    onNew(): void
    onRevoke(linkId: string): void
}

export function AnonymousLinksSection(props: Props) {
    const now = new Date();
    const links = props.links.filter((link) => !link.revoked_at);

    return (
        <section className="flex flex-col gap-1" aria-labelledby="anonymous-links-title">
            <div className="flex justify-between items-center pb-2">
                <h4 id="anonymous-links-title" className={SHARE_SECTION_LABEL_CLASS}>Anonymous links</h4>
                <button
                    type="button"
                    aria-label="New anonymous link"
                    className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-primary-300 bg-primary-0 text-[13px] font-semibold text-primary-900 hover:bg-primary-100"
                    onClick={props.onNew}
                >
                    <MaterialSymbol icon="add_link" size={16} grade={-25} weight={400} /> New anonymous link
                </button>
            </div>
            <ul className="m-0 p-0 list-none">
                {links.map((link) => (
                    <li key={link.id} className={SHARE_ROW_CLASS}>
                        <span aria-hidden="true" className="flex items-center justify-center h-8 w-8 rounded-lg bg-embargo-100 text-embargo-800">
                            <MaterialSymbol icon="visibility_off" size={18} grade={-25} weight={400} />
                        </span>
                        <span className="flex flex-col min-w-0">
                            <span className="flex items-center gap-2 text-sm font-medium text-primary-900 min-w-0">
                                <span className="truncate">{link.label}</span>
                                {link.token_hint && <span className="font-mono text-[11px] font-normal text-primary-400 whitespace-nowrap">/anonymous/{link.token_hint}</span>}
                            </span>
                            <span className={SHARE_PERSON_DETAIL_CLASS}>{describeLinkStats(link, now)}</span>
                        </span>
                        <span className="flex items-center gap-3.5">
                            <span aria-label={`${link.views.count} views`} className="flex items-center gap-1 text-[13px] font-medium text-primary-900">
                                <MaterialSymbol icon="visibility" size={16} grade={-25} weight={400} className="text-primary-500" />
                                {link.views.count}
                            </span>
                            <button type="button" aria-label={`Revoke ${link.label}`} className={SHARE_DANGER_ACTION_CLASS} disabled={props.busy} onClick={() => props.onRevoke(link.id)}>
                                Revoke
                            </button>
                        </span>
                    </li>
                ))}
            </ul>
            <p className="m-0 pt-1 text-xs leading-[18px] text-primary-500">
                Metadata only, authors redacted · anyone with the link, no account · works until the dataset is published · the full URL is shown once, at creation
            </p>
        </section>
    );
}
