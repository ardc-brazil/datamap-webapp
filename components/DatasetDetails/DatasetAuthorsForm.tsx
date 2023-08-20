import axios from 'axios';
import { ArrayHelpers, ErrorMessage, Field, FieldArray, Form, Formik } from 'formik';
import { useState } from 'react';
import * as Yup from 'yup';
import CloseButton from '../base/CloseButton';
import { CardItem } from "./CardItem";

export default function DatasetAuthorsForm(props) {

    const infoText = "Credit people who helped create the data.";
    const [editing, setEditing] = useState(false);

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
        props.dataset.authors = values.authors;

        axios.put("/api/datasets/" + props.dataset.id, props.dataset)
            .then(response => {
                if (response.status == 200) {
                    setEditing(false);
                } else {
                    console.log(response);
                    alert("Sorry! Error...");
                }
            })
            .catch(error => {
                console.log(error);
                alert("Sorry! Error...");
            })
            .finally(() => setSubmitting(false));
    }

    function EditButton() {
        return <button className={`${editing && "hidden"} btn-primary-outline btn-small h-8 w-16`} onClick={handleEditClick}>Edit</button>
    }

    if (editing || props.alwaysEdition) {
        return (
            <Formik
                initialValues={{
                    authors: props.dataset.authors
                }}
                validationSchema={schema}
                onSubmit={onSubmit}
            >
                {({ isSubmitting, values, setFieldTouched }) => (
                    <Form>
                        <div className="flex flex-row items-center">
                            <div className="w-full">
                                <FieldArray name="authors">
                                    {(arrayHelpers: ArrayHelpers) => {
                                        return (
                                            <div className="flex">
                                                <div className="w-full">
                                                    <p className="text-primary-500 italic w-full">
                                                        {infoText}
                                                    </p>

                                                    {values.authors?.length > 0 &&
                                                        values.authors.map((item: any, index: number) => {
                                                            console.log(item);
                                                            return (
                                                                <div className="py-2" key={index}>
                                                                    <label htmlFor={`authors.${index}.name`}>Author Name</label>
                                                                    <div className="flex items-center gap-2">
                                                                        <Field
                                                                            id={`authors.${index}.name`}
                                                                            name={`authors.${index}.name`}
                                                                            className="invalid:border-error-500 border"
                                                                            placeholder="Informe a name for a author"
                                                                        />
                                                                        <CloseButton onClick={() => arrayHelpers.remove(index)} />
                                                                    </div>

                                                                    <ErrorMessage
                                                                        name={`authors.${index}.name`}
                                                                        component="div"
                                                                        className="text-xs text-error-600"
                                                                    />
                                                                </div>
                                                            )
                                                        })
                                                    }

                                                    <button type="button" onClick={() => arrayHelpers.push({})}>+ Add Author</button>

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
    } else if (props.dataset.authors && props.dataset.authors.length > 0) {
        // Print the license information
        return <div className="flex flex-row w-full items-center">
            <p className="text-primary-500 w-full">
                {props.dataset.authors?.map((author, index) =>
                    <CardItem key={index} title="Author Name" className="py-2">{author.name}</CardItem>)}
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
