import { ErrorMessage, Field, Form, Formik } from "formik";
import { useSession } from "next-auth/react";
import Router from "next/router";
import { useEffect, useState } from 'react';
import { MaterialSymbol } from 'react-material-symbols';
import * as Yup from 'yup';
import { EMBARGO_ERROR_MESSAGES } from "../../contants/EmbargoConstants";
import { BFFAPI } from "../../gateways/BFFAPI";
import { getVersionByName } from "../../lib/datasetVersionSelector";
import { tenancyDisplayName } from "../../lib/embargoDisplay";
import { manualDoiGate } from "../../lib/embargoState";
import { isDOIUpdateStatusEnabled } from "../../lib/featureFlags";
import { UserDetailsResponse } from "../../lib/users";
import { APIError, ErrorDetails } from "../../types/APIError";
import { CreateDOIRequest, DeleteDOIRequest, GetDatasetDetailsDOIResponse, GetDatasetDetailsDOIResponseRegisterMode, GetDatasetDetailsDOIResponseState, GetDatasetDetailsResponse, NavigateDOIStatusRequest } from "../../types/BffAPI";
import Alert from "../base/Alert";
import Modal from "../base/PopupModal";
import { ContextMenuButton } from "../ContextMenu/ContextMenuButton";
import { ContextMenuButtonItem } from "../ContextMenu/ContextMenuButtonItem";
import { EDIT_FORM_ERROR_CLASS, EDIT_FORM_HINT_CLASS, EDIT_FORM_INPUT_CLASS, EDIT_FORM_LABEL_CLASS } from "../../contants/EditFormConstants";
import { ManualDoiConfirmation } from "../Embargo/ManualDoiConfirmation";
import { SetEmbargoDialog } from "../Embargo/SetEmbargoDialog";
import { CardItem } from "./CardItem";
import { EditFormActions } from "./EditFormActions";

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
            <div className="flex flex-col gap-3">
                <p className="m-0 text-sm text-primary-700">
                    Click here to <a href={href} className="text-sm underline underline-offset-2">send the email</a>.
                </p>
                <p className="m-0 text-sm text-primary-700">
                    Your e-mail must include this basic information:
                </p>
                <pre className="m-0 p-3 rounded-md border border-primary-200 bg-primary-50 font-mono text-xs leading-5 text-primary-900 whitespace-pre-wrap break-words">
                    to: {to}<br />
                    cc: {cc}<br />
                    subject: {subject}<br />
                    body: {body}<br />
                </pre>
            </div>
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
                <div className="flex flex-col gap-3">
                    <p className="m-0 text-sm font-semibold text-primary-900">Permission required.</p>
                    <p className="m-0 text-sm text-primary-700">{`This action requires additional permission and validation. Please contact us via e-mail for further assistance.`}</p>
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
            <div role="status" className="flex items-center gap-2 text-sm text-primary-700">
                <MaterialSymbol icon="progress_activity" size={20} grade={-25} weight={400}
                    className="animate-spin"
                />
                <span className="sr-only">Loading...</span>
                <span>We are generating your DOI.</span>
            </div>
        )
    }

    return (
        <div className="w-full">
            <p className={EDIT_FORM_HINT_CLASS}>
                You are about to automatically generate a DOI (Digital Object Identifier) for this dataset.
                Please note that the DOI will be generated by our platform, and no further action is needed from your side.
                Ensure that all associated metadata is accurate before proceeding.
            </p>
            <p className="mt-3 mb-0 text-sm leading-5 text-primary-900">
                Would you like to proceed with the automatic generation of the DOI?
            </p>

            <div className="flex justify-end gap-2 pt-4">
                <CancelEditionButton onClick={props.onCanceled} />
                <button type="submit" className="h-9 px-3.5 rounded-md bg-primary-900 text-primary-50 text-[13px] font-semibold whitespace-nowrap hover:bg-primary-800 transition-colors disabled:opacity-50" disabled={isSubmitting} onClick={onClick}>
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

    const gate = manualDoiGate(props.dataset);
    const [pendingIdentifier, setPendingIdentifier] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [settingEmbargo, setSettingEmbargo] = useState(false);

    function onSubmit(values, { setSubmitting }) {
        setSubmitting(false);
        setPendingIdentifier(values.doi.text);
    }

    async function send(identifier: string) {
        setSending(true);
        try {
            const createDOIRequest = {
                datasetId: props.dataset.id,
                versionName: getVersionByName(props.selectedVersionName, props.dataset.versions, props.dataset)?.name,
                identifier: identifier,
                mode: GetDatasetDetailsDOIResponseRegisterMode.MANUAL,
                endEmbargo: gate === "ends_embargo",
            } as CreateDOIRequest;

            const result = await bffGateway.createDOI(createDOIRequest)
            props.onManualDOICreatedWithSuccess({
                identifier: result.identifier,
                state: result.state,
                mode: result.mode,
            } as GetDatasetDetailsDOIResponse);

            if (gate === "ends_embargo") {
                Router.reload();
            }
        } catch (error) {
            props.onManualDOICreatedWithError(error);
        } finally {
            setSending(false);
            setPendingIdentifier(null);
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
                    <Form className="w-full">
                        <p className={EDIT_FORM_HINT_CLASS}>
                            You are about to manually register a DOI (Digital Object Identifier) for this dataset. Please note that it is solely your responsibility to ensure the validity and accuracy of the provided DOI. Our platform will not verify the integrity of the DOI entered.
                        </p>
                        <div className="pt-3 max-w-md">
                            <label htmlFor={`doi.text`} className={EDIT_FORM_LABEL_CLASS}>Identifier</label>
                            <Field
                                id={`doi.text`}
                                name={`doi.text`}
                                type="text"
                                className={`${EDIT_FORM_INPUT_CLASS} font-mono`}
                                placeholder="10.1000/182"
                            />
                            <ErrorMessage
                                name={`doi.text`}
                                component="div"
                                className={EDIT_FORM_ERROR_CLASS}
                            />
                        </div>
                        <EditFormActions onCancel={props.onManualDOIFormEditionCancel} isSubmitting={isSubmitting || sending} />
                    </Form>
                )}
            </Formik>
            <ManualDoiConfirmation
                gate={gate}
                identifier={pendingIdentifier ?? ""}
                tenancyName={tenancyDisplayName(props.dataset.tenancy)}
                show={pendingIdentifier !== null}
                sending={sending}
                onConfirm={() => send(pendingIdentifier)}
                onCancel={() => setPendingIdentifier(null)}
                onSetEmbargo={props.dataset.access?.can_manage_embargo ? () => { setPendingIdentifier(null); setSettingEmbargo(true); } : undefined}
            />
            <SetEmbargoDialog dataset={props.dataset} show={settingEmbargo} onClose={() => setSettingEmbargo(false)} />
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
            type="button"
            className="h-9 px-3.5 rounded-md border border-primary-300 bg-primary-0 text-primary-900 text-[13px] font-semibold whitespace-nowrap hover:bg-primary-100 transition-colors"
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
                type="button"
                className={`btn-primary-outline btn-small !m-0 h-8 w-fit text-[13px]`}
                onClick={props.onClick}>
                Register manual DOI
            </button>
        );
    }

    function RegisterAutoDOIButton(props) {
        return (
            <button
                type="button"
                className={`btn-primary btn-small !m-0 h-8 w-fit text-[13px]`}
                onClick={props.onClick}>
                Generate DOI automatically
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
                    destructive
                >
                    <div className="flex flex-col gap-2">
                        <p className="m-0 text-sm font-semibold text-primary-900 break-words">{`Are you sure that you want to delete "${props.currentDOI.identifier}" DOI?`}</p>
                        <p className="m-0 text-sm text-primary-700">DOI deletion is permanent. Once deleted, it cannot be recovered.</p>
                    </div>
                </Modal>

                <div className="w-full flex flex-row flex-wrap justify-start items-start gap-x-8 gap-y-3">
                    <CardItem testId="doi-identifier" title="DOI (DIGITAL OBJECT IDENTIFIER)">
                        <a href={getDOIURL(props.currentDOI)} target="_blank" className="font-mono text-[13px] break-all">
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
                                    size={48}
                                    iconName="more_horiz"
                                    iconSize={20}
                                    buttonClassName="flex items-center justify-center w-8 h-8 rounded-md border border-primary-300 bg-primary-0 text-primary-700 hover:bg-primary-100 transition-colors"
                                    disabled={shouldHideDOIDeletion(props.currentDOI)}
                                >
                                    <ContextMenuButtonItem
                                        text="Delete DOI"
                                        destructive
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
            <div className="flex flex-col items-start gap-1">
                <p className="m-0 text-sm leading-5 text-primary-900">
                    This dataset does not have a registered DOI. Would you like to register one?
                </p>
                <p className="m-0 text-[13px] leading-5 text-primary-500">
                    You can choose to manually enter an existing DOI or generate a new one automatically.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                    <RegisterManualDOIButton onClick={props.onRegisterManualDOIClick} />
                    <RegisterAutoDOIButton onClick={props.onRegisterAutoDOIClick} />
                </div>
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
            default: return EMBARGO_ERROR_MESSAGES[code] ?? code;
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
