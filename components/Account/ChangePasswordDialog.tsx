import { useFormik } from "formik";
import { useState } from "react";
import * as Yup from "yup";
import { CURRENT_PASSWORD_INCORRECT_MESSAGE, PASSWORD_MIN_LENGTH, accountErrorMessage } from "../../contants/AccountConstants";
import { EDIT_FORM_ERROR_CLASS, EDIT_FORM_HINT_CLASS, EDIT_FORM_INPUT_CLASS, EDIT_FORM_LABEL_CLASS } from "../../contants/EditFormConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import { newPasswordField } from "../../lib/accountValidation";
import Modal from "../base/PopupModal";

const schema = Yup.object({
    currentPassword: Yup.string().required("Enter your current password."),
    newPassword: newPasswordField,
});

interface Props {
    show: boolean
    onClose(): void
    onChanged(): void
}

export function ChangePasswordDialog(props: Props) {
    const [bffGateway] = useState(() => new BFFAPI());
    const [error, setError] = useState<string | null>(null);
    const formik = useFormik({
        initialValues: { currentPassword: "", newPassword: "" },
        validationSchema: schema,
        onSubmit: async (values, helpers) => {
            setError(null);
            try {
                await bffGateway.changePassword(values.currentPassword, values.newPassword);
                helpers.resetForm();
                props.onChanged();
            } catch (e) {
                setError(e?.response?.status === 401 ? CURRENT_PASSWORD_INCORRECT_MESSAGE : accountErrorMessage(e?.response?.data?.detail));
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
            title="Change password"
            show={props.show}
            confimButtonText="Change password"
            cancelButtonText="Cancel"
            cancel={close}
            confim={() => { if (!formik.isSubmitting) formik.submitForm(); }}
            confirmDisabled={formik.isSubmitting}
        >
            <form noValidate onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
                <div>
                    <label htmlFor="current-password" className={EDIT_FORM_LABEL_CLASS}>Current password</label>
                    <input id="current-password" type="password" autoComplete="current-password" className={EDIT_FORM_INPUT_CLASS} {...formik.getFieldProps("currentPassword")} />
                    {formik.touched.currentPassword && formik.errors.currentPassword && <p className={EDIT_FORM_ERROR_CLASS}>{formik.errors.currentPassword}</p>}
                </div>
                <div>
                    <label htmlFor="new-password" className={EDIT_FORM_LABEL_CLASS}>New password</label>
                    <input id="new-password" type="password" autoComplete="new-password" className={EDIT_FORM_INPUT_CLASS} {...formik.getFieldProps("newPassword")} />
                    <p className={`${EDIT_FORM_HINT_CLASS} mt-1`}>At least {PASSWORD_MIN_LENGTH} characters.</p>
                    {formik.touched.newPassword && formik.errors.newPassword && <p className={EDIT_FORM_ERROR_CLASS}>{formik.errors.newPassword}</p>}
                </div>
                {error && <p role="alert" className="m-0 text-sm text-error-600">{error}</p>}
                <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
            </form>
        </Modal>
    );
}
