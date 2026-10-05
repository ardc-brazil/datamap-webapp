import { useSession } from "next-auth/react";
import Link from "next/link";
import Router from "next/router";
import { useState } from "react";
import { ROUTE_PAGE_DATASETS_SHARED } from "../../contants/InternalRoutesConstants";

export function AccessPending(props: { onRequestAccess(): void }) {
    const { update } = useSession();
    const [checking, setChecking] = useState(false);

    async function checkAgain() {
        setChecking(true);
        try {
            const refreshed = await update();

            if (refreshed?.user?.tenancies?.length) {
                Router.reload();
            }
        } finally {
            setChecking(false);
        }
    }

    return (
        <div data-testid="access-pending" className="rounded-lg border border-primary-200 bg-primary-0 p-6">
            <h5 className="m-0">You&apos;re not in any tenancy</h5>
            <p className="text-sm text-primary-700 mt-2 mb-0">
                Your account is not part of any tenancy, so there is nothing to work in yet. Ask for access to the group or project you work with; an administrator reviews it and you&apos;re emailed with the answer.
            </p>
            <button type="button" onClick={props.onRequestAccess} className="btn-primary m-0 mt-4">
                Request access
            </button>
            <p className="text-sm text-primary-700 mt-4 mb-0">
                If a researcher shared a dataset with you, it is already in{" "}
                <Link href={ROUTE_PAGE_DATASETS_SHARED} className="text-sm font-semibold underline underline-offset-2">Shared with me</Link>.
            </p>
            <button
                type="button"
                onClick={checkAgain}
                disabled={checking}
                className="btn-primary-outline m-0 mt-4"
            >
                {checking ? "Checking..." : "I already have access — check again"}
            </button>
        </div>
    )
}
