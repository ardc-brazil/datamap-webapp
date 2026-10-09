import { MaterialSymbol } from "react-material-symbols";
import { formatShortDate } from "../../lib/embargoDisplay";
import { AnonymousPageActive, AnonymousPageEnded } from "../../types/GatekeeperAPI";

export function AnonymousBanner(props: { page: AnonymousPageActive | AnonymousPageEnded }) {
    const active = props.page.state === "active";

    return (
        <div role="note" data-testid="anonymous-banner" className={`flex gap-2.5 items-start px-4 md:px-8 py-3 text-[13px] leading-[19px] ${active ? "bg-embargo-100 text-embargo-800" : "bg-secondary-500 text-primary-900"}`}>
            <MaterialSymbol icon="visibility_off" size={18} grade={-25} weight={400} className="flex-none" aria-hidden="true" />
            <span>
                {props.page.state === "active"
                    ? `You're reading this dataset as an anonymous reviewer. Authorship is redacted and the files aren't available. The dataset is under embargo until ${formatShortDate(props.page.embargo_until)}.`
                    : `Anonymous view · authorship redacted, files not available. The embargo ended on ${formatShortDate(props.page.embargo_ended_at)}; the dataset hasn't been published yet. This link leads to the public page once it is.`}
            </span>
        </div>
    );
}
