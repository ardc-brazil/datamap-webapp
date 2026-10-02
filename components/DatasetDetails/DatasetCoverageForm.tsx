import { ErrorMessage, Field, Form, Formik } from 'formik';
import { useState } from 'react';
import Moment from "react-moment";
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

function isInformedDate(date: Date): boolean {
    if (!date) {
        return false;
    }
    const d = new Date(date);
    return !isNaN(d.getTime()) && d.getUTCFullYear() !== 1970;
}

function isInformedNumber(value: any): boolean {
    return value !== null && value !== undefined && value !== "" && !isNaN(Number(value));
}

export default function DatasetCoverageForm(props: Props) {
    const bffGateway = new BFFAPI();
    const infoText = "Add coverage information about this dataset.";
    const [editing, setEditing] = useState(false);
    const canEdit = canEditDataset(props.user, props.dataset);

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
        return <TextActionButton hidden={editing || !canEdit} className="flex-none" onClick={handleEditClick}>Edit</TextActionButton>
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
                    <Form className="w-full">
                        <p className={EDIT_FORM_HINT_CLASS}>
                            {infoText}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                            <div className="min-w-0">
                                <label htmlFor={`coverage.start_date`} className={EDIT_FORM_LABEL_CLASS}>Start date</label>
                                <Field
                                    id={`coverage.start_date`}
                                    name={`coverage.start_date`}
                                    className={EDIT_FORM_INPUT_CLASS}
                                    placeholder="Informe a valid date and time"
                                    type="datetime-local"
                                />
                                <ErrorMessage
                                    name={`coverage.start_date`}
                                    component="div"
                                    className={EDIT_FORM_ERROR_CLASS}
                                />
                            </div>
                            <div className="min-w-0">
                                <label htmlFor={`coverage.end_date`} className={EDIT_FORM_LABEL_CLASS}>End date</label>
                                <Field
                                    id={`coverage.end_date`}
                                    name={`coverage.end_date`}
                                    className={EDIT_FORM_INPUT_CLASS}
                                    placeholder="Informe a valid date and time"
                                    type="datetime-local"
                                />
                                <ErrorMessage
                                    name={`coverage.end_date`}
                                    component="div"
                                    className={EDIT_FORM_ERROR_CLASS}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 pt-3">
                            <div className="min-w-0">
                                <label htmlFor={`coverage.location.location`} className={EDIT_FORM_LABEL_CLASS}>Location name</label>
                                <Field
                                    id={`coverage.location.location`}
                                    name={`coverage.location.location`}
                                    className={EDIT_FORM_INPUT_CLASS}
                                    placeholder="Location name"
                                />
                                <ErrorMessage
                                    name={`coverage.location.location`}
                                    component="div"
                                    className={EDIT_FORM_ERROR_CLASS}
                                />
                            </div>
                            <div className="min-w-0">
                                <label htmlFor={`coverage.location.latitude`} className={EDIT_FORM_LABEL_CLASS}>Latitude</label>
                                <Field
                                    id={`coverage.location.latitude`}
                                    name={`coverage.location.latitude`}
                                    className={EDIT_FORM_INPUT_CLASS}
                                    placeholder="71.323"
                                    type="number"
                                />
                                <ErrorMessage
                                    name={`coverage.location.latitude`}
                                    component="div"
                                    className={EDIT_FORM_ERROR_CLASS}
                                />
                            </div>
                            <div className="min-w-0">
                                <label htmlFor={`coverage.location.longitude`} className={EDIT_FORM_LABEL_CLASS}>Longitude</label>
                                <Field
                                    id={`coverage.location.longitude`}
                                    name={`coverage.location.longitude`}
                                    className={EDIT_FORM_INPUT_CLASS}
                                    placeholder="-156.615"
                                    type="number"
                                />
                                <ErrorMessage
                                    name={`coverage.location.longitude`}
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

    const startDate = props.dataset.data.start_date;
    const endDate = props.dataset.data.end_date;
    const hasStart = isInformedDate(startDate);
    const hasEnd = isInformedDate(endDate);

    const location = props.dataset.data.location;
    const locationName = location?.location?.trim();
    const hasCoordinates = isInformedNumber(location?.latitude) && isInformedNumber(location?.longitude);

    return <div className="flex flex-row w-full items-start justify-between gap-4">
        <div className="w-full flex flex-col gap-3">
            <CardItem title="Temporal coverage">
                {(hasStart || hasEnd)
                    ? (
                        <div className="flex flex-wrap items-baseline gap-x-2 font-mono text-[13px]">
                            {hasStart &&
                                <Moment date={startDate} format="YYYY-MM-DD LTS z ZZ" />
                            }
                            {hasStart && hasEnd &&
                                <span className="text-primary-400">→</span>
                            }
                            {hasEnd &&
                                <Moment date={endDate} format="YYYY-MM-DD LTS z ZZ" />
                            }
                        </div>
                    )
                    : <p className={EMPTY_VALUE_CLASS}>No temporal coverage informed.</p>
                }
            </CardItem>
            <CardItem title="Geospatial coverage">
                {(locationName || hasCoordinates)
                    ? (
                        <div className="flex flex-wrap items-baseline gap-x-2">
                            {locationName &&
                                <span>{locationName}</span>
                            }
                            {hasCoordinates &&
                                <span className="font-mono text-[13px] text-primary-500">
                                    {location.latitude}, {location.longitude}
                                </span>
                            }
                        </div>
                    )
                    : <p className={EMPTY_VALUE_CLASS}>No geospatial coverage informed.</p>
                }
            </CardItem>
        </div>
        <EditButton />
    </div>
}
