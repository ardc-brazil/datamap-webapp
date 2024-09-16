import { ErrorMessage, Field, Form, Formik } from "formik";
import { useEffect, useState } from 'react';
import { MaterialSymbol } from 'react-material-symbols';
import 'react-material-symbols/outlined'; // Place in your root app file. There are also `sharp` and `outlined` variants.
import * as Yup from 'yup';
import { BFFAPI } from "../../gateways/BFFAPI";
import { UserDetailsResponse } from "../../lib/users";
import { CreateDOIRequest, DeleteDOIRequest, GetDatasetDetailsDOIResponse, GetDatasetDetailsResponse } from "../../types/BffAPI";
import Alert from "../base/Alert";
import Modal from "../base/PopupModal";
import { CardItem } from "./CardItem";

const bffGateway = new BFFAPI();

interface Props {
    dataset: GetDatasetDetailsResponse
    user?: UserDetailsResponse
}

export default function DatasetCitation(props: Props) {
    const [editing, setEditing] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [currentDOI, setCurrentDOI] = useState(props.dataset.current_version.doi)
    const [DOICreationMessage, setDOICreationMessage] = useState("");

    function onRegisterManualDOIClick() {
        setEditing(true);
    }

    function onRegisterAutoDOIClick(): void {
        setGenerating(true);
    }

    function onDeleteDOIConfirmedClick() {
        console.log("delete doi");
        const req = {
            datasetId: props.dataset.id,
            versionId: props.dataset.current_version.id
        } as DeleteDOIRequest;

        bffGateway.deleteDOI(req)
            .then(result => {
                // TODO: improve success message
                console.log("DOI delete with success", result);

                // Clean the current DOI registered
                setCurrentDOI(null);
            })
            .catch(reason => {
                // TODO: improve error message
                console.log("DOI delete error", reason);
            });
    }

    function onManualDOIFormEditionCancel() {
        setEditing(false);
    }

    function onManualDOICreatedWithSuccess(DOIGenerated: GetDatasetDetailsDOIResponse) {
        setCurrentDOI(DOIGenerated);
        setDOICreationMessage("DOI created with success.");
        setEditing(false);
    }

    function onAutoDOICreatedWithSuccess(DOIGenerated: GetDatasetDetailsDOIResponse) {
        setCurrentDOI(DOIGenerated);
        setDOICreationMessage("DOI Generated with success.");
        setGenerating(false);
    }

    if (generating) {
        return <CitationAutoDOIForm
            dataset={props.dataset}
            user={props.user}
            onAutoDOICreatedWithSuccess={onAutoDOICreatedWithSuccess}
        />
    }

    if (editing) {
        return <CitationManualDOIForm
            dataset={props.dataset}
            user={props.user}
            onManualDOIFormEditionCancel={onManualDOIFormEditionCancel}
            onManualDOICreatedWithSuccess={onManualDOICreatedWithSuccess}
        />
    }

    return <CitationDOIViewer
        dataset={props.dataset}
        user={props.user}
        currentDOI={currentDOI}
        creationMessage={DOICreationMessage}
        onRegisterManualDOIClick={onRegisterManualDOIClick}
        onRegisterAutoDOIClick={onRegisterAutoDOIClick}
        onDeleteDOIConfirmedClick={onDeleteDOIConfirmedClick}
    />
}

interface CitationGeneratingViewerProps extends Props {
    onAutoDOICreatedWithSuccess(DOIGenerated: GetDatasetDetailsDOIResponse): void
}

