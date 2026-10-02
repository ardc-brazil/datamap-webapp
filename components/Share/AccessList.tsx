import { MaterialSymbol } from "react-material-symbols";
import {
    SHARE_DANGER_ACTION_CLASS,
    SHARE_LEVEL_LABELS,
    SHARE_PERSON_DETAIL_CLASS,
    SHARE_PERSON_NAME_CLASS,
    SHARE_ROW_CLASS,
    SHARE_SECTION_LABEL_CLASS,
} from "../../contants/ShareConstants";
import { formatShortDate } from "../../lib/embargoDisplay";
import { PermissionLevel, SharePermission, ShareState } from "../../types/GatekeeperAPI";
import { PersonInitial } from "./PersonInitial";

interface Props {
    state: ShareState
    me?: string
    busy?: boolean
    onChangeLevel(userId: string, level: PermissionLevel): void
    onRemove(permission: SharePermission): void
    onRevokeInvitation(invitationId: string): void
    members?: MembersRow | null
    onChangeMembers?(): void
}

export interface MembersRow {
    tenancyName: string
    detail: string
    canChange: boolean
}

function permissionDetail(permission: SharePermission): string {
    if (permission.invited_as && permission.invited_as !== permission.user.email) {
        return `${permission.user.email} · accepted the invitation sent to ${permission.invited_as}`;
    }
    return `${permission.user.email} · added ${formatShortDate(permission.granted_at, false)}`;
}

export function AccessList(props: Props) {
    const pending = props.state.invitations.filter((invitation) => !invitation.revoked_at && !invitation.accepted_at);
    const owner = props.state.owner;

    return (
        <section className="flex flex-col gap-1" aria-labelledby="access-list-title">
            <h4 id="access-list-title" className={`${SHARE_SECTION_LABEL_CLASS} pb-1.5`}>Who has access</h4>
            <ul className="m-0 p-0 list-none">
                <li className={SHARE_ROW_CLASS}>
                    <PersonInitial name={owner.name} owner />
                    <span className="flex flex-col min-w-0">
                        <span className={SHARE_PERSON_NAME_CLASS}>{owner.name}{props.me === owner.id ? " (you)" : ""}</span>
                        <span className={SHARE_PERSON_DETAIL_CLASS}>{owner.email}</span>
                    </span>
                    <span className="text-[13px] font-medium text-primary-500">Owner</span>
                </li>

                {props.state.permissions.map((permission) => (
                    <li key={permission.user.id} className={SHARE_ROW_CLASS}>
                        <PersonInitial name={permission.user.name} />
                        <span className="flex flex-col min-w-0">
                            <span className={SHARE_PERSON_NAME_CLASS}>{permission.user.name}{props.me === permission.user.id ? " (you)" : ""}</span>
                            <span className={SHARE_PERSON_DETAIL_CLASS}>{permissionDetail(permission)}</span>
                        </span>
                        <select
                            aria-label={`Access for ${permission.user.name}`}
                            className="w-auto h-8 border-0 bg-transparent pl-1 pr-7 text-[13px] font-medium text-primary-900 focus:ring-0 disabled:opacity-50"
                            value={permission.level}
                            disabled={props.busy}
                            onChange={(e) => e.target.value === "remove"
                                ? props.onRemove(permission)
                                : props.onChangeLevel(permission.user.id, e.target.value as PermissionLevel)}
                        >
                            <option value="read">{SHARE_LEVEL_LABELS.read}</option>
                            <option value="write">{SHARE_LEVEL_LABELS.write}</option>
                            <option value="remove">Remove access</option>
                        </select>
                    </li>
                ))}

                {pending.map((invitation) => {
                    const who = invitation.email ?? `ORCID ${invitation.orcid}`;
                    const how = invitation.email ? "email sent" : "link shown once, not sent by DataMap";
                    return (
                        <li key={invitation.id} className={SHARE_ROW_CLASS}>
                            <PersonInitial pendingIcon={invitation.email ? "mail" : "badge"} />
                            <span className="flex flex-col min-w-0">
                                <span className={SHARE_PERSON_NAME_CLASS}>{who}</span>
                                <span className={SHARE_PERSON_DETAIL_CLASS}>Invited {formatShortDate(invitation.created_at, false)} · pending · {how}</span>
                            </span>
                            <button
                                type="button"
                                aria-label={`Revoke invitation for ${who}`}
                                className={SHARE_DANGER_ACTION_CLASS}
                                disabled={props.busy}
                                onClick={() => props.onRevokeInvitation(invitation.id)}
                            >
                                Revoke
                            </button>
                        </li>
                    );
                })}

                {props.members &&
                    <li className={SHARE_ROW_CLASS}>
                        <span aria-hidden="true" className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary-500 text-primary-900">
                            <MaterialSymbol icon="groups" size={18} grade={-25} weight={400} />
                        </span>
                        <span className="flex flex-col min-w-0">
                            <span className={SHARE_PERSON_NAME_CLASS}>Members of {props.members.tenancyName}</span>
                            <span className={SHARE_PERSON_DETAIL_CLASS}>{props.members.detail}</span>
                        </span>
                        {props.members.canChange
                            ? <button
                                type="button"
                                aria-label={`Change what members of ${props.members.tenancyName} can do`}
                                className="text-[13px] font-medium text-primary-600 hover:underline underline-offset-2 disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                                disabled={props.busy}
                                onClick={() => props.onChangeMembers?.()}
                            >
                                Change
                            </button>
                            : <span></span>}
                    </li>
                }
            </ul>
        </section>
    );
}
