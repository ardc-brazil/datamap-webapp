import { useFormik } from "formik";
import { useState } from "react";
import * as Yup from "yup";
import { BFFAPI } from "../../../gateways/BFFAPI";
import { AdminTenancy } from "../../../types/GatekeeperAPI";
import { AdminDialog } from "../AdminDialog";
import { NEW_TENANCY_SCHEMA, NewTenancyFailure, NewTenancyFields, newTenancyFailure } from "../NewTenancyFields";

interface Props {
    onCancel(): void
    onCreated(tenancy: AdminTenancy): void
}

const schema = Yup.object(NEW_TENANCY_SCHEMA);

export function NewTenancyDialog({ onCancel, onCreated }: Props) {
    const [failure, setFailure] = useState<NewTenancyFailure | null>(null);
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
                setFailure(newTenancyFailure(e));
            }
        },
    });

    function submit() {
        if (!created && !formik.isSubmitting) {
            formik.submitForm();
        }
    }

    return (
        <AdminDialog
            title="New tenancy"
            widthClassName="max-w-[440px]"
            onClose={onCancel}
            primary={{ label: "Create", disabled: created || formik.isSubmitting, onClick: submit }}
        >
            <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="flex flex-col gap-4" noValidate>
                <NewTenancyFields formik={formik} idPrefix="new-tenancy" failure={failure} onEdit={() => setFailure(null)} className="flex flex-col gap-4" />
                {failure && !failure.field && <p role="alert" className="m-0 text-sm text-danger-700">{failure.message}</p>}
            </form>
        </AdminDialog>
    );
}
