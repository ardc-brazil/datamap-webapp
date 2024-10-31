import { ErrorMessage, Field, Form, Formik } from "formik";
import { useSession } from "next-auth/react";
import { useEffect, useState } from 'react';
import { MaterialSymbol } from 'react-material-symbols';
import 'react-material-symbols/outlined'; // Place in your root app file. There are also `sharp` and `outlined` variants.
import * as Yup from 'yup';
import { BFFAPI } from "../../gateways/BFFAPI";
import { getVersionByName } from "../../lib/datasetVersionSelector";
import { isDOIUpdateStatusEnabled } from "../../lib/featureFlags";
import { UserDetailsResponse } from "../../lib/users";
import { APIError, ErrorDetails } from "../../types/APIError";
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
    selectedVersionName: string
}

interface ManagementOperationResult {
    operation: "REGISTERED_AUTO" | "REGISTERED_MANUAL" | "DELETED" | "NAVIGATE_STATE",
    success: boolean,
    message: string,
    apiError?: APIError
}

export default function DatasetCitation(props: Props) {

    const { data: session, status } = useSession();
    const [editing, setEditing] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [currentDOI, setCurrentDOI] = useState(getVersionByName(props.selectedVersionName, props.dataset.versions, props.dataset).doi)
    const [DOIManagementOperationResult, setDOIManagementOperationResult] = useState(null as ManagementOperationResult)
    const [showModalDOIStatusNotification, setShowModalDOIStatusNotification] = useState(false)
    const [nextDOIStatusSelected, setNextDOIStatusSelected] = useState("")
    const contactsRosterToUpdateDOIStatus = ["encinas@usp.br", "andrenmaia@gmail.com", "caaiomaia@gmail.com"];

    function onRegisterManualDOIClick() {
        setDOIManagementOperationResult(null);
        setEditing(true);
    }

    function onRegisterAutoDOIClick(): void {
        setDOIManagementOperationResult(null);
        setGenerating(true);
    }

    function onDeleteDOIConfirmedClick() {
        const req = {
            datasetId: props.dataset.id,
            versionName: getVersionByName(props.selectedVersionName, props.dataset.versions, props.dataset)?.name
        } as DeleteDOIRequest;

        bffGateway.deleteDOI(req)
            .then(() => {
                setDOIManagementOperationResult({
                    operation: "DELETED",
                    success: true,
                    message: "Your DOI was deleted successfully.",
                });
                setCurrentDOI(null)
            })
            .catch(reason => {
                setDOIManagementOperationResult({
                    operation: "DELETED",
                    success: false,
                    message: "Failed to delete DOI",
                });
            });
    }

    function onManualDOIFormEditionCancel() {
        setEditing(false);
    }

    function onManualDOICreatedWithSuccess(DOIGenerated: GetDatasetDetailsDOIResponse) {
        setCurrentDOI(DOIGenerated);
        setDOIManagementOperationResult({
            operation: "REGISTERED_MANUAL",
            success: true,
            message: "Your DOI has been successfully registered manually by you. You can now use this DOI to reference your dataset. Please ensure to verify all associated metadata for accuracy."
        });
        setEditing(false);
    }

    function onManualDOICreatedWithError(error: APIError) {
        setCurrentDOI(null);
        setDOIManagementOperationResult({
            operation: "REGISTERED_MANUAL",
            success: false,
            message: "Error",
            apiError: error
        });
        setEditing(false);
    }

    function onAutoDOICreatedWithSuccess(DOIGenerated: GetDatasetDetailsDOIResponse) {
        setCurrentDOI(DOIGenerated);
        setDOIManagementOperationResult({
            operation: "REGISTERED_AUTO",
            success: true,
            message: "Your DOI has been successfully registered automatically by Datamap. You can now use this DOI to reference your dataset. Please ensure to verify all associated metadata for accuracy."
        });
        setGenerating(false);
    }

    function onAutoDOICreatedWithError(error: APIError): void {
        setCurrentDOI(null);
        setDOIManagementOperationResult({
            operation: "REGISTERED_AUTO",
            success: false,
            message: "Error",
            apiError: error
        });
        setGenerating(false);
    }

    function onNavigateTo(oldState: GetDatasetDetailsDOIResponseState, newState: GetDatasetDetailsDOIResponseState) {

        if (isDOIUpdateStatusEnabled(session)) {
            const req = {
                datasetId: props.dataset.id,
                versionName: getVersionByName(props.selectedVersionName, props.dataset.versions, props.dataset)?.name,
                state: newState
            } as NavigateDOIStatusRequest;

            bffGateway.navigateDOIStatus(req)
                .then(() => {
                    setCurrentDOI({ ...currentDOI, state: newState });
                    setDOIManagementOperationResult({
                        operation: "NAVIGATE_STATE",
                        success: true,
                        message: `The state of DOI was navigates from "${oldState}" to "${newState}"`
                    });
                })
                .catch(reason => {
                    setDOIManagementOperationResult({
                        operation: "NAVIGATE_STATE",
                        success: false,
                        message: `Transition from "${oldState}" to "${newState}" is not allowed.`,
                        apiError: reason
                    });
                });
        } else {
            setGenerating(false)
            setEditing(false)
            setShowModalDOIStatusNotification(true)
            setNextDOIStatusSelected(newState)
        }
    }

    if (generating) {
        return <CitationAutoDOIForm
            dataset={props.dataset}
            user={props.user}
            onCanceled={() => setGenerating(false)}
            onAutoDOICreatedWithSuccess={onAutoDOICreatedWithSuccess}
            onAutoDOICreatedWithError={onAutoDOICreatedWithError}
            selectedVersionName={props.selectedVersionName}
        />
    }

    if (editing) {
        return <CitationManualDOIForm
            dataset={props.dataset}
            user={props.user}
            onManualDOIFormEditionCancel={onManualDOIFormEditionCancel}
            onManualDOICreatedWithSuccess={onManualDOICreatedWithSuccess}
            onManualDOICreatedWithError={onManualDOICreatedWithError}
            selectedVersionName={props.selectedVersionName} />
    }

    function getEmailToHTML(emails: string[], doi: GetDatasetDetailsDOIResponse) {
        if (!showModalDOIStatusNotification) {
            return
        }

        const to = emails[0]
        const cc = emails.slice(1).join(",")
        const subject = "DOI Status Update"
        const body = `Please, navigate the DOI Status from "${doi.state.toString()}" to "${nextDOIStatusSelected}" for DatasetID "${props.dataset.id}".`
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
                DOIManagementOperationResult={DOIManagementOperationResult}
                onRegisterManualDOIClick={onRegisterManualDOIClick}
                onRegisterAutoDOIClick={onRegisterAutoDOIClick}
                onDeleteDOIConfirmedClick={onDeleteDOIConfirmedClick}
                onNavigateTo={onNavigateTo}
                selectedVersionName={props.selectedVersionName}
            />
        </>
    );
}

