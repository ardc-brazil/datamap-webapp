import { signOut } from "next-auth/react";
import Link from "next/link";
import Router from "next/router";
import { useState } from "react";
import { GENERIC_ERROR_MESSAGE } from "../../contants/EmbargoConstants";
import { ROUTE_PAGE_DATASETS, ROUTE_PAGE_DATASETS_DETAILS, ROUTE_PAGE_DATASETS_SHARED, ROUTE_PAGE_INVITATION } from "../../contants/InternalRoutesConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import { loginUrlFor } from "../../lib/authRoutes";
import { formatShortDate } from "../../lib/embargoDisplay";
import { InvitationPreview } from "../../types/GatekeeperAPI";

interface Props {
    token: string
    preview: InvitationPreview
    account: string | null
}

const ACCESS = { read: "Can read and download", write: "Can edit and download" };

function Row(props: { label: string, children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 px-4 py-3 border-b border-primary-100 last:border-b-0 text-sm">
            <span className="text-primary-500">{props.label}</span>
            <span className="text-primary-900 font-medium">{props.children}</span>
        </div>
    );
}

export function InvitationCard(props: Props) {
    const [accepting, setAccepting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const preview = props.preview;
    const here = ROUTE_PAGE_INVITATION({ token: props.token });

    if (preview.state === "accepted" && props.account) {
        return (
            <div role="status" className="flex flex-col gap-3 text-center items-center">
                <h1 className="m-0 text-[26px] leading-[1.2] font-semibold tracking-[-0.02em] text-primary-900">Invitation accepted</h1>
                <p className="m-0 max-w-[440px] text-[15px] leading-6 text-primary-700">
                    {preview.inviter_name} shared {preview.dataset_name} with you. You&apos;ll find it in{" "}
                    <Link href={ROUTE_PAGE_DATASETS_SHARED} className="font-medium text-primary-900 underline underline-offset-2">Shared with me</Link>.
                </p>
            </div>
        );
    }

    if (preview.state === "accepted") {
        return (
            <div role="status" className="flex flex-col gap-3 text-center items-center">
                <h1 className="m-0 text-[26px] leading-[1.2] font-semibold tracking-[-0.02em] text-primary-900">This invitation was already used</h1>
                <p className="m-0 max-w-[440px] text-[15px] leading-6 text-primary-700">
                    It was accepted on {formatShortDate(preview.accepted_at)}. If that was you,{" "}
                    <Link href={loginUrlFor(ROUTE_PAGE_DATASETS)} className="font-medium text-primary-900 underline underline-offset-2">sign in</Link>
                    {" "}to open the dataset. If it wasn&apos;t, ask {preview.owner_name} to revoke it and send a new one.
                </p>
            </div>
        );
    }

    async function accept() {
        setAccepting(true);
        setError(null);
        try {
            const result = await new BFFAPI().acceptInvitation(props.token);
            Router.replace(ROUTE_PAGE_DATASETS_DETAILS({ id: result.dataset_id }));
        } catch (e) {
            setAccepting(false);
            if (e?.httpCode === 409) {
                setError(`This invitation was already used. If it wasn't by you, ask ${preview.owner_name} to revoke it and send a new one.`);
            } else if (e?.httpCode === 404) {
                setError(`This invitation is no longer valid. Ask ${preview.inviter_name} for a new one.`);
            } else {
                setError(GENERIC_ERROR_MESSAGE);
            }
        }
    }

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
                <h1 className="m-0 text-[26px] leading-[1.2] font-semibold tracking-[-0.02em] text-primary-900">{preview.inviter_name} shared a dataset with you</h1>
                <p className="m-0 text-[15px] leading-6 text-primary-600">
                    {preview.embargo_until
                        ? `Accepting gives this account ${preview.level} access, now and after the embargo.`
                        : `Accepting gives this account ${preview.level} access.`}
                </p>
            </div>
            <div className="rounded-lg border border-primary-200 bg-primary-0">
                <Row label="Dataset">{preview.dataset_name}</Row>
                <Row label="Access">{ACCESS[preview.level] ?? preview.level}</Row>
                <Row label="Invited as"><span className="font-mono text-[13px] font-normal">{preview.invited_as}</span></Row>
            </div>
            {error && <p role="alert" className="m-0 text-sm text-danger-700">{error}</p>}
            <button type="button" disabled={accepting} onClick={accept} className="btn-primary m-0 self-start disabled:opacity-60">
                Accept as {props.account}
            </button>
            <p className="m-0 text-[13px] leading-5 text-primary-500">
                Not you?{" "}
                <button type="button" className="font-medium text-primary-900 underline underline-offset-2" onClick={() => signOut({ callbackUrl: loginUrlFor(here) })}>Use another account.</button>
                {" "}The link works once; the owner sees which account accepted.
            </p>
        </div>
    );
}
