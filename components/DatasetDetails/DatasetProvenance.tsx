import { ErrorMessage, Field, Form, Formik } from 'formik';
import { useState } from 'react';
import * as Yup from 'yup';
import { EDIT_FORM_ERROR_CLASS, EDIT_FORM_HINT_CLASS, EDIT_FORM_INPUT_CLASS, EDIT_FORM_LABEL_CLASS, EMPTY_VALUE_CLASS } from "../../contants/EditFormConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import { UserDetailsResponse, canEditDataset } from "../../lib/users";
import { GetDatasetDetailsResponse, UpdateDatasetRequest } from "../../types/BffAPI";
import { CardItem } from "./CardItem";
import { EditFormActions } from "./EditFormActions";
import { TextActionButton } from "./TextActionButton";

interface Props {
    dataset: GetDatasetDetailsResponse
    user?: UserDetailsResponse
    alwaysEdition?: boolean
}

export default function DatasetProvenance(props: Props) {
    const bffGateway = new BFFAPI();
    const infoText = "Add provenance information from your dataset.";
    const [editing, setEditing] = useState(false);
    const canEdit = canEditDataset(props.user, props.dataset);

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
        return <TextActionButton hidden={editing || !canEdit} className="flex-none" onClick={handleEditClick}>Edit</TextActionButton>
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
                    <Form className="w-full">
                        <p className={EDIT_FORM_HINT_CLASS}>
                            {infoText}
                        </p>
                        <div className="grid grid-cols-1 gap-3 pt-3">
                            <div className="min-w-0">
                                <label htmlFor={`provenance.source`} className={EDIT_FORM_LABEL_CLASS}>Source</label>
                                <Field
                                    id={`provenance.source`}
                                    name={`provenance.source`}
                                    className={EDIT_FORM_INPUT_CLASS}
                                    placeholder="NOAA, NASA, ARM"
                                />
                                <ErrorMessage
                                    name={`provenance.source`}
                                    component="div"
                                    className={EDIT_FORM_ERROR_CLASS}
                                />
                            </div>
                            <div className="min-w-0">
                                <label htmlFor={`provenance.instrument`} className={EDIT_FORM_LABEL_CLASS}>Instrument</label>
                                <Field
                                    id={`provenance.instrument`}
                                    name={`provenance.instrument`}
                                    className={EDIT_FORM_INPUT_CLASS}
                                    placeholder="Condensation Particle Counter, MPL, SONDE"
                                />
                                <ErrorMessage
                                    name={`provenance.instrument`}
                                    component="div"
                                    className={EDIT_FORM_ERROR_CLASS}
                                />
                            </div>
                        </div>
                        <EditFormActions onCancel={handleCancelClick} isSubmitting={isSubmitting} />
                    </Form>
                )}
            </Formik>
        );
    }

    // Default value
    return <div className="flex flex-row w-full items-start justify-between gap-4">
        <div className="w-full flex flex-col gap-3">
            <CardItem title="SOURCES">
                {props.dataset.data.source
                    ? props.dataset.data.source
                    : <p className={EMPTY_VALUE_CLASS}>No source informed.</p>}
            </CardItem>
            <CardItem title="Source instrument">
                {props.dataset.data.source_instrument
                    ? props.dataset.data.source_instrument
                    : <p className={EMPTY_VALUE_CLASS}>No instrument informed.</p>}
            </CardItem>
        </div>
        <EditButton />
    </div>
}

