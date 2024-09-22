import { ErrorMessage, Field, Form, Formik } from "formik";
import { useSession } from "next-auth/react";
import { useEffect, useState } from 'react';
import { MaterialSymbol } from 'react-material-symbols';
import 'react-material-symbols/outlined'; // Place in your root app file. There are also `sharp` and `outlined` variants.
import * as Yup from 'yup';
import { BFFAPI } from "../../gateways/BFFAPI";
import { isDOIUpdateStatusEnabled } from "../../lib/featureFlags";
import { UserDetailsResponse } from "../../lib/users";
import { CreateDOIRequest, DeleteDOIRequest, GetDatasetDetailsDOIResponse, GetDatasetDetailsDOIResponseRegisterMode, GetDatasetDetailsDOIResponseState, GetDatasetDetailsResponse, NavigateDOIStatusRequest } from "../../types/BffAPI";
import Alert from "../base/Alert";
import Modal from "../base/PopupModal";
import { ContextMenuButton } from "../ContextMenu/ContextMenuButton";
import { ContextMenuButtonItem } from "../ContextMenu/ContextMenuButtonItem";
import { CardItem } from "./CardItem";

const bffGateway = new BFFAPI();

interface Props {
    dataset: GetDatasetDetailsResponse
    user?: UserDetailsResponse
}

