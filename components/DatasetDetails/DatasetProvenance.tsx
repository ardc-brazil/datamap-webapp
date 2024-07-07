import { ErrorMessage, Field, Form, Formik } from 'formik';
import { useState } from 'react';
import * as Yup from 'yup';
import { BFFAPI } from "../../gateways/BFFAPI";
import { UserDetailsResponse, canEditDataset } from "../../lib/users";
import { GetDatasetDetailsResponse, UpdateDatasetRequest } from "../../types/BffAPI";
import { CardItem } from "./CardItem";

interface Props {
    dataset: GetDatasetDetailsResponse
    user?: UserDetailsResponse
    alwaysEdition?: boolean
}

export default function DatasetProvenance(props: Props) {
    const bffGateway = new BFFAPI();
    const infoText = "Add provenance information from your dataset.";
    const [editing, setEditing] = useState(false);
    const canEdit = canEditDataset(props.user);

    function handleEditClick(event): void {
        setEditing(true);
    }

    function handleCancelClick(event): void {
        setEditing(false)
    }

    const schema = Yup.object().shape({
        provenance: Yup.object().shape({
            source: Yup.string()
                .max(255, "Source should be less than 255 characters")
                .required("Source is required."),
            instrument: Yup.string()
                .max(255, "Instrument should be less than 255 characters")
                .required("Instruct is required."),
        })
    });

    function onSubmit(values, { setSubmitting }) {
        setSubmitting(true);
        props.dataset.data.source = values.provenance.source;
        props.dataset.data.source_instrument = values.provenance.instrument;

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
                initialValues={{
                    provenance: {
                        source: props.dataset.data.source,
                        instrument: props.dataset.data.source_instrument
                    }
                }}
                validationSchema={schema}
                onSubmit={onSubmit}
            >
                {({ isSubmitting, values }) => (
                    <Form>
                        <div className="flex flex-row items-center">
                            <div className="w-full">
                                <div className="flex">
                                    <div className="w-full">
                                        <p className="text-primary-500 italic w-full">
                                            {infoText}
                                        </p>
                                        <div className="py-2" >
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="flex items-center w-full gap-2">
                                                    <div className="w-full">
                                                        <label htmlFor={`provenance.source`}>Source</label>
                                                        <Field
                                                            id={`provenance.source`}
                                                            name={`provenance.source`}
                                                            className="invalid:border-error-500 border"
                                                            placeholder="NOAA, NASA, ARM"
                                                        />
                                                        <ErrorMessage
                                                            name={`provenance.source`}
                                                            component="div"
                                                            className="text-xs text-error-600"
                                                        />
                                                    </div>
                                                    <div className="w-full">
                                                        <label htmlFor={`provenance.instrument`}>Instrument</label>
                                                        <Field
                                                            id={`provenance.instrument`}
                                                            name={`provenance.instrument`}
                                                            className="invalid:border-error-500 border"
                                                            placeholder="Condensation Particle Counter, MPL, SONDE"
                                                        />
                                                        <ErrorMessage
                                                            name={`provenance.instrument`}
                                                            component="div"
                                                            className="text-xs text-error-600"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex w-64 h-10 gap-2 pl-4">
                                        <button type="button" className="btn-primary-outline btn-small" onClick={handleCancelClick}>Cancel</button>
                                        <button type="submit" className="btn-primary btn-small" disabled={isSubmitting}>Save</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Form>
                )}
            </Formik>
        );
    }

    // Default value
    return <div className="flex flex-row w-full items-center">
        <p className="text-primary-500 w-full">
            <div className="flex gap-28 py-4">
                <CardItem title="SOURCES">
                    {!props.dataset.data.source && "No source informed."}
                    {props.dataset.data.source && props.dataset.data.source}
                </CardItem>
            </div>
            <div className="flex gap-28 py-4">
                <CardItem title="Source instrument">
                    {!props.dataset.data.source && "No instrument informed."}
                    {props.dataset.data.source && props.dataset.data.source_instrument}
                </CardItem>
            </div>
        </p>
        <EditButton />
    </div>
}

