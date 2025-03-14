import { ErrorMessage, Field, Form, Formik } from 'formik';
import { useState } from 'react';
import * as Yup from 'yup';
import { BFFAPI } from "../../gateways/BFFAPI";
import { getAllLicensesIds, licenseMapping } from "../../lib/licenseMapping";
import { UserDetailsResponse, canEditDataset } from "../../lib/users";
import { GetDatasetDetailsResponse, UpdateDatasetRequest } from "../../types/BffAPI";

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
        return <button className={`${(editing || !canEdit) && "hidden"} btn-primary-outline btn-small h-8 w-16`} onClick={handleEditClick}>Edit</button>
    }

    if (editing || props.alwaysEdition) {
        return (
            <Formik
                initialValues={{ license: props.dataset.data.license }}
                validationSchema={schema}
                onSubmit={onSubmit}
            >
                {({ isSubmitting, values, setFieldTouched }) => (
                    <Form>
                        <div className="flex flex-row items-center">
                            <div className="w-full h-12">
                                <Field
                                    type="text"
                                    id="license"
                                    name="license"
                                    className="invalid:border-error-500"
                                    as="select"
                                >
                                    {getAllLicensesIds().map((lic, i) => {
                                        return <option key={i} value={lic}>{licenseMapping[lic]}</option>
                                    })}
                                </Field>

                                <ErrorMessage
                                    name="license"
                                    component="div"
                                    className="text-xs text-error-600"
                                />
                            </div>
                            <div className="flex w-64 h-10 gap-2 pl-4">
                                <button type="button" className="btn-primary-outline btn-small" onClick={handleCancelClick}>Cancel</button>
                                <button type="submit" className="btn-primary btn-small" disabled={isSubmitting}>Save</button>
                            </div>
                        </div>
                    </Form>
                )}
            </Formik>
        );
    } else if (props.dataset.data.license) {
        // Print the license information
        return <div className="flex flex-row w-full items-center">
            <p className="text-primary-500 w-full">
                {licenseMapping[props.dataset.data.license]}
            </p>
            <EditButton />
        </div>
    }

    // when no license is informed
    return (
        <div className="flex flex-row w-full items-center">
            <p className="text-primary-500 italic w-full">
                Informe a license for your dataset
            </p>
            <EditButton />
        </div>
    );

}
