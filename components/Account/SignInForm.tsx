import { ErrorMessage, Field, Form, Formik } from "formik";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Router from "next/router";
import { useState } from "react";
import * as Yup from "yup";
import { INVALID_SIGN_IN_MESSAGE } from "../../contants/AccountConstants";
import { EDIT_FORM_ERROR_CLASS, EDIT_FORM_INPUT_CLASS, EDIT_FORM_LABEL_CLASS } from "../../contants/EditFormConstants";
import { GENERIC_ERROR_MESSAGE } from "../../contants/EmbargoConstants";
import { ROUTE_PAGE_FORGOT_PASSWORD } from "../../contants/InternalRoutesConstants";
import { emailField } from "../../lib/accountValidation";

const schema = Yup.object({
    email: emailField,
    password: Yup.string().required("Enter your password."),
});

export function SignInForm({ callbackUrl }: { callbackUrl: string }) {
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(values: { email: string, password: string }) {
        setError(null);
        let result: Awaited<ReturnType<typeof signIn>>;
        try {
            result = await signIn("credentials", {
                email: values.email.trim(),
                password: values.password,
                redirect: false,
                callbackUrl,
            });
        } catch {
            setError(GENERIC_ERROR_MESSAGE);
            return;
        }
        if (!result || result.error) {
            setError(result?.error === "CredentialsSignin" ? INVALID_SIGN_IN_MESSAGE : GENERIC_ERROR_MESSAGE);
            return;
        }
        await Router.push(result.url ?? callbackUrl);
    }

    return (
        <Formik initialValues={{ email: "", password: "" }} validationSchema={schema} onSubmit={onSubmit}>
            {({ isSubmitting }) => (
                <Form noValidate className="flex flex-col gap-4">
                    <div>
                        <label htmlFor="sign-in-email" className={EDIT_FORM_LABEL_CLASS}>Email</label>
                        <Field id="sign-in-email" name="email" type="email" autoComplete="email" className={EDIT_FORM_INPUT_CLASS} />
                        <ErrorMessage name="email" component="p" className={EDIT_FORM_ERROR_CLASS} />
                    </div>
                    <div>
                        <label htmlFor="sign-in-password" className={EDIT_FORM_LABEL_CLASS}>Password</label>
                        <Field id="sign-in-password" name="password" type="password" autoComplete="current-password" className={EDIT_FORM_INPUT_CLASS} />
                        <ErrorMessage name="password" component="p" className={EDIT_FORM_ERROR_CLASS} />
                    </div>
                    {error && <p role="alert" className="m-0 text-sm text-error-600">{error}</p>}
                    <button type="submit" disabled={isSubmitting} className="btn-primary m-0">Sign in</button>
                    <Link href={ROUTE_PAGE_FORGOT_PASSWORD} className="self-start text-sm underline underline-offset-2">Forgot password?</Link>
                </Form>
            )}
        </Formik>
    );
}
