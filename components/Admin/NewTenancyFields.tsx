import { FormikErrors, FormikTouched } from "formik";
import { FocusEvent, useState } from "react";
import * as Yup from "yup";
import { adminErrorFrom, adminErrorMessage, slugifyNamespace } from "../../contants/AdminConstants";
import { DISPLAY_NAME_MAX_LENGTH, PRODUCTION_PREFIX, isValidNamespace } from "../../contants/TenancyConstants";
import { errorDetail } from "../../lib/gatekeeperDetail";

export type NewTenancyField = "displayName" | "namespace";

export interface NewTenancyValues {
    displayName: string
    namespace: string
}

export interface NewTenancyFailure {
    field: NewTenancyField | null
    message: string
}

const DISPLAY_NAME_ERROR = adminErrorMessage("display_name_invalid");
const NAMESPACE_ERROR = adminErrorMessage("namespace_invalid");
const FIELD_ERROR = "m-0 mt-1.5 text-[13px] text-danger-700";

export const NEW_TENANCY_SCHEMA = {
    displayName: Yup.string().trim().required(DISPLAY_NAME_ERROR).max(DISPLAY_NAME_MAX_LENGTH, DISPLAY_NAME_ERROR),
    namespace: Yup.string().test("namespace", NAMESPACE_ERROR, (value) => isValidNamespace(value ?? "")),
};

const FIELD_OF_DETAIL = new Map<string, NewTenancyField>([
    ["namespace_invalid", "namespace"],
    ["tenancy_exists", "namespace"],
    ["display_name_invalid", "displayName"],
    ["display_name_taken", "displayName"],
]);

export function newTenancyFailure(error: unknown): NewTenancyFailure {
    return { field: FIELD_OF_DETAIL.get(errorDetail(error) ?? "") ?? null, message: adminErrorFrom(error) };
}

interface NewTenancyForm<V extends NewTenancyValues> {
    values: V
    errors: FormikErrors<V>
    touched: FormikTouched<V>
    submitCount: number
    handleBlur(event: FocusEvent<HTMLInputElement>): void
    setValues(update: (values: V) => V): unknown
}

interface Props<V extends NewTenancyValues> {
    formik: NewTenancyForm<V>
    idPrefix: string
    failure: NewTenancyFailure | null
    onEdit(): void
    className: string
    previewSuffix?: string
}

export function NewTenancyFields<V extends NewTenancyValues>({ formik, idPrefix, failure, onEdit, className, previewSuffix }: Props<V>) {
    const [namespaceEdited, setNamespaceEdited] = useState(false);

    function change(values: Partial<NewTenancyValues>) {
        onEdit();
        formik.setValues((current) => ({ ...current, ...values }));
    }

    function errorOf(field: NewTenancyField): string | undefined {
        const invalid = (formik.touched[field] || formik.submitCount > 0) && formik.errors[field];
        return (typeof invalid === "string" ? invalid : undefined) ?? (failure?.field === field ? failure.message : undefined);
    }

    function field(name: NewTenancyField, label: string, id: string, onChange: (value: string) => void, inputClassName?: string) {
        const error = errorOf(name);
        const errorId = `${id}-error`;
        return (
            <div>
                <label htmlFor={id} className="mb-1.5 text-[13px]">{label}</label>
                <input
                    id={id}
                    name={name}
                    className={inputClassName}
                    value={formik.values[name]}
                    onChange={(event) => onChange(event.target.value)}
                    onBlur={formik.handleBlur}
                    aria-describedby={error ? errorId : undefined}
                    aria-invalid={error ? true : undefined}
                />
                {error && <p id={errorId} role="alert" className={FIELD_ERROR}>{error}</p>}
            </div>
        );
    }

    const preview = `${PRODUCTION_PREFIX}${formik.values.namespace.trim()}${previewSuffix ?? ""}`;

    return (
        <>
            <div className={className}>
                {field("displayName", "Display name", `${idPrefix}-display-name`, (displayName) => {
                    change(namespaceEdited ? { displayName } : { displayName, namespace: slugifyNamespace(displayName) });
                })}
                {field("namespace", "Namespace", `${idPrefix}-namespace`, (namespace) => {
                    setNamespaceEdited(true);
                    change({ namespace });
                }, "font-mono")}
            </div>
            <p className="m-0 font-mono text-xs text-primary-500">{preview}</p>
        </>
    );
}
