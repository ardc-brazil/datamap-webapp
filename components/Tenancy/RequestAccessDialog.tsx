import { useFormik } from "formik";
import { useState } from "react";
import { mutate } from "swr";
import * as Yup from "yup";
import { EDIT_FORM_ERROR_CLASS, EDIT_FORM_INPUT_CLASS, EDIT_FORM_LABEL_CLASS } from "../../contants/EditFormConstants";
import { REASON_MAX_LENGTH, TENANCY_NAME_MAX_LENGTH, TENANCY_REQUESTS_KEY, tenancyErrorMessage } from "../../contants/TenancyConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import Modal from "../base/PopupModal";

const schema = Yup.object({
    tenancyName: Yup.string().trim().required("Name the tenancy you need.").max(TENANCY_NAME_MAX_LENGTH, `At most ${TENANCY_NAME_MAX_LENGTH} characters.`),
    reason: Yup.string().trim().required("Say why you need access.").max(REASON_MAX_LENGTH, `At most ${REASON_MAX_LENGTH} characters.`),
});

interface Props {
    show: boolean
    onClose(): void
}

export function RequestAccessDialog(props: Props) {
    const [bffGateway] = useState(() => new BFFAPI());
    const [error, setError] = useState<string | null>(null);
    const formik = useFormik({
        initialValues: { tenancyName: "", reason: "" },
        validationSchema: schema,
        onSubmit: async (values, helpers) => {
            setError(null);
            try {
                await bffGateway.requestTenancyAccess({ tenancyName: values.tenancyName.trim(), reason: values.reason.trim() });
                helpers.resetForm();
                await mutate(TENANCY_REQUESTS_KEY);
                props.onClose();
            } catch (e) {
                setError(tenancyErrorMessage(e?.response?.data?.detail));
            }
        },
    });

    function close() {
        formik.resetForm();
        setError(null);
        props.onClose();
    }

    return (
        <Modal
            title="Request access"
            show={props.show}
            confimButtonText="Send request"
            cancelButtonText="Cancel"
            cancel={close}
            confim={() => { if (!formik.isSubmitting) formik.submitForm(); }}
            confirmDisabled={formik.isSubmitting}
            maxWidthClassName="max-w-[520px]"
        >
            <form noValidate onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
                <p className="m-0 text-sm leading-5 text-primary-600">Name the tenancy you need. An administrator reviews it; you&apos;re emailed with the answer.</p>
                <div>
                    <label htmlFor="request-tenancy-name" className={EDIT_FORM_LABEL_CLASS}>Tenancy</label>
                    <input
                        id="request-tenancy-name"
                        type="text"
                        autoComplete="off"
                        maxLength={TENANCY_NAME_MAX_LENGTH}
                        className={EDIT_FORM_INPUT_CLASS}
                        {...formik.getFieldProps("tenancyName")}
                    />
                    <p className="m-0 mt-1.5 text-xs leading-[17px] text-primary-500">
                        The name of the group or project. If it exists, this is a request to join; if not, a request to create it. Only administrators can tell which.
                    </p>
                    {formik.touched.tenancyName && formik.errors.tenancyName && <p className={EDIT_FORM_ERROR_CLASS}>{formik.errors.tenancyName}</p>}
                </div>
                <div>
                    <label htmlFor="request-reason" className={EDIT_FORM_LABEL_CLASS}>Why</label>
                    <textarea
                        id="request-reason"
                        rows={4}
                        maxLength={REASON_MAX_LENGTH}
                        className="block w-full px-3 py-2 bg-primary-0 border border-primary-300 rounded-md text-sm text-primary-900 placeholder:text-primary-400"
                        {...formik.getFieldProps("reason")}
                    />
                    {formik.touched.reason && formik.errors.reason && <p className={EDIT_FORM_ERROR_CLASS}>{formik.errors.reason}</p>}
                </div>
                {error && <p role="alert" className="m-0 text-sm text-danger-700">{error}</p>}
                <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
            </form>
        </Modal>
    );
}
