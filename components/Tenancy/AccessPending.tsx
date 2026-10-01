import { useSession } from "next-auth/react";
import Router from "next/router";
import { useState } from "react";

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