function CitationAutoDOIForm(props: CitationGeneratingViewerProps) {
    useEffect(() => {
        const createDOIRequest = {
            datasetId: props.dataset.id,
            versionId: props.dataset.current_version.id,
            // TODO: Create enum for this value
            registerMode: "AUTO"
        } as CreateDOIRequest;

        bffGateway.createDOI(createDOIRequest)
            .then(result => {
                props.onAutoDOICreatedWithSuccess({
                    identifier: result.identifier,
                    status: result.status,
                    linkType: result.mode,
                } as GetDatasetDetailsDOIResponse);
            })
            .catch(reason => {
                // TODO: improve error handler
                console.log(reason);
            })
    });

    function GeneratingLoadingMessage() {
        return <p>
            <div role="status">
                {/* TODO: Convert it to MaterialSymbols */}
                <MaterialSymbol icon="progress_activity" size={32} grade={-25} weight={400}
                    className="align-middle animate-spin"
                />
                <span className="sr-only">Loading...</span>
                <span className="pl-4">We are generating your DOI.</span>
            </div>
        </p>
    }

    return (
        // TODO: Show error message and create a retry button.
        <GeneratingLoadingMessage />
    )
}

interface CitationEditionProps extends Props {
    onManualDOIFormEditionCancel: any;
    onManualDOICreatedWithSuccess(DOIGenerated: GetDatasetDetailsDOIResponse);
}

/**
 * Register manual citation edit form.
 * @param props 
 * @returns 
 */
