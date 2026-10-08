import { ErrorMessage, Field, Form, Formik } from "formik";
import { signIn } from "next-auth/react";
import Router from "next/router";
import { useState } from "react";
import * as Yup from "yup";
import { PASSWORD_MIN_LENGTH, accountErrorMessage } from "../../contants/AccountConstants";
import { EDIT_FORM_ERROR_CLASS, EDIT_FORM_HINT_CLASS, EDIT_FORM_INPUT_CLASS, EDIT_FORM_LABEL_CLASS } from "../../contants/EditFormConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import { emailField, newPasswordField } from "../../lib/accountValidation";
import { loginUrlFor } from "../../lib/authRoutes";
import { VerificationCodeForm } from "./VerificationCodeForm";

interface Details {
    name: string
    email: string
}

interface FormValues extends Details {
    password: string
}

const schema = Yup.object({
    name: Yup.string().trim().required("Enter your name."),
    email: emailField,
    password: newPasswordField,
});

export function SignUpForm({ callbackUrl }: { callbackUrl: string }) {
    const [bffGateway] = useState(() => new BFFAPI());
    const [details, setDetails] = useState<Details>({ name: "", email: "" });
    // Kept only to sign in right after the code is confirmed; never seeds the form again.
    const [password, setPassword] = useState("");
    const [challengeId, setChallengeId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(values: FormValues) {
        setError(null);
        const submitted = { name: values.name.trim(), email: values.email.trim(), password: values.password };
        try {
            const challenge = await bffGateway.signUp(submitted);
            setDetails({ name: submitted.name, email: submitted.email });
            setPassword(submitted.password);
            setChallengeId(challenge.challengeId);
        } catch (e) {
            setError(accountErrorMessage(e?.response?.data?.detail));
        }
    }

    async function confirm(code: string) {
        await bffGateway.confirmSignUp(challengeId, code);
        let result: Awaited<ReturnType<typeof signIn>>;
        try {
            result = await signIn("credentials", {
                email: details.email,
                password,
                redirect: false,
                callbackUrl,
            });
        } catch {
            throw new Error("sign_in_failed");
        }
        await Router.push(result && !result.error && result.url ? result.url : loginUrlFor(callbackUrl));
    }

    if (challengeId) {
        return (
            <div className="flex flex-col gap-4">
                <p className="m-0 text-sm text-primary-700">
                    If {details.email} already has a password account, we sent a password-reset link to it instead of a code.
                </p>
                <VerificationCodeForm email={details.email} onSubmit={confirm} onResend={() => bffGateway.resendChallenge(challengeId)} />
                <button type="button" className="self-start text-sm font-medium text-primary-900 underline underline-offset-2" onClick={() => setChallengeId(null)}>
                    Use a different email
                </button>
            </div>
        );
    }

    return (
        <Formik initialValues={{ ...details, password: "" }} validationSchema={schema} onSubmit={onSubmit}>
            {({ isSubmitting }) => (
                <Form noValidate className="flex flex-col gap-4">
                    <div>
                        <label htmlFor="sign-up-name" className={EDIT_FORM_LABEL_CLASS}>Name</label>
                        <Field id="sign-up-name" data-testid="sign-up-name" name="name" type="text" autoComplete="name" className={EDIT_FORM_INPUT_CLASS} />
                        <ErrorMessage name="name" component="p" className={EDIT_FORM_ERROR_CLASS} />
                    </div>
                    <div>
                        <label htmlFor="sign-up-email" className={EDIT_FORM_LABEL_CLASS}>Email</label>
                        <Field id="sign-up-email" data-testid="sign-up-email" name="email" type="email" autoComplete="email" className={EDIT_FORM_INPUT_CLASS} />
                        <ErrorMessage name="email" component="p" className={EDIT_FORM_ERROR_CLASS} />
                    </div>
                    <div>
                        <label htmlFor="sign-up-password" className={EDIT_FORM_LABEL_CLASS}>Password</label>
                        <Field id="sign-up-password" data-testid="sign-up-password" name="password" type="password" autoComplete="new-password" className={EDIT_FORM_INPUT_CLASS} />
                        <p className={`${EDIT_FORM_HINT_CLASS} mt-1`}>At least {PASSWORD_MIN_LENGTH} characters.</p>
                        <ErrorMessage name="password" component="p" className={EDIT_FORM_ERROR_CLASS} />
                    </div>
                    {error && <p role="alert" className="m-0 text-sm text-error-600">{error}</p>}
                    <button type="submit" data-testid="sign-up-submit" disabled={isSubmitting} className="btn-primary m-0">Create account</button>
                </Form>
            )}
        </Formik>
    );
}
