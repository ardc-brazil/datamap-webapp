import { ErrorMessage, Field, Form, Formik } from "formik";
import Link from "next/link";
import { useState } from "react";
import * as Yup from "yup";
import { accountErrorMessage } from "../../contants/AccountConstants";
import { EDIT_FORM_ERROR_CLASS, EDIT_FORM_INPUT_CLASS, EDIT_FORM_LABEL_CLASS } from "../../contants/EditFormConstants";
import { ROUTE_PAGE_HOME } from "../../contants/InternalRoutesConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import { emailField } from "../../lib/accountValidation";
import { loginUrlFor } from "../../lib/authRoutes";

const schema = Yup.object({ email: emailField });

export function ForgotPasswordForm() {
    const [bffGateway] = useState(() => new BFFAPI());
    const [sentTo, setSentTo] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(values: { email: string }) {
        setError(null);
        const email = values.email.trim();
        try {
            await bffGateway.requestPasswordReset(email);
            setSentTo(email);
        } catch (e) {
            setError(accountErrorMessage(e?.response?.data?.detail));
        }
    }

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
                <h1 className="m-0 text-[26px] leading-[1.2] font-semibold tracking-[-0.02em] text-primary-900">Reset your password</h1>
                <p className="m-0 text-[15px] leading-6 text-primary-600">Type the email of your DataMap account. We will send a link to choose a new password.</p>
            </div>
            {sentTo ? (
                <p role="status" className="m-0 text-[15px] leading-6 text-primary-900">
                    If an account exists for {sentTo}, we sent a link. It works for one hour.
                </p>
            ) : (
                <Formik initialValues={{ email: "" }} validationSchema={schema} onSubmit={onSubmit}>
                    {({ isSubmitting }) => (
                        <Form noValidate className="flex flex-col gap-4">
                            <div>
                                <label htmlFor="forgot-password-email" className={EDIT_FORM_LABEL_CLASS}>Email</label>
                                <Field id="forgot-password-email" name="email" type="email" autoComplete="email" className={EDIT_FORM_INPUT_CLASS} />
                                <ErrorMessage name="email" component="p" className={EDIT_FORM_ERROR_CLASS} />
                            </div>
                            {error && <p role="alert" className="m-0 text-sm text-error-600">{error}</p>}
                            <button type="submit" disabled={isSubmitting} className="btn-primary m-0 self-start">Send link</button>
                        </Form>
                    )}
                </Formik>
            )}
            <Link href={loginUrlFor(ROUTE_PAGE_HOME)} className="self-start text-sm underline underline-offset-2">Back to sign in</Link>
        </div>
    );
}