interface CitationAutoDOIFormProps extends Props {
    onCanceled(): void;
    onAutoDOICreatedWithSuccess(DOIGenerated: GetDatasetDetailsDOIResponse): void
    onAutoDOICreatedWithError(error: APIError): void
}

function CitationAutoDOIForm(props: CitationAutoDOIFormProps) {

    const [isSubmitting, setIsSubmitting] = useState(false);

    function onClick() {
        setIsSubmitting(true);

        const createDOIRequest = {
            datasetId: props.dataset.id,
            versionName: getVersionByName(props.selectedVersionName, props.dataset.versions, props.dataset)?.name,
            mode: GetDatasetDetailsDOIResponseRegisterMode.AUTO
        } as CreateDOIRequest;

        bffGateway.createDOI(createDOIRequest)
            .then(result => {
                props.onAutoDOICreatedWithSuccess({
                    identifier: result.identifier,
                    state: result.state,
                    mode: result.mode,
                } as GetDatasetDetailsDOIResponse);
            })
            .catch((reason: APIError) => {
                props.onAutoDOICreatedWithError(reason);
            })
            .finally(() => setIsSubmitting(false));
    }

    if (isSubmitting) {
        return (
            <div role="status">
                <MaterialSymbol icon="progress_activity" size={32} grade={-25} weight={400}
                    className="align-middle animate-spin"
                />
                <span className="sr-only">Loading...</span>
                <span className="pl-4">We are generating your DOI.</span>
            </div>
        )
    }

    return (
        <div>
            <p className="text-primary-500 italic w-full">
                You are about to automatically generate a DOI (Digital Object Identifier) for this dataset.
                Please note that the DOI will be generated by our platform, and no further action is needed from your side.
                Ensure that all associated metadata is accurate before proceeding.
            </p>
            <p className="text-center">
                Would you like to proceed with the automatic generation of the DOI?
            </p>

            <div className="flex flex-row items-center justify-center py-8 gap-4">
                <CancelEditionButton onClick={props.onCanceled} />
                <button type="submit" className="btn-primary btn-small" disabled={isSubmitting} onClick={onClick}>
                    Register
                </button>
            </div>
        </div>
    )
}

