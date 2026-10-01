import { ArrayHelpers, ErrorMessage, Field, FieldArray, Form, Formik } from 'formik';
import { useState } from 'react';
import * as Yup from 'yup';
import { EDIT_FORM_ERROR_CLASS, EDIT_FORM_HINT_CLASS, EDIT_FORM_INPUT_CLASS, EDIT_FORM_LABEL_CLASS, EMPTY_VALUE_CLASS } from "../../contants/EditFormConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import { UserDetailsResponse, canEditDataset } from "../../lib/users";
import { GetDatasetDetailsResponse, UpdateDatasetRequest } from "../../types/BffAPI";
import CloseButton from '../base/CloseButton';
import { EditFormActions } from "./EditFormActions";
import { TextActionButton } from "./TextActionButton";

export const CONTRIBUTORS_ACCESS_NOTE = "Listing someone here credits them; it does not give them access. To give someone access to this dataset, use Share.";

interface Props {
    dataset: GetDatasetDetailsResponse
    user?: UserDetailsResponse
    alwaysEdition?: boolean
}

export default function DatasetColaboratorsForm(props: Props) {
    const bffGateway = new BFFAPI();
    const infoText = "Add collaborators who are responsible for maintaining the dataset including being available for questions from users.";
    const [editing, setEditing] = useState(false);
    const canEdit = canEditDataset(props.user, props.dataset);

    function handleEditClick(event): void {
        setEditing(true);
    }

    function handleCancelClick(event): void {
        setEditing(false)
    }

    const schema = Yup.object().shape({
        colaborators: Yup.array()
            .of(
                Yup.object().shape({
                    name: Yup.string()
                        .max(255, "Name should be less than 255 characters")
                        .required("Name is required."),
                })
            )
    });

    function onSubmit(values, { setSubmitting }) {
        setSubmitting(true);
        props.dataset.data.colaborators = values.colaborators;

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
                initialValues={{
                    colaborators: props.dataset.data.colaborators ?? [{}]
                }}
                validationSchema={schema}
                onSubmit={onSubmit}
            >
                {({ isSubmitting, values }) => (
                    <Form className="w-full">
                        <FieldArray name="colaborators">
                            {(arrayHelpers: ArrayHelpers) => {
                                return (
                                    <div className="w-full">
                                        <p className={EDIT_FORM_HINT_CLASS}>
                                            {infoText}
                                        </p>
                                        <p className={EDIT_FORM_HINT_CLASS}>
                                            {CONTRIBUTORS_ACCESS_NOTE}
                                        </p>

                                        <div className="flex flex-col gap-3 pt-3">
                                            {values.colaborators?.length > 0 &&
                                                values.colaborators.map((item: any, index: number) => {
                                                    return (
                                                        <div className="flex items-start gap-2" key={index}>
                                                            <div className="min-w-0 flex-1">
                                                                <label htmlFor={`colaborators.${index}.name`} className={EDIT_FORM_LABEL_CLASS}>Name</label>
                                                                <Field
                                                                    id={`colaborators.${index}.name`}
                                                                    name={`colaborators.${index}.name`}
                                                                    className={EDIT_FORM_INPUT_CLASS}
                                                                    placeholder="Name of a contributor"
                                                                />
                                                                <ErrorMessage
                                                                    name={`colaborators.${index}.name`}
                                                                    component="div"
                                                                    className={EDIT_FORM_ERROR_CLASS}
                                                                />
                                                            </div>
                                                            <div className="pt-[26px]">
                                                                <CloseButton label="Remove collaborator" onClick={() => arrayHelpers.remove(index)} />
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            }
                                        </div>

                                        <button type="button" className="mt-3 text-[13px] font-semibold text-primary-700 hover:text-primary-900" onClick={() => arrayHelpers.push({})}>+ Add collaborator</button>

                                        <EditFormActions onCancel={handleCancelClick} isSubmitting={isSubmitting} />
                                    </div>
                                )
                            }}
                        </FieldArray>
                    </Form>
                )}
            </Formik>
        );
    } else if (props?.dataset?.data?.colaborators?.length > 0) {
        // Print the license information
        return <div className="flex flex-row w-full items-start justify-between gap-4">
            <ul className="w-full flex flex-col gap-1 text-primary-900">
                {props?.dataset?.data?.colaborators?.map((person, index) =>
                    <li key={index}>
                        {person.name}
                    </li>)}
            </ul>
            <EditButton />
        </div>
    }

    // when no license is informed
    return (
        <div className="flex flex-row w-full items-start justify-between gap-4">
            <p className={`${EMPTY_VALUE_CLASS} w-full`}>
                {infoText}
            </p>
            <EditButton />
        </div>
    );

}