function CitationManualDOIForm(props: CitationEditionProps) {
    const schema = Yup.object().shape({
        doi: Yup.object().shape({
            identifier: Yup.string()
                .required("The indentifier is required. e.g: 10.1000/182")
                .matches(/^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i,
                    { message: "invalid format" }),
        })
    });


    // TODO: Check if this "async" in "onSubmit" can cause problems
    async function onSubmit(values, { setSubmitting }) {
        // TODO: implement a dataset update after manual DOI is validated
        setSubmitting(true);

        try {
            const createDOIRequest = {
                datasetId: props.dataset.id,
                versionId: props.dataset.current_version.id,
                identifier: values.doi.identifier,
                // TODO: Create enum for this value
                registerMode: "MANUAL"
            } as CreateDOIRequest;

            const result = await bffGateway.createDOI(createDOIRequest)
            props.onManualDOICreatedWithSuccess({
                identifier: result.identifier,
                status: result.status,
                linkType: result.mode,
            } as GetDatasetDetailsDOIResponse);

        } catch (error) {
            // TODO: Improve error handler
            console.log(error);
            alert("Sorry! Error...");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div>
            <Formik
                initialValues={{
                    doi: {
                        identifier: props?.dataset?.current_version?.doi?.identifier,
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
                                            You are about to manually register a DOI (Digital Object Identifier) for this dataset. Please note that it is solely your responsibility to ensure the validity and accuracy of the provided DOI. Our platform will not verify the integrity of the DOI entered.
                                        </p>
                                        <div className="py-2" >
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="flex items-center w-full gap-2">
                                                    <div className="w-full">
                                                        <label htmlFor={`doi.identifier`}>Identifier</label>
                                                        <Field
                                                            id={`doi.identifier`}
                                                            name={`doi.identifier`}
                                                            className="invalid:border-error-500 border"
                                                            placeholder="10.1000/182"
                                                        />
                                                        <ErrorMessage
                                                            name={`doi.identifier`}
                                                            component="div"
                                                            className="text-xs text-error-600"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex w-64 h-10 gap-2 pl-4">
                                        <CancelEditionButton onClick={props.onManualDOIFormEditionCancel} />
                                        <button type="submit" className="btn-primary btn-small" disabled={isSubmitting}>Save</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    )

}

/**
 * A button to handle ManualDOIFormEdition cancelation
 * @param props 
 * @returns 
 */
function CancelEditionButton(props) {
    return (
        <button
            className={`btn-primary-outline btn-small h-8 w-fit`}
            onClick={props.onClick}>
            Cancel
        </button>
    );
}


interface CitationDOIViewerProps extends Props {
    currentDOI: GetDatasetDetailsDOIResponse
    // TODO: Improve creationMessage layout error.
    // DOICreationState: {
    //     isError: boolean,
    //     message: string,
    // }
    creationMessage: string
    onRegisterAutoDOIClick(): void
    onRegisterManualDOIClick(): void
    onDeleteDOIConfirmedClick(): void
}

/**
 * A component to show DOi generated information.
 * If the dataset is registered for a DOI, this component is responsible to show this information
 * and allow proper edition based on DOI type.
 * @param props 
 * @returns 
 */
function CitationDOIViewer(props: CitationDOIViewerProps) {
    const [showAlert, setShowAlert] = useState(!!props.creationMessage);
    const [showCheckDOIDeletionModal, setShowCheckDOIDeletionModal] = useState(false);

    function RegisterManualDOIButton(props) {
        return (
            <button
                className={`btn-primary-outline btn-small h-8 w-fit`}
                onClick={props.onClick}>
                Register Manual DOI
            </button>
        );
    }

    function RegisterAutoDOIButton(props) {
        return (
            <button
                className={`btn-primary btn-small h-8 w-fit`}
                onClick={props.onClick}>
                Generate DOI Automatically
            </button>
        );
    }

    function onDeleteDOIConfirmedClick() {
        props.onDeleteDOIConfirmedClick();
        setShowCheckDOIDeletionModal(false);
    }

    function getDOIURL(doi: GetDatasetDetailsDOIResponse): string {
        return `https://doi.org/${doi.identifier}`
    }

    if (props.currentDOI) {
        return (
            <>
                {showAlert && <div className="flex flex-row w-full items-center">
                    <p className="text-primary-500 w-full">
                        {/* TODO: Handle error messages */}
                        <Alert callout="DOI creation result" show={showAlert} closed={() => setShowAlert(false)}>
                            <p>{props.creationMessage}</p>
                        </Alert>
                    </p>
                </div>
                }

                <Modal
                    title="DOI Deletion confirmation"
                    show={showCheckDOIDeletionModal}
                    confimButtonText="Yes"
                    cancel={() => setShowCheckDOIDeletionModal(false)}
                    confim={onDeleteDOIConfirmedClick}
                >
                    <div>
                        <p className="font-bold">{`Are you sure that you want to delete "${props.currentDOI.identifier}" DOI?`}</p>
                        <p>DOI deletion is permanent. Once deleted, it cannot be recovered.</p>
                    </div>
                </Modal>
                <div className="flex flex-row w-full items-center">

                    <p className="text-primary-500 w-full">
                        <div className="flex gap-28 py-4">
                            <CardItem title="DOI (DIGITAL OBJECT IDENTIFIER)">
                                <a href={getDOIURL(props.currentDOI)} target="_blank">
                                    {getDOIURL(props.currentDOI)}
                                </a>
                            </CardItem>
                            <CardItem title="Status">
                                {props.currentDOI.status}
                            </CardItem>
                            <CardItem title="Navegate to next state">
                                <button type="submit" className="btn-primary btn-small">Findable</button>
                                <button 
                                    className="btn-primary btn-small bg-error-900 disabled:focus:bg-error-900 disabled:hover:bg-error-900 disabled:cursor-not-allowed"
                                    onClick={() => setShowCheckDOIDeletionModal(true)}
                                    disabled={props.currentDOI.status !== "DRAFT"}
                                >
                                    Delete
                                </button>
                            </CardItem>
                        </div>
                    </p>
                </div>
            </>
        );
    }

    return (
        <div className="text-center">
            {/* TODO: Improve error message layout. */}
            <p>{props.creationMessage}</p>
            <p>This dataset does not have a registered DOI. Would you like to register one?</p>
            <p><small>You can choose to manually enter an existing DOI or generate a new one automatically.</small></p>
            <RegisterManualDOIButton onClick={props.onRegisterManualDOIClick} />
            <RegisterAutoDOIButton onClick={props.onRegisterAutoDOIClick} />
        </div>
    )
}