interface CitationEditionProps extends Props {
    onManualDOIFormEditionCancel: any;
    onManualDOICreatedWithSuccess(DOIGenerated: GetDatasetDetailsDOIResponse);
    onManualDOICreatedWithError(error: APIError): void
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
                    { message: "Invalid format. A valid format is e.g: 10.1000/182" }
                ),
        })
    });

    async function onSubmit(values, { setSubmitting }) {
        setSubmitting(true);

        try {
            const createDOIRequest = {
                datasetId: props.dataset.id,
                versionName: getVersionByName(props.selectedVersionName, props.dataset.versions, props.dataset)?.name,
                identifier: values.doi.text,
                mode: GetDatasetDetailsDOIResponseRegisterMode.MANUAL
            } as CreateDOIRequest;

            const result = await bffGateway.createDOI(createDOIRequest)
            props.onManualDOICreatedWithSuccess({
                identifier: result.identifier,
                state: result.state,
                mode: result.mode,
            } as GetDatasetDetailsDOIResponse);

        } catch (error) {
            props.onManualDOICreatedWithError(error);
        } finally {
            setSubmitting(false);
        }
    }

    const selectedVersion = getVersionByName(props.selectedVersionName, props.dataset.versions, props.dataset)

    return (
        <div>
            <Formik
                initialValues={{
                    doi: {
                        text: selectedVersion?.doi?.identifier ?? ""
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
    DOIManagementOperationResult: ManagementOperationResult
    onRegisterAutoDOIClick(): void
    onRegisterManualDOIClick(): void
    onDeleteDOIConfirmedClick(): void
    onNavigateTo(oldState: GetDatasetDetailsDOIResponseState, newState: GetDatasetDetailsDOIResponseState): void
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
        setShowAlert(!!props.DOIManagementOperationResult);
    }, [props.DOIManagementOperationResult]);

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

    function onNavigateTo(oldState: GetDatasetDetailsDOIResponseState, newState: GetDatasetDetailsDOIResponseState) {
        props.onNavigateTo(oldState, newState);
    }

    function getDOIURL(doi: GetDatasetDetailsDOIResponse): string {
        return `https://doi.org/${doi.identifier}`
    }

    function shouldHideDOIDeletion(currentDOI: GetDatasetDetailsDOIResponse): boolean {
        return currentDOI.state === GetDatasetDetailsDOIResponseState.FINDABLE ||
            currentDOI.state === GetDatasetDetailsDOIResponseState.REGISTERED;
    }

    function shouldHideDOIStatusNavigation(currentDOI: GetDatasetDetailsDOIResponse): boolean {
        return currentDOI.state === GetDatasetDetailsDOIResponseState.FINDABLE ||
            currentDOI.mode === GetDatasetDetailsDOIResponseRegisterMode.MANUAL
    }

    function shouldHideDOIStatus(currentDOI: GetDatasetDetailsDOIResponse): boolean {
        return currentDOI.mode == GetDatasetDetailsDOIResponseRegisterMode.MANUAL;
    }

    if (props.currentDOI) {
        return (
            <>
                <DOIManagementAlert
                    managementOperationResult={props.DOIManagementOperationResult}
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

                <div className="w-full flex flex-row justify-start items-center space-x-16 text-primary-500">
                    <CardItem testId="doi-identifier" title="DOI (DIGITAL OBJECT IDENTIFIER)">
                        <a href={getDOIURL(props.currentDOI)} target="_blank">
                            {getDOIURL(props.currentDOI)}
                        </a>
                    </CardItem>

                    <CardItem testId="doi-register-mode" title="Mode" info="This indicates how the DOI was registered by the user. 'AUTO' means the DOI was automatically generated by Datamap, while 'MANUAL' means the user manually provided the identifier.">
                        {props.currentDOI.mode}
                    </CardItem>


                    <CardItem testId="doi-register-status" title="Status" hide={shouldHideDOIStatus(props.currentDOI)}>
                        {props.currentDOI.state}
                    </CardItem>

                    <CardItem testId="doi-status-navigator" title="Navigate to next state" hide={shouldHideDOIStatusNavigation(props.currentDOI)}>
                        <NavigateToNextStatusButton
                            currentDOI={props.currentDOI}
                            onNavigateTo={onNavigateTo}
                        />
                    </CardItem>

                    {!shouldHideDOIDeletion(props.currentDOI) &&
                        <>
                            <div className="grow self-start" >
                                <ContextMenuButton
                                    size={72}
                                    disabled={shouldHideDOIDeletion(props.currentDOI)}
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
            </>
        );
    }

    return (
        <>
            <DOIManagementAlert
                managementOperationResult={props.DOIManagementOperationResult}
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
    // creationMessage: string;
    // callout: string;
    showAlert: any;
    // isError?: boolean;
    managementOperationResult: ManagementOperationResult
}

function DOIManagementAlert(props: DOIManagementAlertProps) {

    function errorCodeMapping(code: string): string {
        switch (code) {
            case "missing_field": return "This dataset field is required";
            case "invalid_state": return "The DOI state is invalid for this operation";
            case "already_exists": return "A DOI has already been registered for this dataset"
            default: return code;
        }
    }
    function getCallout(): string {
        switch (props?.managementOperationResult?.operation) {
            case "NAVIGATE_STATE": return "DOI navigate to next state"
            case "DELETED": return "DOI Deletion";
            case "REGISTERED_AUTO": return "DOI Registration";
            case "REGISTERED_MANUAL": return "DOI Registration";
            default:
                console.log("Operation not defined");
                return "";
        }
    }

    function translateField(field: string) {
        switch (field) {
            case "publisher": return "Institution"
            default: return field
        }
    }

    function ComposeItemErrorMessage(props: { error: ErrorDetails }) {

        if (props?.error?.field) {
            return <span>
                Field &quot;{translateField(props.error.field)}&quot;:  {errorCodeMapping(props.error.code)}
            </span>
        }

        return <span>{errorCodeMapping(props.error.code)}</span>

    }

    function ComposeErrorMessage() {
        if (props?.managementOperationResult?.apiError?.httpCode == 400) {
            const apiError = props?.managementOperationResult?.apiError
            return (
                <>
                    <p className="text-primary-900">
                        Some of the information you provided is invalid for DOI management.
                        Please review and correct the following dataset fields:
                    </p>

                    <ul className="text-primary-900">
                        {apiError?.errors?.map((x, i) =>
                            <li key={i} className="ml-4 list-disc">
                                <ComposeItemErrorMessage error={x} />
                            </li>
                        )}
                    </ul>

                </>
            )
        } else if (props?.managementOperationResult) {
            return <p className="text-primary-900">{props?.managementOperationResult.message}</p>
        }

        return <p className="text-primary-900">Error to execute DOI management.</p>;
    }

    if (props.showAlert && !!props.managementOperationResult) {
        return <div className="flex flex-row w-full items-center">
            <div className="text-primary-500 w-full">
                <Alert callout={getCallout()} show={props.showAlert} closed={props.onCloseAlert} isError={!props.managementOperationResult.success}>
                    <ComposeErrorMessage />
                </Alert>
            </div>
        </div>
    }

    return <></>
}


interface NavigateToNextStatusButtonProps {
    onNavigateTo(oldState: GetDatasetDetailsDOIResponseState, newState: GetDatasetDetailsDOIResponseState): void;
    currentDOI: GetDatasetDetailsDOIResponse
}

function NavigateToNextStatusButton(props: NavigateToNextStatusButtonProps) {

    function onClick() {

        if (props.currentDOI.state == GetDatasetDetailsDOIResponseState.DRAFT) {
            props.onNavigateTo(props.currentDOI.state, GetDatasetDetailsDOIResponseState.REGISTERED);
            return;
        }

        if (props.currentDOI.state == GetDatasetDetailsDOIResponseState.REGISTERED) {
            props.onNavigateTo(props.currentDOI.state, GetDatasetDetailsDOIResponseState.FINDABLE);
            return;
        }
    }

    function getButtonText(state: GetDatasetDetailsDOIResponseState) {
        if (state == GetDatasetDetailsDOIResponseState.DRAFT) {
            return "Registered";
        }

        return "Findable";
    }

    // Supress button show if the current DOI status is final.
    if (props.currentDOI.state == GetDatasetDetailsDOIResponseState.FINDABLE) {
        return <span><small>FINDABLE is a final state, is not possible to navigate to the next state</small></span>;
    }

    return (
        <>
            <button
                type="submit"
                className="btn-primary btn-small"
                onClick={onClick}
            >
                {getButtonText(props.currentDOI.state)}
            </button>
        </>
    );
}
