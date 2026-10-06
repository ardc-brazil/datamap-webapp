import { useFormik } from "formik";
import { useState } from "react";
import * as Yup from "yup";
import { ADMIN_COPY, adminErrorFrom, adminErrorMessage } from "../../../contants/AdminConstants";
import { MESSAGE_MAX_LENGTH } from "../../../contants/TenancyConstants";
import { BFFAPI } from "../../../gateways/BFFAPI";
import { useSubmitOnce } from "../../../hooks/UseSubmitOnce";
import { firstNameOf } from "../../../lib/tenancySelection";
import { AdminTenancyRequest } from "../../../types/GatekeeperAPI";
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
    return request.kind === "join" && request.suggested_tenancy
        ? `${request.requester.name} · join ${request.suggested_tenancy.display_name}`
        : `${request.requester.name} · new tenancy ${request.requested_name}`;
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
                    {formik.errors.message && <p id="decline-message-error" role="alert" className="m-0 mt-1.5 text-[13px] text-danger-700">{formik.errors.message}</p>}
                </div>
                <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-sm leading-[21px] text-primary-700">
                    <li className="flex gap-2.5"><span className="text-primary-400">—</span><span>{ADMIN_COPY.declineBullet}</span></li>
                </ul>
                {error && <p role="alert" className="m-0 text-sm text-danger-700">{error}</p>}
            </form>
        </AdminDialog>
    );
}
