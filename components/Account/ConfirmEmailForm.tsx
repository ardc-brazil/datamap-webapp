import { ErrorMessage, Field, Form, Formik } from "formik";
import { signOut, useSession } from "next-auth/react";
import Router from "next/router";
import { useState } from "react";
import * as Yup from "yup";
import { accountErrorMessage } from "../../contants/AccountConstants";
import { EDIT_FORM_ERROR_CLASS, EDIT_FORM_INPUT_CLASS, EDIT_FORM_LABEL_CLASS } from "../../contants/EditFormConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import { emailField } from "../../lib/accountValidation";
import { SIGN_OUT_CALLBACK_URL } from "../../lib/authRoutes";
import { VerificationCodeForm } from "./VerificationCodeForm";

interface Props {
    emailHint?: string
    callbackUrl: string
}

interface Challenge {
    id: string
    email: string
}

const EMAIL_BELONGS_TO_ANOTHER_ACCOUNT = "email_belongs_to_another_account";

const EMAIL_SCHEMA = Yup.object({
    email: emailField,
});

export function ConfirmEmailForm(props: Props) {
    const { update } = useSession();
    const [bffGateway] = useState(() => new BFFAPI());
    const [email, setEmail] = useState(props.emailHint ?? "");
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function requestCode(values: { email: string }) {
        const typed = values.email.trim();
        setError(null);
        setEmail(typed);
        try {
            const { challengeId } = await bffGateway.requestEmailVerification(typed);
            setChallenge({ id: challengeId, email: typed });
        } catch (e) {
            setError(accountErrorMessage(e?.response?.data?.detail));
        }
    }

    async function confirmCode(code: string) {
        try {
            await bffGateway.confirmEmailVerification(challenge.id, code);
        } catch (e) {
            if (e?.response?.status === 409) {
                setChallenge(null);
                setError(accountErrorMessage(EMAIL_BELONGS_TO_ANOTHER_ACCOUNT));
                return;
            }
            throw e;
        }
        await update();
        await Router.replace(props.callbackUrl);
    }

    async function resendCode() {
        await bffGateway.resendChallenge(challenge.id);
    }

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
                <h1 className="m-0 text-[26px] leading-[1.2] font-semibold tracking-[-0.02em] text-primary-900">Confirm your email</h1>
                <p className="m-0 text-[15px] leading-6 text-primary-600">
                    Every DataMap account has a confirmed email. We&apos;ll send a 6-digit code to the address below;
                    type it here to finish signing in with ORCID.
                </p>
            </div>

            {error && <p role="alert" className="m-0 text-sm text-error-600">{error}</p>}

            {challenge ? (
                <div className="flex flex-col gap-3">
                    <VerificationCodeForm email={challenge.email} onSubmit={confirmCode} onResend={resendCode} />
                    <button
                        type="button"
                        className="self-start text-sm font-medium text-primary-900 underline underline-offset-2"
                        onClick={() => setChallenge(null)}
                    >
                        Use a different email
                    </button>
                </div>
            ) : (
                <Formik initialValues={{ email }} validationSchema={EMAIL_SCHEMA} onSubmit={requestCode}>
                    {({ isSubmitting }) => (
                        <Form noValidate className="flex flex-col gap-2">
                            <label htmlFor="confirm-email" className={EDIT_FORM_LABEL_CLASS}>Email</label>
                            <Field id="confirm-email" name="email" type="email" autoComplete="email" className={EDIT_FORM_INPUT_CLASS} />
                            <ErrorMessage name="email" component="p" className={EDIT_FORM_ERROR_CLASS} />
                            <button type="submit" disabled={isSubmitting} className="btn-primary m-0 mt-2 self-start disabled:opacity-60">
                                Send code
                            </button>
                        </Form>
                    )}
                </Formik>
            )}

            <p className="m-0 text-[13px] leading-5 text-primary-500">
                Not now?{" "}
                <button
                    type="button"
                    className="font-medium text-primary-900 underline underline-offset-2"
                    onClick={() => signOut({ callbackUrl: SIGN_OUT_CALLBACK_URL })}
                >
                    Sign out
                </button>
            </p>
        </div>
    );
}
