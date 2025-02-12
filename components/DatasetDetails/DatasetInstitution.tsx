import { ErrorMessage, Field, Form, Formik } from 'formik';
import { useState } from 'react';
import * as Yup from 'yup';
import { BFFAPI } from "../../gateways/BFFAPI";
import { UserDetailsResponse, canEditDataset } from "../../lib/users";
import { GetDatasetDetailsResponse, UpdateDatasetRequest } from "../../types/BffAPI";

interface Props {
    dataset: GetDatasetDetailsResponse
    user?: UserDetailsResponse
    alwaysEdition?: boolean
}

export default function DatasetInstitution(props: Props) {
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
        institution: Yup.string()
            .max(50, 'Too long. Max 80 chars')
    });

    function onSubmit(values, { setSubmitting }) {
        setSubmitting(true);
        props.dataset.data.institution = values.institution;

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
        return <button className={`${!canEdit && "hidden"} text-primary-400 hover:text-primary-500 underline pl-2`} onClick={handleEditClick}>Edit</button>
    }

    // in edition mode
    // TODO: Check if the user has permission to edit to enable editing mode.
    if (editing || props.alwaysEdition) {
        return (
            <Formik
                initialValues={{ institution: props.dataset.data.institution }}
                validationSchema={schema}
                onSubmit={onSubmit}
            >
                {({ isSubmitting, values, setFieldTouched }) => (
                    <Form>
                        <div className="flex flex-row items-center">
                            <div className="w-full h-12">
                                <Field
                                    type="text"
                                    id="institution"
                                    name="institution"
                                    placeholder="What is the institution owner of this dataset?"
                                    className="invalid:border-error-500"

                                />
                                <ErrorMessage
                                    name="institution"
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
    } else if (props.dataset.data.institution) {
        // Print the institution information
        return <p className="text-primary-500">
            {props.dataset.data.institution}
            <EditButton />
        </p>
    } else {

        // when no institution is informed
        return (
            <p className="text-primary-500">
                Add a institution <EditButton />
            </p>
        );
    }
}
