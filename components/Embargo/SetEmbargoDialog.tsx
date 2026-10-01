import { FormikProvider, useFormik } from "formik";
import { useRouter } from "next/router";
import { useState } from "react";
import { EDIT_FORM_ERROR_CLASS } from "../../contants/EditFormConstants";
import { messageForApiError } from "../../contants/EmbargoConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import { embargoRequestFrom, validateEmbargoDate } from "../../lib/embargoDates";
import { tenancyDisplayName } from "../../lib/embargoDisplay";
import { GetDatasetDetailsResponse } from "../../types/BffAPI";
import Modal from "../base/PopupModal";
import { EmbargoFields } from "./EmbargoFields";

export function SetEmbargoDialog(props: { dataset: GetDatasetDetailsResponse, show: boolean, onClose(): void }) {
    const [bffGateway] = useState(() => new BFFAPI());
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const formik = useFormik({
        initialValues: { embargoMode: "hidden", embargoUntil: "", embargoNote: "" },
        validate: (values) => {
            const message = validateEmbargoDate(values.embargoUntil, new Date());
            return message ? { embargoUntil: message } : {};
        },
        onSubmit: async (values) => {
            setError(null);
            try {
                const request = embargoRequestFrom(values as any);
                await bffGateway.setEmbargo(props.dataset.id, { ...request, note: values.embargoNote.trim() || null });
                props.onClose();
                router.reload();
            } catch (e) {
                setError(messageForApiError(e));
            }
        },
    });

    return (
        <Modal
            title="Put under embargo"
            show={props.show}
            confimButtonText="Set embargo"
            cancelButtonText="Cancel"
            cancel={props.onClose}
            confim={() => formik.submitForm()}
            maxWidthClassName="max-w-2xl"
        >
            <FormikProvider value={formik}>
                <div className="flex flex-col gap-3">
                    <p className="m-0 text-[13px] text-primary-500">Only you and the people you share it with reach the files until the date you choose.</p>
                    <EmbargoFields tenancyName={tenancyDisplayName(props.dataset.tenancy)} />
                    {error && <p role="alert" className={EDIT_FORM_ERROR_CLASS}>{error}</p>}
                </div>
            </FormikProvider>
        </Modal>
    );
}
