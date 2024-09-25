import { ErrorMessage, Field, Form, Formik } from 'formik';
import { useState } from 'react';
import Moment from "react-moment";
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

export default function DatasetCoverageForm(props: Props) {
    const bffGateway = new BFFAPI();
    const infoText = "Add coverage information about this dataset.";
    const [editing, setEditing] = useState(false);
    const canEdit = canEditDataset(props.user);

    function handleEditClick(event): void {
        setEditing(true);
    }

    function handleCancelClick(event): void {
        setEditing(false)
    }

    const schema = Yup.object().shape({
        coverage: Yup.object().shape({
            start_date: Yup.date().required("Inform the start date"),
            end_date: Yup.date().required("Inform the start date"),
            location: Yup.object().shape({
                location: Yup.string()
                    .max(255, "Location name should be less than 255 characters"),
                latitude: Yup.number()
                    .min(-90, "must be greather than or equal to -90.o")
                    .max(90, "must be less than or equal to 90.0"),
                longitude: Yup.number()
                    .min(-180, "must be greather than or equal to -180.0")
                    .max(180, "must be less than or equal to 180.0"),
            })
        })
    });

    function onSubmit(values, { setSubmitting }) {
        setSubmitting(true);
        props.dataset.data.start_date = values.coverage.start_date;
        props.dataset.data.end_date = values.coverage.end_date;
        props.dataset.data.location = values.coverage.location;

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
                    coverage: {
                        start_date: props.dataset.data.start_date,
                        end_date: props.dataset.data.end_date,
                        location: props.dataset.data.location,
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
                                                        <label htmlFor={`coverage.start_date`}>Start date</label>
                                                        <Field
                                                            id={`coverage.start_date`}
                                                            name={`coverage.start_date`}
                                                            className="invalid:border-error-500 border"
                                                            placeholder="Informe a valid date and time"
                                                            type="datetime-local"
                                                        />
                                                        <ErrorMessage
                                                            name={`coverage.start_date`}
                                                            component="div"
                                                            className="text-xs text-error-600"
                                                        />
                                                    </div>
                                                    <div className="w-full">
                                                        <label htmlFor={`coverage.end_date`}>End date</label>
                                                        <Field
                                                            id={`coverage.end_date`}
                                                            name={`coverage.end_date`}
                                                            className="invalid:border-error-500 border"
                                                            placeholder="Informe a valid date and time"
                                                            type="datetime-local"
                                                        />
                                                        <ErrorMessage
                                                            name={`coverage.end_date`}
                                                            component="div"
                                                            className="text-xs text-error-600"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex items-center w-full gap-2">
                                                    <div className="w-full">
                                                        <label htmlFor={`coverage.location.location`}>Name</label>
                                                        <Field
                                                            id={`coverage.location.location`}
                                                            name={`coverage.location.location`}
                                                            className="invalid:border-error-500 border"
                                                            placeholder="Location name"
                                                        />
                                                        <ErrorMessage
                                                            name={`coverage.location.location`}
                                                            component="div"
                                                            className="text-xs text-error-600"
                                                        />
                                                    </div>
                                                    <div className="w-full">
                                                        <label htmlFor={`coverage.location.latitude`}>Latitude</label>
                                                        <Field
                                                            id={`coverage.location.latitude`}
                                                            name={`coverage.location.latitude`}
                                                            className="invalid:border-error-500 border"
                                                            placeholder="71.323"
                                                            type="number"
                                                        />
                                                        <ErrorMessage
                                                            name={`coverage.location.latitude`}
                                                            component="div"
                                                            className="text-xs text-error-600"
                                                        />
                                                    </div>
                                                    <div className="w-full">
                                                        <label htmlFor={`coverage.location.longitude`}>Longitude</label>
                                                        <Field
                                                            id={`coverage.location.longitude`}
                                                            name={`coverage.location.longitude`}
                                                            className="invalid:border-error-500 border"
                                                            placeholder="-156.615"
                                                            type="number"
                                                        />
                                                        <ErrorMessage
                                                            name={`coverage.location.longitude`}
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
        <div className="text-primary-500 w-full">
            <div className="flex gap-28 py-4">
                <CardItem title="TEMPORAL COVERAGE START DATE">
                    <Moment date={props.dataset.data.start_date} format="YYYY-MM-DD LTS z ZZ" />
                </CardItem>
                <CardItem title="TEMPORAL COVERAGE END DATE">
                    <Moment date={props.dataset.data.end_date} format="YYYY-MM-DD LTS z ZZ" />
                </CardItem>
                <CardItem title="GEOSPATIAL COVERAGE">
                    {props.dataset.data.location && (
                        <ul className="leading-7">
                            <li>Location: {props.dataset.data.location.location}</li>
                            <li>Latitude: {props.dataset.data.location.latitude}</li>
                            <li>Longitude: {props.dataset.data.location.longitude}</li>
                        </ul>
                    )}
                </CardItem>
            </div>
        </div>
        <EditButton />
    </div>
}

