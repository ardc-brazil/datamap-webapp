import { ArrayHelpers, ErrorMessage, Field, FieldArray, Form, Formik } from 'formik';
import { useState } from 'react';
import * as Yup from 'yup';
import { BFFAPI } from "../../gateways/BFFAPI";
import { UserDetailsResponse, canEditDataset } from "../../lib/users";
import { GetDatasetDetailsResponse, UpdateDatasetRequest } from "../../types/BffAPI";
import CloseButton from '../base/CloseButton';
import { CardItem } from "./CardItem";

interface Props {
    dataset: GetDatasetDetailsResponse
    user?: UserDetailsResponse
    alwaysEdition?: boolean
}

export default function DatasetColaboratorsForm(props: Props) {
    const bffGateway = new BFFAPI();
    const infoText = "Add collaborators who are responsible for maintaining the dataset including being available for questions from users.";
    const [editing, setEditing] = useState(false);
    const canEdit = canEditDataset(props.user);

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
                    permission: Yup.string().required("Select one")
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
        return <button className={`${(editing || !canEdit) && "hidden"} btn-primary-outline btn-small h-8 w-16`} onClick={handleEditClick}>Edit</button>
    }

    function getPermissionDescription(permission: string) {
        if (permission === "owner") {
            return "(Owner)";
        } else if (permission === "can_view") {
            return "(Viewer)";
        } else if (permission === "can_edit") {
            return "(Editor)";
        }

        return "";
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
                    <Form>
                        <div className="flex flex-row items-center">
                            <div className="w-full">
                                <FieldArray name="colaborators">
                                    {(arrayHelpers: ArrayHelpers) => {
                                        return (
                                            <div className="flex">
                                                <div className="w-full">
                                                    <p className="text-primary-500 italic w-full">
                                                        {infoText}
                                                    </p>

                                                    {values.colaborators?.length > 0 &&
                                                        values.colaborators.map((item: any, index: number) => {
                                                            return (
                                                                <div className="py-2" key={index}>

                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-full">
                                                                            <label htmlFor={`colaborators.${index}.name`}>Name</label>
                                                                            <Field
                                                                                id={`colaborators.${index}.name`}
                                                                                name={`colaborators.${index}.name`}
                                                                                className="invalid:border-error-500 border"
                                                                                placeholder="Informe a name for a colaborator"
                                                                            />
                                                                            <ErrorMessage
                                                                                name={`colaborators.${index}.name`}
                                                                                component="div"
                                                                                className="text-xs text-error-600"
                                                                            />
                                                                        </div>
                                                                        <div className="mx-4 w-36">
                                                                            <label htmlFor={`colaborators.${index}.name`}>Permission</label>
                                                                            <Field
                                                                                type="text"
                                                                                id={`colaborators.${index}.permission`}
                                                                                name={`colaborators.${index}.permission`}
                                                                                className="invalid:border-error-500"
                                                                                as="select"
                                                                            >
                                                                                <option value="">Select</option>
                                                                                <option value="owner">Owner</option>
                                                                                <option value="can_view">Can view</option>
                                                                                <option value="can_edit">Can edit</option>
                                                                            </Field>
                                                                            <ErrorMessage
                                                                                name={`colaborators.${index}.permission`}
                                                                                component="div"
                                                                                className="text-xs text-error-600"
                                                                            />
                                                                        </div>
                                                                        <div className="flex items-center justify-center w-16">
                                                                            <CloseButton onClick={() => arrayHelpers.remove(index)} />
                                                                        </div>
                                                                    </div>


                                                                </div>
                                                            )
                                                        })
                                                    }

                                                    <button type="button" onClick={() => arrayHelpers.push({})}>+ Add Colaborator</button>

                                                </div>
                                                <div className="flex w-64 h-10 gap-2 pl-4">
                                                    <button type="button" className="btn-primary-outline btn-small" onClick={handleCancelClick}>Cancel</button>
                                                    <button type="submit" className="btn-primary btn-small" disabled={isSubmitting}>Save</button>
                                                </div>
                                            </div>
                                        )
                                    }}
                                </FieldArray>
                            </div>
                        </div>
                    </Form>
                )}
            </Formik>
        );
    } else if (props?.dataset?.data?.colaborators?.length > 0) {
        // Print the license information
        return <div className="flex flex-row w-full items-center">
            <p className="text-primary-500 w-full">
                {props?.dataset?.data?.colaborators?.map((person, index) =>
                    <CardItem key={index} title="Colaborator Name" className="py-2">{`${person.name} ${getPermissionDescription(person.permission)}`}</CardItem>)}
            </p>
            <EditButton />
        </div>
    }

    // when no license is informed
    return (
        <div className="flex flex-row w-full items-center">
            <p className="text-primary-500 italic w-full">
                {infoText}
            </p>
            <EditButton />
        </div>
    );

}
