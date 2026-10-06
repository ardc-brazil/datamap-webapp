import { useFormik } from "formik";
import { useState } from "react";
import * as Yup from "yup";
import { BFFAPI } from "../../../gateways/BFFAPI";
import { useSubmitOnce } from "../../../hooks/UseSubmitOnce";
import { AdminTenancy } from "../../../types/GatekeeperAPI";
import { DialogError } from "../../base/DialogError";
import { AdminDialog } from "../AdminDialog";
import { NEW_TENANCY_SCHEMA, NewTenancyFailure, NewTenancyFields, newTenancyFailure } from "../NewTenancyFields";

interface Props {
    onCancel(): void
    onCreated(tenancy: AdminTenancy): void
}

const schema = Yup.object(NEW_TENANCY_SCHEMA);

export function NewTenancyDialog({ onCancel, onCreated }: Props) {
    const [failure, setFailure] = useState<NewTenancyFailure | null>(null);
    const { submit, busy, done } = useSubmitOnce();
    const formik = useFormik({
        initialValues: { displayName: "", namespace: "" },
        validationSchema: schema,
        onSubmit: async (values) => {
            setFailure(null);
            try {
                await submit(async () => {
                    onCreated(await new BFFAPI().createTenancy({ displayName: values.displayName.trim(), namespace: values.namespace.trim() }));
                });
            } catch (e) {
                setFailure(newTenancyFailure(e));
            }
        },
    });

    return (
        <AdminDialog
            title="New tenancy"
            widthClassName="max-w-[440px]"
            onClose={onCancel}
            cancelDisabled={busy}
            primary={{ label: "Create", disabled: busy || done, onClick: () => { void formik.submitForm(); } }}
        >
            <form onSubmit={(event) => event.preventDefault()} className="flex flex-col gap-4" noValidate>
                <NewTenancyFields formik={formik} idPrefix="new-tenancy" failure={failure} onEdit={() => setFailure(null)} className="flex flex-col gap-4" />
                <DialogError message={failure && !failure.field ? failure.message : null} />
            </form>
        </AdminDialog>
    );
}
