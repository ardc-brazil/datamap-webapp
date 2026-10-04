import { ErrorMessage, Field, Form, Formik } from "formik";
import Link from "next/link";
import Router from "next/router";
import { useState } from "react";
import * as Yup from "yup";
import { PASSWORD_MIN_LENGTH, accountErrorMessage } from "../../contants/AccountConstants";
import { EDIT_FORM_ERROR_CLASS, EDIT_FORM_HINT_CLASS, EDIT_FORM_INPUT_CLASS, EDIT_FORM_LABEL_CLASS } from "../../contants/EditFormConstants";
import { ROUTE_PAGE_FORGOT_PASSWORD, ROUTE_PAGE_HOME, ROUTE_PAGE_RESET_PASSWORD } from "../../contants/InternalRoutesConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import { newPasswordField } from "../../lib/accountValidation";
import { loginUrlFor } from "../../lib/authRoutes";

const schema = Yup.object({
    password: newPasswordField,
    confirmation: Yup.string()
        .oneOf([Yup.ref("password")], "The passwords do not match.")
        .required("Type the new password again."),
});

const TITLE_CLASS = "m-0 text-[26px] leading-[1.2] font-semibold tracking-[-0.02em] text-primary-900";

export function ResetPasswordForm({ token }: { token: string }) {
    const [bffGateway] = useState(() => new BFFAPI());
    const [done, setDone] = useState(false);
    const [error, setError] = useState<{ message: string, tokenDead: boolean } | null>(null);

    async function onSubmit(values: { password: string, confirmation: string }) {
        setError(null);
        try {
            await bffGateway.confirmPasswordReset(token, values.password);
            setDone(true);
            // Shallow keeps the success view mounted while clearing the dead token from the address bar and history.
            Router.replace(ROUTE_PAGE_RESET_PASSWORD("used"), undefined, { shallow: true });
        } catch (e) {
            const detail = e?.response?.data?.detail;
            setError({ message: accountErrorMessage(detail), tokenDead: detail === "token_invalid" });
        }
    }

    if (done) {
        return (
            <div role="status" className="flex flex-col gap-4">
                <h1 className={TITLE_CLASS}>Your password was changed</h1>
                <p className="m-0 text-[15px] leading-6 text-primary-600">Sign in with your email and the new password.</p>
                <Link href={loginUrlFor(ROUTE_PAGE_HOME)} className="btn-primary m-0 self-start text-primary-50 hover:text-primary-50">Sign in</Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5">
            <h1 className={TITLE_CLASS}>Choose a new password</h1>
            <Formik initialValues={{ password: "", confirmation: "" }} validationSchema={schema} onSubmit={onSubmit}>
                {({ isSubmitting }) => (
                    <Form noValidate className="flex flex-col gap-4">
                        <div>
                            <label htmlFor="reset-password" className={EDIT_FORM_LABEL_CLASS}>New password</label>
                            <Field id="reset-password" name="password" type="password" autoComplete="new-password" className={EDIT_FORM_INPUT_CLASS} />
                            <p className={`${EDIT_FORM_HINT_CLASS} mt-1`}>At least {PASSWORD_MIN_LENGTH} characters.</p>
                            <ErrorMessage name="password" component="p" className={EDIT_FORM_ERROR_CLASS} />
                        </div>
                        <div>
                            <label htmlFor="reset-password-confirmation" className={EDIT_FORM_LABEL_CLASS}>Confirm new password</label>
                            <Field id="reset-password-confirmation" name="confirmation" type="password" autoComplete="new-password" className={EDIT_FORM_INPUT_CLASS} />
                            <ErrorMessage name="confirmation" component="p" className={EDIT_FORM_ERROR_CLASS} />
                        </div>
                        {error && (
                            <p role="alert" className="m-0 text-sm text-error-600">
                                {error.message}
                                {error.tokenDead && <> <Link href={ROUTE_PAGE_FORGOT_PASSWORD} className="text-sm underline underline-offset-2">Ask for a new link</Link></>}
                            </p>
                        )}
                        <button type="submit" disabled={isSubmitting} className="btn-primary m-0 self-start">Change password</button>
                    </Form>
                )}
            </Formik>
        </div>
    );
}