export default function DatasetCitation(props: Props) {
    const { data: session, status } = useSession();
    const [editing, setEditing] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [currentDOI, setCurrentDOI] = useState(props.dataset.current_version.doi)
    const [DOICreationMessage, setDOICreationMessage] = useState("");
    const [showModalDOIStatusNotification, setShowModalDOIStatusNotification] = useState(false)
    const [nextDOIStatusSelected, setNextDOIStatusSelected] = useState("")
    const contactsRosterToUpdateDOIStatus = ["encinas@usp.br", "andrenmaia@gmail.com", "caaiomaia@gmail.com"];

    function onRegisterManualDOIClick() {
        setDOICreationMessage("");
        setEditing(true);
    }

    function onRegisterAutoDOIClick(): void {
        setDOICreationMessage("");
        setGenerating(true);
    }

    function onDeleteDOIConfirmedClick() {
        const req = {
            datasetId: props.dataset.id,
            versionId: props.dataset.current_version.id
        } as DeleteDOIRequest;

        bffGateway.deleteDOI(req)
            .then(result => {
                // Clean the current DOI registered
                setCurrentDOI(null);
                setDOICreationMessage("Your DOI was deleted successfully.");
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
        setDOICreationMessage("Your DOI has been successfully registered manually by you. You can now use this DOI to reference your dataset. Please ensure to verify all associated metadata for accuracy.");
        setEditing(false);
    }

    function onAutoDOICreatedWithSuccess(DOIGenerated: GetDatasetDetailsDOIResponse) {
        setCurrentDOI(DOIGenerated);
        setDOICreationMessage("Your DOI has been successfully registered automatically by Datamap. You can now use this DOI to reference your dataset. Please ensure to verify all associated metadata for accuracy.");
        setGenerating(false);
    }

    function onNavigateTo(status: GetDatasetDetailsDOIResponseState) {

        if (isDOIUpdateStatusEnabled(session)) {
            // TODO: Call API when this feature was unblocked to the users
            const req = {
                datasetId: props.dataset.id,
                versionId: currentDOI.id,
                status: status
            } as NavigateDOIStatusRequest;

            bffGateway.navigateDOIStatus(req)
                .then(result => {
                    // TODO: improve success message
                    console.log("DOI status navigated with success", result);
                    setCurrentDOI({ ...currentDOI, status: status });
                })
                .catch(reason => {
                    // TODO: improve error message
                    console.log("DOI navigate status error", reason);
                });
        } else {
            setNextDOIStatusSelected(status)
            setShowModalDOIStatusNotification(true);
        }
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


    function getEmailToHTML(emails: string[], doi: GetDatasetDetailsDOIResponse) {
        if (!showModalDOIStatusNotification) {
            return
        }

        const to = emails[0]
        const cc = emails.slice(1).join(",")
        const subject = "DOI Status Update"
        const body = `Please, navigate the DOI Status from "${doi.status.toString()}" to "${nextDOIStatusSelected}" for DatasetID "${props.dataset.id}".`
        const href = `mailto:${to}?cc=${cc}&subject=${subject}&body=${body}`

        return (
            <ul>
                <li>
                    <p>Click here to <a href={href}>send the email</a>.
                    </p>
                </li>
                <li>

                    <hr className="my-8" />
                    <article className="prose lg:prose-xl max-w-none small-font-size">
                        <p>
                            Your e-mail must include this basic information:
                        </p>
                        <pre>
                            to: {to}<br />
                            cc: {cc}<br />
                            subject: {subject}<br />
                            body: {body}<br />
                        </pre>
                    </article>
                </li>
            </ul>
        );
    }

    return (
        <>
            <Modal
                title="DOI Status Update"
                show={showModalDOIStatusNotification}
                confimButtonText="Yes"
                cancel={() => setShowModalDOIStatusNotification(false)}
            >
                <div>
                    <p className="font-bold">Permission Required.</p>
                    <p>{`This action requires additional permission and validation. Please contact us via e-mail for further assistance.`}</p>
                    {getEmailToHTML(contactsRosterToUpdateDOIStatus, currentDOI)}
                </div>
            </Modal>
            <CitationDOIViewer
                dataset={props.dataset}
                user={props.user}
                currentDOI={currentDOI}
                creationMessage={DOICreationMessage}
                onRegisterManualDOIClick={onRegisterManualDOIClick}
                onRegisterAutoDOIClick={onRegisterAutoDOIClick}
                onDeleteDOIConfirmedClick={onDeleteDOIConfirmedClick}
                onNavigateTo={onNavigateTo}
            />
        </>
    );
}

interface CitationGeneratingViewerProps extends Props {
    onAutoDOICreatedWithSuccess(DOIGenerated: GetDatasetDetailsDOIResponse): void
}

function CitationAutoDOIForm(props: CitationGeneratingViewerProps) {
    useEffect(() => {
        const createDOIRequest = {
            datasetId: props.dataset.id,
            versionId: props.dataset.current_version.id,
            registerMode: GetDatasetDetailsDOIResponseRegisterMode.AUTO
        } as CreateDOIRequest;

        bffGateway.createDOI(createDOIRequest)
            .then(result => {
                props.onAutoDOICreatedWithSuccess({
                    identifier: result.identifier,
                    status: result.status,
                    registerMode: result.mode,
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
            text: Yup.string()
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
                identifier: values.doi.text,
                registerMode: GetDatasetDetailsDOIResponseRegisterMode.MANUAL
            } as CreateDOIRequest;

            const result = await bffGateway.createDOI(createDOIRequest)
            props.onManualDOICreatedWithSuccess({
                identifier: result.identifier,
                status: result.status,
                registerMode: result.mode,
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
                        text: props?.dataset?.current_version?.doi?.identifier,
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
                                                        <label htmlFor={`doi.text`}>Identifier</label>
                                                        <Field
                                                            id={`doi.text`}
                                                            name={`doi.text`}
                                                            type="text"
                                                            className="invalid:border-error-500 border"
                                                            placeholder="10.1000/182"
                                                        />
                                                        <ErrorMessage
                                                            name={`doi.text`}
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
    onNavigateTo(status: GetDatasetDetailsDOIResponseState): void
}

/**
 * A component to show DOi generated information.
 * If the dataset is registered for a DOI, this component is responsible to show this information
 * and allow proper edition based on DOI type.
 * @param props 
 * @returns 
 */
function CitationDOIViewer(props: CitationDOIViewerProps) {
    const [showAlert, setShowAlert] = useState(false);
    const [showCheckDOIDeletionModal, setShowCheckDOIDeletionModal] = useState(false);

    useEffect(() => {
        setShowAlert(!!props.creationMessage);
    }, [props.creationMessage]);

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

    function onNavigateTo(status: GetDatasetDetailsDOIResponseState) {
        props.onNavigateTo(status);
    }

    function getDOIURL(doi: GetDatasetDetailsDOIResponse): string {
        return `https://doi.org/${doi.identifier}`
    }

    function shouldHideDOIDeletion(currentDOI: GetDatasetDetailsDOIResponse): boolean {
        return currentDOI.status == GetDatasetDetailsDOIResponseState.FINDABLE ||
            currentDOI.status == GetDatasetDetailsDOIResponseState.REGISTERED;
    }

    function shouldHideDOIStatusNavigation(currentDOI: GetDatasetDetailsDOIResponse): boolean {
        return currentDOI.status == GetDatasetDetailsDOIResponseState.FINDABLE ||
            currentDOI.registerMode == GetDatasetDetailsDOIResponseRegisterMode.MANUAL
    }

    function shouldHideDOIStatus(currentDOI: GetDatasetDetailsDOIResponse): boolean {
        return currentDOI.registerMode == GetDatasetDetailsDOIResponseRegisterMode.MANUAL;
    }

    if (props.currentDOI) {
        return (
            <>
                <DOIManagementAlert
                    callout="DOI successfully registered"
                    creationMessage={props.creationMessage}
                    onCloseAlert={() => setShowAlert(false)}
                    showAlert={showAlert}
                />
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

                {/* <div className="bg-primary-400 flex gap-4 h-32 justify-between items-center">
                    <div className="border h-16 w-16 grow bg-secondary-900">01</div>
                    <div className="border h-16 w-16 grow bg-secondary-900">02</div>
                    <div className="border h-16 w-16 grow bg-secondary-900">03</div>
                    <div className="border h-16 w-16 flex-none bg-secondary-900">04</div>
                </div> */}

                <div className="w-full flex flex-row justify-start items-center space-x-16 text-primary-500">


                    {/* <div className="flex gap-28 py-4 border"> */}
                    <CardItem title="DOI (DIGITAL OBJECT IDENTIFIER)">
                        <a href={getDOIURL(props.currentDOI)} target="_blank">
                            {getDOIURL(props.currentDOI)}
                        </a>
                    </CardItem>

                    <CardItem title="Mode" info="This indicates how the DOI was registered by the user. 'AUTO' means the DOI was automatically generated by Datamap, while 'MANUAL' means the user manually provided the identifier.">
                        {props.currentDOI.registerMode}
                    </CardItem>


                    {/* {!shouldHideDOIStatus(props.currentDOI) && */}
                    <CardItem title="Status">
                        {props.currentDOI.status}
                    </CardItem>
                    {/* } */}
                    {!shouldHideDOIStatusNavigation(props.currentDOI) &&
                        <CardItem title="Navigate to next state">
                            <NavigateToNextStatusButton
                                currentDOI={props.currentDOI}
                                onNavigateTo={onNavigateTo}
                            />
                        </CardItem>
                    }
                    {!shouldHideDOIDeletion(props.currentDOI) &&
                        <>
                            <div className="grow self-start" >
                                <ContextMenuButton
                                    size={72}
                                    disabled={props.currentDOI.status !== "DRAFT" && props.currentDOI.registerMode !== GetDatasetDetailsDOIResponseRegisterMode.MANUAL}
                                >
                                    <ContextMenuButtonItem
                                        text="Delete DOI"
                                        onClick={() => setShowCheckDOIDeletionModal(true)} iconName="delete"
                                    />
                                </ContextMenuButton>
                            </div>

                        </>
                    }
                </div>
                {/* </div> */}
            </>
        );
    }


    return (
        <>
            <DOIManagementAlert
                callout="DOI deleted successfully"
                creationMessage={props.creationMessage}
                onCloseAlert={() => setShowAlert(false)}
                showAlert={showAlert}
            />
            <div className="prose lg:prose-xl max-w-none text-center">
                <p>This dataset does not have a registered DOI. Would you like to register one?</p>
                <p><small>You can choose to manually enter an existing DOI or generate a new one automatically.</small></p>
                <RegisterManualDOIButton onClick={props.onRegisterManualDOIClick} />
                <RegisterAutoDOIButton onClick={props.onRegisterAutoDOIClick} />
            </div>
        </ >
    )
}

interface DOIManagementAlertProps {
    onCloseAlert(): void;
    creationMessage: string;
    callout: string;
    showAlert: any;

}

function DOIManagementAlert(props: DOIManagementAlertProps) {
    if (props.showAlert) {
        return <div className="flex flex-row w-full items-center">
            <p className="text-primary-500 w-full">
                {/* TODO: Handle error messages */}
                <Alert callout={props.callout} show={props.showAlert} closed={props.onCloseAlert}>
                    <p>{props.creationMessage}</p>
                </Alert>
            </p>
        </div>
    }

    return <></>
}


interface NavigateToNextStatusButtonProps {
    onNavigateTo(status: GetDatasetDetailsDOIResponseState): void;
    currentDOI: GetDatasetDetailsDOIResponse
}

function NavigateToNextStatusButton(props: NavigateToNextStatusButtonProps) {

    function onClick() {

        if (props.currentDOI.status == GetDatasetDetailsDOIResponseState.DRAFT) {
            props.onNavigateTo(GetDatasetDetailsDOIResponseState.REGISTERED);
            return;
        }

        if (props.currentDOI.status == GetDatasetDetailsDOIResponseState.REGISTERED) {
            props.onNavigateTo(GetDatasetDetailsDOIResponseState.FINDABLE);
            return;
        }
    }

    function getButtonText(status: GetDatasetDetailsDOIResponseState) {
        if (status == GetDatasetDetailsDOIResponseState.DRAFT) {
            return "Registered";
        }

        return "Findable";
    }

    // Supress button show if the current DOI status is final.
    if (props.currentDOI.status == GetDatasetDetailsDOIResponseState.FINDABLE) {
        return <span><small>FINDABLE is a final state, is not possible to navigate to the next state</small></span>;
    }

    return (
        <>
            <button
                type="submit"
                className="btn-primary btn-small"
                onClick={onClick}
            >
                {getButtonText(props.currentDOI.status)}
            </button>
        </>
    );
}
