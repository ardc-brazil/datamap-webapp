import { ErrorMessage, Field, Form, Formik } from 'formik';
import { useState } from 'react';
import * as Yup from 'yup';
import { EDIT_FORM_ERROR_CLASS, EDIT_FORM_LABEL_CLASS, EDIT_FORM_SELECT_CLASS, EMPTY_VALUE_CLASS } from "../../contants/EditFormConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import { getAllLicensesIds, licenseMapping } from "../../lib/licenseMapping";
import { UserDetailsResponse, canEditDataset } from "../../lib/users";
import { GetDatasetDetailsResponse, UpdateDatasetRequest } from "../../types/BffAPI";
import { EditFormActions } from "./EditFormActions";
import { TextActionButton } from "./TextActionButton";

interface Props {
    dataset: GetDatasetDetailsResponse
    user?: UserDetailsResponse
    alwaysEdition?: boolean
}

export default function DatasetLicenseForm(props: Props) {
    const bffGateway = new BFFAPI();
    const [editing, setEditing] = useState(false);
    const canEdit = canEditDataset(props.user);

    function handleEditClick(event): void {
        setEditing(true);
    }

    function handleCancelClick(event): void {
        setEditing(false)
    }

    const schema = Yup.object().shape({
        license: Yup.string()
            .max(50, 'Too long. Max 80 chars')
    });

    function onSubmit(values, { setSubmitting }) {
        setSubmitting(true);
        props.dataset.data.license = values.license;

        try {
            const updateDatasetRequest = {
                id: props.dataset.id,
                name: props.dataset.name,
                data: props.dataset.data,
                tenancy: props.dataset.tenancy,
                is_enabled: props.dataset.is_enabled
            } as UpdateDatasetRequest

            bffGateway.updateDataset(updateDatasetRequest);
            setEditing(false);
        } catch (error) {
            console.log(error);
            alert("Sorry! Error...");
        } finally {
            setSubmitting(false);
        }
    }

    function EditButton() {
        return <TextActionButton hidden={editing || !canEdit} className="flex-none" onClick={handleEditClick}>Edit</TextActionButton>
    }

    if (editing || props.alwaysEdition) {
        return (
            <Formik
                initialValues={{ license: props.dataset.data.license }}
                validationSchema={schema}
                onSubmit={onSubmit}
            >
                {({ isSubmitting, values, setFieldTouched }) => (
                    <Form className="w-full">
                        <div className="max-w-md">
                            <label htmlFor="license" className={EDIT_FORM_LABEL_CLASS}>License</label>
                            <Field
                                type="text"
                                id="license"
                                name="license"
                                className={EDIT_FORM_SELECT_CLASS}
                                as="select"
                            >
                                {getAllLicensesIds().map((lic, i) => {
                                    return <option key={i} value={lic}>{licenseMapping[lic]}</option>
                                })}
                            </Field>

                            <ErrorMessage
                                name="license"
                                component="div"
                                className={EDIT_FORM_ERROR_CLASS}
                            />
                        </div>
                        <EditFormActions onCancel={handleCancelClick} isSubmitting={isSubmitting} />
                    </Form>
                )}
            </Formik>
        );
    } else if (props.dataset.data.license) {
        // Print the license information
        return <div className="flex flex-row w-full items-start justify-between gap-4">
            <span className="w-full text-primary-900">
                {licenseMapping[props.dataset.data.license]}
            </span>
            <EditButton />
        </div>
    }

    // when no license is informed
    return (
        <div className="flex flex-row w-full items-start justify-between gap-4">
            <p className={`${EMPTY_VALUE_CLASS} w-full`}>
                Informe a license for your dataset
            </p>
            <EditButton />
        </div>
    );

}
