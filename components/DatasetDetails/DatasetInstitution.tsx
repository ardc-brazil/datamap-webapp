import { ErrorMessage, Field, Form, Formik } from 'formik';
import { useState } from 'react';
import * as Yup from 'yup';
import { EDIT_FORM_ERROR_CLASS, EDIT_FORM_INPUT_CLASS } from "../../contants/EditFormConstants";
import { useDatasetSave } from "../../hooks/UseDatasetSave";
import { UserDetailsResponse, canEditDataset } from "../../lib/users";
import { GetDatasetDetailsResponse } from "../../types/BffAPI";
import { EditFormActions } from "./EditFormActions";
import { EditFormError } from "./EditFormError";
import { TextActionButton } from "./TextActionButton";

interface Props {
    dataset: GetDatasetDetailsResponse
    user?: UserDetailsResponse
    alwaysEdition?: boolean
}

export default function DatasetInstitution(props: Props) {
    const { save, error, clearError } = useDatasetSave(props.dataset);
    const [editing, setEditing] = useState(false);
    const canEdit = canEditDataset(props.user, props.dataset);

    function handleEditClick(event): void {
        setEditing(true);
    }

    function handleCancelClick(event): void {
        clearError();
        setEditing(false)
    }

    const schema = Yup.object().shape({
        institution: Yup.string()
            .max(50, 'Too long. Max 80 chars')
    });

    async function onSubmit(values) {
        if (await save({ data: { institution: values.institution } })) {
            setEditing(false);
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
                        <EditFormError error={error} />
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
