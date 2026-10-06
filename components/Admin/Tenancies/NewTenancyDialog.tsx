import { useFormik } from "formik";
import { useState } from "react";
import * as Yup from "yup";
import { adminErrorFrom, adminErrorMessage, slugifyNamespace } from "../../../contants/AdminConstants";
import { DISPLAY_NAME_MAX_LENGTH, PRODUCTION_PREFIX, isValidNamespace } from "../../../contants/TenancyConstants";
import { BFFAPI } from "../../../gateways/BFFAPI";
import { errorDetail } from "../../../lib/gatekeeperDetail";
import { AdminTenancy } from "../../../types/GatekeeperAPI";
import { AdminDialog } from "../AdminDialog";

type Field = "displayName" | "namespace";

interface Props {
    onCancel(): void
    onCreated(tenancy: AdminTenancy): void
}

const FIELD_ERROR = "m-0 mt-1.5 text-[13px] text-danger-700";
const NAMESPACE_ERROR = adminErrorMessage("namespace_invalid");
const DISPLAY_NAME_ERROR = adminErrorMessage("display_name_invalid");
const FIELD_OF_DETAIL = new Map<string, Field>([
    ["namespace_invalid", "namespace"],
    ["tenancy_exists", "namespace"],
    ["display_name_invalid", "displayName"],
    ["display_name_taken", "displayName"],
]);
const ERROR_ID: Record<Field, string> = { displayName: "new-tenancy-display-name-error", namespace: "new-tenancy-namespace-error" };

const schema = Yup.object({
    displayName: Yup.string().trim().required(DISPLAY_NAME_ERROR).max(DISPLAY_NAME_MAX_LENGTH, DISPLAY_NAME_ERROR),
    namespace: Yup.string().test("namespace", NAMESPACE_ERROR, (value) => isValidNamespace(value ?? "")),
});

export function NewTenancyDialog({ onCancel, onCreated }: Props) {
    const [failure, setFailure] = useState<{ field: Field | null; message: string } | null>(null);
    const [namespaceEdited, setNamespaceEdited] = useState(false);
    const [created, setCreated] = useState(false);
    const formik = useFormik({
        initialValues: { displayName: "", namespace: "" },
        validationSchema: schema,
        onSubmit: async (values) => {
            setFailure(null);
            try {
                const tenancy = await new BFFAPI().createTenancy({ displayName: values.displayName.trim(), namespace: values.namespace.trim() });
                setCreated(true);
                onCreated(tenancy);
            } catch (e) {
                setFailure({ field: FIELD_OF_DETAIL.get(errorDetail(e) ?? "") ?? null, message: adminErrorFrom(e) });
            }
        },
    });

    function submit() {
        if (!created && !formik.isSubmitting) {
            formik.submitForm();
        }
    }

    function change(values: Partial<Record<Field, string>>) {
        setFailure(null);
        formik.setValues({ ...formik.values, ...values });
    }

    function errorOf(field: Field): string | undefined {
        const invalid = (formik.touched[field] || formik.submitCount > 0) && formik.errors[field];
        return invalid || (failure?.field === field ? failure.message : undefined);
    }

    function fieldProps(field: Field) {
        const error = errorOf(field);
        return {
            name: field,
            value: formik.values[field],
            onBlur: formik.handleBlur,
            "aria-describedby": error ? ERROR_ID[field] : undefined,
            "aria-invalid": error ? true : undefined,
        };
    }

    const displayNameError = errorOf("displayName");
    const namespaceError = errorOf("namespace");

    return (
        <AdminDialog
            title="New tenancy"
            widthClassName="max-w-[440px]"
            onClose={onCancel}
            primary={{ label: "Create", disabled: created || formik.isSubmitting, onClick: submit }}
        >
            <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="flex flex-col gap-4" noValidate>
                <div>
                    <label htmlFor="new-tenancy-display-name" className="mb-1.5 text-[13px]">Display name</label>
                    <input
                        id="new-tenancy-display-name"
                        {...fieldProps("displayName")}
                        onChange={(event) => {
                            const displayName = event.target.value;
                            change(namespaceEdited ? { displayName } : { displayName, namespace: slugifyNamespace(displayName) });
                        }}
                    />
                    {displayNameError && <p id={ERROR_ID.displayName} role="alert" className={FIELD_ERROR}>{displayNameError}</p>}
                </div>
                <div>
                    <label htmlFor="new-tenancy-namespace" className="mb-1.5 text-[13px]">Namespace</label>
                    <input
                        id="new-tenancy-namespace"
                        className="font-mono"
                        {...fieldProps("namespace")}
                        onChange={(event) => {
                            setNamespaceEdited(true);
                            change({ namespace: event.target.value });
                        }}
                    />
                    {namespaceError && <p id={ERROR_ID.namespace} role="alert" className={FIELD_ERROR}>{namespaceError}</p>}
                </div>
                <p className="m-0 font-mono text-xs text-primary-500">{`${PRODUCTION_PREFIX}${formik.values.namespace.trim()}`}</p>
                {failure && !failure.field && <p role="alert" className="m-0 text-sm text-danger-700">{failure.message}</p>}
            </form>
        </AdminDialog>
    );
}
