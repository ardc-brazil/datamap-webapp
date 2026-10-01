import { useSession } from "next-auth/react";
import Link from "next/link";
import Router from "next/router";
import { useState } from "react";
import { ROUTE_PAGE_DATASETS_SHARED } from "../../contants/InternalRoutesConstants";

/** Shown when the user is signed in but has no namespace yet. */
export function AccessPending() {
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
            <h5 className="m-0">Your access is not set up yet</h5>
            <p className="text-sm text-primary-700 mt-2 mb-0">
                Your account was created, but it has not been added to any namespace.
                Someone from the Data Team needs to grant you access before you can
                see or upload data.
            </p>
            <p className="text-sm text-primary-700 mt-2 mb-0">
                Once they tell you it is done, use the button below — there is no need
                to sign out and back in.
            </p>
            <p className="text-sm text-primary-700 mt-2 mb-0">
                If a researcher shared a dataset with you, it is already in{" "}
                <Link href={ROUTE_PAGE_DATASETS_SHARED} className="text-sm font-semibold underline underline-offset-2">Shared with me</Link>.
            </p>
            <button
                type="button"
                onClick={checkAgain}
                disabled={checking}
                className="btn-primary m-0 mt-4"
            >
                {checking ? "Checking..." : "I already have access — check again"}
            </button>
        </div>
    )
}
