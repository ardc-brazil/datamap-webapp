import { ErrorMessage, Field, Form, Formik } from 'formik';
import { useState } from 'react';
import * as Yup from 'yup';
import { EDIT_FORM_ERROR_CLASS, EDIT_FORM_INPUT_CLASS } from "../../contants/EditFormConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import { UserDetailsResponse, canEditDataset } from "../../lib/users";
import { GetDatasetDetailsResponse, UpdateDatasetRequest } from "../../types/BffAPI";
import { EditFormActions } from "./EditFormActions";
import { TextActionButton } from "./TextActionButton";

interface Props {
    dataset: GetDatasetDetailsResponse
    user?: UserDetailsResponse
    alwaysEdition?: boolean
}

export default function DatasetInstitution(props: Props) {
    const bffGateway = new BFFAPI();
    const [editing, setEditing] = useState(false);
    const canEdit = canEditDataset(props.user, props.dataset);

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
        return <TextActionButton hidden={!canEdit} className="pl-2" onClick={handleEditClick}>Edit</TextActionButton>
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
                    <Form className="basis-full w-full max-w-2xl">
                        <div className="flex flex-row flex-wrap items-start gap-2">
                            <div className="min-w-0 flex-1 sm:min-w-[22rem]">
                                <Field
                                    type="text"
                                    id="institution"
                                    name="institution"
                                    aria-label="Institution"
                                    placeholder="What is the institution owner of this dataset?"
                                    className={EDIT_FORM_INPUT_CLASS.replace("h-10", "h-9")}
                                />
                                <ErrorMessage
                                    name="institution"
                                    component="div"
                                    className={EDIT_FORM_ERROR_CLASS}
                                />
                            </div>
                            <EditFormActions className="flex flex-none gap-2" onCancel={handleCancelClick} isSubmitting={isSubmitting} />
                        </div>
                    </Form>
                )}
            </Formik>
        );
    } else if (props.dataset.data.institution) {
        // Print the institution information
        return <span>
            {props.dataset.data.institution}
            <EditButton />
        </span>
    } else {

        // when no institution is informed
        return (
            <span className="text-primary-500">
                Add a institution <EditButton />
            </span>
        );
    }
}
