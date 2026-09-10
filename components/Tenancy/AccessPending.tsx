import { useSession } from "next-auth/react";
import Router from "next/router";
import { useState } from "react";

/**
 * Shown to a user who has signed in but has not been granted access to any
 * namespace yet.
 *
 * The refresh button is the point of this component: access is granted by the
 * team after sign in, and the session carries the claims it was given at login.
 * Without it the user has to sign out and back in for a grant to take effect,
 * which reads as "the team said I have access and I still see nothing".
 */
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
