import { useState } from "react";
import { accountErrorMessage } from "../../contants/AccountConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import { UserDetailsResponse } from "../../lib/users";
import { ChangePasswordDialog } from "./ChangePasswordDialog";

interface Props {
    user: Pick<UserDetailsResponse, "email" | "has_password" | "email_verified_at">
}

/** The "Password" row of the profile's sign-in methods. */
export function PasswordSignInMethod({ user }: Props) {
    const [bffGateway] = useState(() => new BFFAPI());
    const [changing, setChanging] = useState(false);
    const [sending, setSending] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function sendSetPasswordLink() {
        setSending(true);
        setError(null);
        try {
            await bffGateway.requestPasswordReset(user.email);
            setNotice(`We sent a link to ${user.email}.`);
        } catch (e) {
            setError(accountErrorMessage(e?.response?.data?.detail));
        } finally {
            setSending(false);
        }
    }

    function state(): string {
        return user.has_password ? "Set" : "Not set";
    }

    return (
        <li className="grid grid-cols-[140px_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 text-sm">
            <span className="text-primary-500">Password</span>
            <span className="flex flex-col gap-1 min-w-0 text-primary-900">
                <span>{state()}</span>
                {notice && <span role="status" className="text-primary-700">{notice}</span>}
                {error && <span role="alert" className="text-error-600">{error}</span>}
            </span>
            {user.has_password && (
                <button type="button" data-testid="profile-change-password" className="btn-primary-outline btn-small m-0" onClick={() => setChanging(true)}>Change password</button>
            )}
            {!user.has_password && user.email_verified_at && (
                <button type="button" className="btn-primary-outline btn-small m-0" disabled={sending || notice !== null} onClick={sendSetPasswordLink}>Set a password</button>
            )}
            <ChangePasswordDialog
                show={changing}
                onClose={() => setChanging(false)}
                onChanged={() => { setChanging(false); setNotice("Password changed."); }}
            />
        </li>
    );
}
