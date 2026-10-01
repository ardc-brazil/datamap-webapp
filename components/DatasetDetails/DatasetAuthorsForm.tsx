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

interface Props {
    dataset: GetDatasetDetailsResponse
    user?: UserDetailsResponse
    alwaysEdition?: boolean
}

export default function DatasetAuthorsForm(props: Props) {
    const bffGateway = new BFFAPI();
    const infoText = "Credit people who helped create the data.";
    const [editing, setEditing] = useState(false);
    const canEdit = canEditDataset(props.user);

    function handleEditClick(event): void {
        setEditing(true);
    }

    function handleCancelClick(event): void {
        setEditing(false)
    }

    const schema = Yup.object().shape({
        authors: Yup.array()
            .of(
                Yup.object().shape({
                    name: Yup.string()
                        .max(255, "Name should be less than 255 characters")
                        .required("Name is required.")
                })
            )
    });

    function onSubmit(values, { setSubmitting }) {
        setSubmitting(true);
        props.dataset.data.authors = values.authors;

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
                    authors: props.dataset.data.authors ?? [{}]
                }}
                validationSchema={schema}
                onSubmit={onSubmit}
            >
                {({ isSubmitting, values, setFieldTouched }) => (
                    <Form className="w-full">
                        <FieldArray name="authors">
                            {(arrayHelpers: ArrayHelpers) => {
                                return (
                                    <div className="w-full">
                                        <p className={EDIT_FORM_HINT_CLASS}>
                                            {infoText}
                                        </p>

                                        <div className="flex flex-col gap-3 pt-3">
                                            {values.authors?.length > 0 &&
                                                values.authors.map((item: any, index: number) => {
                                                    return (
                                                        <div key={index}>
                                                            <label htmlFor={`authors.${index}.name`} className={EDIT_FORM_LABEL_CLASS}>Author name</label>
                                                            <div className="flex items-center gap-2">
                                                                <Field
                                                                    id={`authors.${index}.name`}
                                                                    name={`authors.${index}.name`}
                                                                    className={EDIT_FORM_INPUT_CLASS}
                                                                    placeholder="Informe a name for a author"
                                                                />
                                                                <CloseButton label="Remove author" onClick={() => arrayHelpers.remove(index)} />
                                                            </div>

                                                            <ErrorMessage
                                                                name={`authors.${index}.name`}
                                                                component="div"
                                                                className={EDIT_FORM_ERROR_CLASS}
                                                            />
                                                        </div>
                                                    )
                                                })
                                            }
                                        </div>

                                        <button type="button" className="mt-3 text-[13px] font-semibold text-primary-700 hover:text-primary-900" onClick={() => arrayHelpers.push({})}>+ Add author</button>

                                        <EditFormActions onCancel={handleCancelClick} isSubmitting={isSubmitting} />
                                    </div>
                                )
                            }}
                        </FieldArray>
                    </Form>
                )}
            </Formik>
        );
    } else if (props?.dataset?.data?.authors?.length > 0) {
        // Print the license information
        return <div className="flex flex-row w-full items-start justify-between gap-4">
            <span className="w-full text-primary-900">
                {props.dataset?.data?.authors?.map(author => author.name).join(", ")}
            </span>
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
