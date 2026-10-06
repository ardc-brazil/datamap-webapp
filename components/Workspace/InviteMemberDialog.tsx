import { useFormik } from "formik";
import { useEffect, useState } from "react";
import * as Yup from "yup";
import { EDIT_FORM_ERROR_CLASS, EDIT_FORM_INPUT_CLASS, EDIT_FORM_LABEL_CLASS } from "../../contants/EditFormConstants";
import { SHARE_PERSON_DETAIL_CLASS, SHARE_PERSON_NAME_CLASS } from "../../contants/ShareConstants";
import { WORKSPACE_LOOKUP_DEBOUNCE_MS, tenancyErrorMessage } from "../../contants/TenancyConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import { useDebouncedValue } from "../../hooks/UseDebouncedValue";
import { useSubmitOnce } from "../../hooks/UseSubmitOnce";
import { classifyShareInput } from "../../lib/shareTarget";
import { InviteeLookup, TenancySummary } from "../../types/GatekeeperAPI";
import Modal from "../base/PopupModal";
import { PersonInitial } from "../Share/PersonInitial";

type Lookup = { value: string, found: InviteeLookup | null, error: string | null };

function exactValue(raw: string): string | null {
    const target = classifyShareInput(raw);
    return target.kind === "email" || target.kind === "orcid" ? target.value : null;
}

const schema = Yup.object({
    value: Yup.string()
        .trim()
        .required("Type an email or ORCID iD.")
        .test("exact", "Type the full email or ORCID iD.", (value) => exactValue(value ?? "") !== null),
});

function inviteeStatus(found: InviteeLookup, tenancyName: string): string {
    if (found.tenancy_member) {
        return `Already a member of ${tenancyName}.`;
    }
    if (found.invitation_pending) {
        return `Already invited to ${tenancyName} · not accepted yet.`;
    }
    return `Member of the tenancy · sees its ${found.datasets} ${found.datasets === 1 ? "dataset" : "datasets"} once they accept · administrators are notified`;
}

interface Props {
    tenancy: TenancySummary
    show: boolean
    onClose(): void
    onInvited(): void
}

export function InviteMemberDialog(props: Props) {
    const [bffGateway] = useState(() => new BFFAPI());
    const [lookup, setLookup] = useState<Lookup | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { submit, reset, busy } = useSubmitOnce();
    const formik = useFormik({
        initialValues: { value: "" },
        validationSchema: schema,
        onSubmit: async () => {
            if (!invitee) {
                return;
            }
            setError(null);
            try {
                await submit(async () => {
                    await bffGateway.inviteToWorkspace(props.tenancy.path, invitee.user.id);
                    props.onInvited();
                    close();
                });
            } catch (e) {
                setError(tenancyErrorMessage(e?.response?.data?.detail));
            }
        },
    });
    const settled = useDebouncedValue(formik.values.value, WORKSPACE_LOOKUP_DEBOUNCE_MS);

    useEffect(() => {
        if (props.show) {
            setError(null);
            reset();
        }
    }, [props.show, reset]);

    useEffect(() => {
        const value = exactValue(settled);
        if (!value) {
            setLookup(null);
            return;
        }
        let cancelled = false;
        bffGateway.lookupInvitee(props.tenancy.path, value)
            .then((found) => { if (!cancelled) setLookup({ value, found, error: null }); })
            .catch((e) => { if (!cancelled) setLookup({ value, found: null, error: tenancyErrorMessage(e?.response?.data?.detail) }); });
        return () => { cancelled = true; };
    }, [settled, props.tenancy.path, bffGateway]);

    const typed = classifyShareInput(formik.values.value);
    const fieldError = typed.kind === "invalid_orcid"
        ? "This ORCID iD is not valid. Check the last digit."
        : formik.touched.value && formik.errors.value ? formik.errors.value : null;
    const current = lookup && lookup.value === exactValue(formik.values.value) ? lookup : null;
    const found = current?.found ?? null;
    const invitee = found?.can_invite ? found : null;

    function close() {
        formik.resetForm();
        setLookup(null);
        setError(null);
        props.onClose();
    }

    return (
        <Modal
            title={`Invite to ${props.tenancy.display_name}`}
            show={props.show}
            confimButtonText="Send invitation"
            cancelButtonText="Cancel"
            cancel={close}
            confim={() => { void formik.submitForm(); }}
            confirmDisabled={!invitee || busy}
            cancelDisabled={busy}
            maxWidthClassName="max-w-[520px]"
        >
            <form noValidate onSubmit={(e) => { e.preventDefault(); void formik.submitForm(); }} className="flex flex-col gap-4">
                <p id="invite-value-hint" className="m-0 text-sm leading-5 text-primary-600">
                    Type the exact email or ORCID iD of someone with a DataMap account. They accept the invitation in the app.
                </p>
                <div>
                    <label htmlFor="invite-value" className={EDIT_FORM_LABEL_CLASS}>Email or ORCID iD</label>
                    <input
                        id="invite-value"
                        type="text"
                        autoComplete="off"
                        aria-describedby={fieldError ? "invite-value-hint invite-value-error" : "invite-value-hint"}
                        aria-invalid={fieldError ? true : undefined}
                        disabled={busy}
                        className={EDIT_FORM_INPUT_CLASS}
                        {...formik.getFieldProps("value")}
                        onChange={(e) => { setError(null); formik.handleChange(e); }}
                    />
                    {fieldError && <p id="invite-value-error" className={EDIT_FORM_ERROR_CLASS}>{fieldError}</p>}
                </div>
                <div role="status" aria-live="polite" className="empty:hidden">
                    {found &&
                        <div className="grid grid-cols-[32px_minmax(0,1fr)] gap-3 items-center rounded-lg border border-primary-200 bg-primary-0 px-3.5 py-3">
                            <PersonInitial name={found.user.name} />
                            <span className="flex flex-col min-w-0">
                                <span className={SHARE_PERSON_NAME_CLASS}>{found.user.name}</span>
                                <span className={SHARE_PERSON_DETAIL_CLASS}>{typed.kind === "orcid" ? `ORCID iD ${current.value}` : found.user.email ?? `ORCID iD ${current.value}`}</span>
                                <span className="mt-1 text-xs leading-[17px] text-primary-600">{inviteeStatus(found, props.tenancy.display_name)}</span>
                            </span>
                        </div>
                    }
                    {current?.error && <p className="m-0 text-sm text-primary-600">{current.error}</p>}
                </div>
                {error && <p role="alert" className="m-0 text-sm text-danger-700">{error}</p>}
                <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
            </form>
        </Modal>
    );
}
