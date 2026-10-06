import { useFormik } from "formik";
import { useState } from "react";
import * as Yup from "yup";
import { ADMIN_COPY, ADMIN_FIELD_ERROR_CLASS, adminErrorFrom, adminErrorMessage } from "../../../contants/AdminConstants";
import { MESSAGE_MAX_LENGTH } from "../../../contants/TenancyConstants";
import { BFFAPI } from "../../../gateways/BFFAPI";
import { useSubmitOnce } from "../../../hooks/UseSubmitOnce";
import { requestTarget } from "../../../lib/adminDisplay";
import { firstNameOf } from "../../../lib/tenancySelection";
import { AdminTenancyRequest } from "../../../types/GatekeeperAPI";
import { ConsequenceList } from "../../base/ConsequenceList";
import { DialogError } from "../../base/DialogError";
import { AdminDialog } from "../AdminDialog";

interface Props {
    request: AdminTenancyRequest
    onCancel(): void
    onDeclined(): void
}

const schema = Yup.object({
    message: Yup.string().trim().max(MESSAGE_MAX_LENGTH, adminErrorMessage("message_invalid")),
});

export function declineSubtitle(request: AdminTenancyRequest): string {
    return `${request.requester.name} · ${request.suggested_tenancy ? "join" : "new tenancy"} ${requestTarget(request)}`;
}

export function DeclineRequestDialog({ request, onCancel, onDeclined }: Props) {
    const [error, setError] = useState<string | null>(null);
    const { submit, busy, done } = useSubmitOnce();
    const formik = useFormik({
        initialValues: { message: "" },
        validationSchema: schema,
        onSubmit: async (values) => {
            setError(null);
            const message = values.message.trim();
            try {
                await submit(async () => {
                    await new BFFAPI().declineTenancyRequest(request.id, message || undefined);
                    onDeclined();
                });
            } catch (e) {
                setError(adminErrorFrom(e));
            }
        },
    });

    return (
        <AdminDialog
            title="Decline request?"
            subtitle={declineSubtitle(request)}
            widthClassName="max-w-[440px]"
            onClose={onCancel}
            cancelDisabled={busy}
            primary={{ label: "Decline", destructive: true, disabled: busy || done, onClick: () => { void formik.submitForm(); } }}
        >
            <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4" noValidate>
                <div>
                    <label htmlFor="decline-message" className="mb-1.5 text-[13px]">
                        Message to {firstNameOf(request.requester.name)} <span className="font-normal text-primary-400">optional</span>
                    </label>
                    <textarea
                        id="decline-message"
                        name="message"
                        rows={3}
                        placeholder={ADMIN_COPY.declinePlaceholder}
                        value={formik.values.message}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        aria-describedby={formik.errors.message ? "decline-message-error" : undefined}
                    />
                    {formik.errors.message && <p id="decline-message-error" role="alert" className={ADMIN_FIELD_ERROR_CLASS}>{formik.errors.message}</p>}
                </div>
                <ConsequenceList items={[ADMIN_COPY.declineBullet]} />
                <DialogError message={error} />
            </form>
        </AdminDialog>
    );
}
