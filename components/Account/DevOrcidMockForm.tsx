import { ErrorMessage, Field, Form, Formik } from "formik";
import { getProviders, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import * as Yup from "yup";
import { DEV_ORCID_MOCK_PROVIDER_ID, DEV_ORCID_MOCK_PROVIDER_NAME, ORCID_ID_PATTERN } from "../../contants/AccountConstants";
import { EDIT_FORM_ERROR_CLASS, EDIT_FORM_INPUT_CLASS, EDIT_FORM_LABEL_CLASS } from "../../contants/EditFormConstants";

interface Values {
    orcid: string
    name: string
    email: string
}

const INITIAL_VALUES: Values = { orcid: "", name: "", email: "" };

const SCHEMA = Yup.object({
    orcid: Yup.string()
        .trim()
        .required("Enter an ORCID iD.")
        .matches(ORCID_ID_PATTERN, "Use the form 0000-0000-0000-0000 (the last character may be X)."),
    name: Yup.string().trim(),
    email: Yup.string().trim().email("Enter a valid email address."),
});

/** Shown only when the server registered the mock, which it does only in development with ENABLE_DEV_ORCID_MOCK=true. */
export function DevOrcidMockForm(props: { callbackUrl: string }) {
    const [registered, setRegistered] = useState(false);

    useEffect(() => {
        let mounted = true;
        getProviders()
            .then((providers) => {
                if (mounted) {
                    setRegistered(Boolean(providers?.[DEV_ORCID_MOCK_PROVIDER_ID]));
                }
            })
            .catch(() => undefined);
        return () => {
            mounted = false;
        };
    }, []);

    if (!registered) {
        return null;
    }

    function submit(values: Values) {
        return signIn(DEV_ORCID_MOCK_PROVIDER_ID, {
            orcid: values.orcid.trim(),
            name: values.name.trim(),
            email: values.email.trim(),
            callbackUrl: props.callbackUrl,
        });
    }

    return (
        <section data-testid="dev-orcid-mock" className="mt-2 mb-2 flex flex-col gap-2 rounded-lg border border-dashed border-primary-300 p-4">
            <p className="m-0 text-sm font-semibold text-primary-900">{DEV_ORCID_MOCK_PROVIDER_NAME}</p>
            <p className="m-0 text-[13px] leading-5 text-primary-500">
                Development only. Signs in as any ORCID iD without asking ORCID; the public email stands in for the one ORCID would return.
            </p>
            <Formik initialValues={INITIAL_VALUES} validationSchema={SCHEMA} onSubmit={submit}>
                {({ isSubmitting }) => (
                    <Form noValidate className="flex flex-col gap-2">
                        <label htmlFor="dev-orcid-id" className={EDIT_FORM_LABEL_CLASS}>ORCID iD</label>
                        <Field id="dev-orcid-id" name="orcid" placeholder="0000-0000-0000-0000" autoComplete="off" className={EDIT_FORM_INPUT_CLASS} />
                        <ErrorMessage name="orcid" component="p" className={EDIT_FORM_ERROR_CLASS} />

                        <label htmlFor="dev-orcid-name" className={EDIT_FORM_LABEL_CLASS}>Name (optional)</label>
                        <Field id="dev-orcid-name" name="name" autoComplete="off" className={EDIT_FORM_INPUT_CLASS} />

                        <label htmlFor="dev-orcid-email" className={EDIT_FORM_LABEL_CLASS}>Public email (optional)</label>
                        <Field id="dev-orcid-email" name="email" type="email" autoComplete="off" className={EDIT_FORM_INPUT_CLASS} />
                        <ErrorMessage name="email" component="p" className={EDIT_FORM_ERROR_CLASS} />

                        <button type="submit" disabled={isSubmitting} className="btn-primary-outline m-0 mt-2 self-start disabled:opacity-60">
                            Sign in as this iD
                        </button>
                    </Form>
                )}
            </Formik>
        </section>
    );
}
