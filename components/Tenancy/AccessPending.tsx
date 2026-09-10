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
        <div data-testid="access-pending" className="py-6">
            <h6 className="font-semibold">Your access is not set up yet</h6>
            <p className="text-primary-700 mt-2">
                Your account was created, but it has not been added to any namespace.
                Someone from the Data Team needs to grant you access before you can
                see or upload data.
            </p>
            <p className="text-primary-700 mt-2">
                Once they tell you it is done, use the button below — there is no need
                to sign out and back in.
            </p>
            <button
                type="button"
                onClick={checkAgain}
                disabled={checking}
                className="mt-6 px-4 py-2 rounded bg-primary-600 text-white disabled:opacity-60"
            >
                {checking ? "Checking..." : "I already have access — check again"}
            </button>
        </div>
    )
}
