import { ErrorMessage, Field, Form, Formik } from "formik"
import { useState } from 'react'
import * as Yup from 'yup'
import { UserDetailsResponse } from "../../lib/users"
import { GetDatasetDetailsDOIResponse, GetDatasetDetailsDOIResponseLink, GetDatasetDetailsDOIResponseState, GetDatasetDetailsResponse } from "../../types/BffAPI"
import { CardItem } from "./CardItem"

interface Props {
    // TODO: this onDOIGenerationChangeState mustn't be spread for all inner components
    onDOIGenerationChangeState?(state: string, newDOIState: GetDatasetDetailsDOIResponse): unknown

    dataset: GetDatasetDetailsResponse
    user?: UserDetailsResponse
}

export default function DatasetCitation(props: Props) {
    const [editing, setEditing] = useState(false);
    const [generating, setGenerating] = useState(false);

    function onRegisterManualDOI() {
        setEditing(true);
    }

    function onRegisterAutoDOI() {
        setGenerating(true);
    }

    function omManualDOIFormEditionCancel() {
        setEditing(false);
    }

    function onGenerationDone(state: string, newDOIState: GetDatasetDetailsDOIResponse) {
        console.log("onGenerationDone");

        debugger;
        props.onDOIGenerationChangeState(state, newDOIState);
        setGenerating(false);
    }



    if (hasDOIRegistered(props?.dataset) && !editing) {
        return <CitationDOIViewer dataset={props.dataset} user={props.user} />
    }

    if (generating) {
        return (
            <CitationGeneratingViewer
                dataset={props.dataset}
                user={props.user}
                onDOIGenerationChangeState={onGenerationDone} />
        )
    }

    if (editing) {
        return <CitationManualDOIFormEdition
            dataset={props.dataset}
            user={props.user}
            omManualDOIFormEditionCancel={omManualDOIFormEditionCancel}
        />
    }

    return <CitationEmpty
        dataset={props.dataset}
        user={props.user}
        onRegisterManualDOI={onRegisterManualDOI}
        onGenerateDOI={onRegisterAutoDOI}
    />
}

interface CitationGeneratingViewerProps extends Props {
    onDOIGenerationChangeState: any

}
function CitationGeneratingViewer(props: CitationGeneratingViewerProps) {
    setTimeout(() => {
        // TODO: this a fake doi state.
        // The real value must come from API.
        //
        // TODO: check error state during creation.
        const newFakeDOIState = {
            identifier: "10.1000/182",
            status: GetDatasetDetailsDOIResponseState.REGISTERED,
            linkType: GetDatasetDetailsDOIResponseLink.AUTO,
        }

        props.onDOIGenerationChangeState("done", newFakeDOIState);
    }, 3000);

    return (
        <div>We are generating your DOI.</div>
    )

}

interface CitationEditionProps extends Props {
    omManualDOIFormEditionCancel: any;

}
/**
 * Register manual citation edit form.
 * @param props 
 * @returns 
 */
function CitationManualDOIFormEdition(props: CitationEditionProps) {

    const schema = Yup.object().shape({
        doi: Yup.object().shape({
            identifier: Yup.string()
                .required("The indentifier is required. e.g: 10.1000/182")
                .matches(/^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i,
                    { message: "invalid format" }),
        })
    });


    function onSubmit(values, { setSubmitting }) {
        // TODO: implement a dataset update after manual DOI is validated
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
                                                            placeholder="https://doi.org/10.1000/182"
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
                                        <CancelEditionButton onClick={props.omManualDOIFormEditionCancel} />
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


interface PropsCitationEmpty extends Props {
    onGenerateDOI: any
    onRegisterManualDOI: any;
}

/**
 * Handles a empty citation.
 * @param props 
 * @returns 
 */
function CitationEmpty(props: PropsCitationEmpty) {
    return (
        <div className="text-center">
            <p>This dataset does not have a registered DOI. Would you like to register one?</p>
            <p><small>You can choose to manually enter an existing DOI or generate a new one automatically.</small></p>
            <RegisterManualDOIButton onClick={props.onRegisterManualDOI} />
            <RegisterAutoDOIButton onClick={props.onGenerateDOI} />
        </div>
    )
}

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

/**
 * A component to show DOi generated information.
 * If the dataset is registered for a DOI, this component is responsible to show this information
 * and allow proper edition based on DOI type.
 * @param props 
 * @returns 
 */
function CitationDOIViewer(props: Props) {

    const doi = props.dataset.current_version.doi;

    function getDOIURL(doi: GetDatasetDetailsDOIResponse): string {
        return `https://doi.org/${doi.identifier}`
    }

    return (
        <div className="flex flex-row w-full items-center">
            <p className="text-primary-500 w-full">
                <div className="flex gap-28 py-4">
                    <CardItem title="DOI (DIGITAL OBJECT IDENTIFIER)">
                        <a href={getDOIURL(doi)} target="_blank">
                            {getDOIURL(doi)}
                        </a>
                    </CardItem>
                    <CardItem title="Status">
                        {doi.status}
                    </CardItem>
                    <CardItem title="Navegate to next state">
                        <button type="submit" className="btn-primary-outline btn-small" >Finadble</button>
                    </CardItem>
                </div>
            </p>
        </div>

    );
}

/**
 * Depreated component.
 * The idea was show a Citation in APA or BibTeX format.
 * @param props 
 * @returns 
 */
function CitationReference(props: Props) {
    return (
        <div className="flex gap-28 py-4">
            <div>
                <CardItem title="CITATION TYPE">
                    <label
                        htmlFor="apa"
                        className="w-full cursor-pointer py-2 mx-2"
                    >
                        <input
                            id="apa"
                            type="radio"
                            value="citation-type"
                            name="citation-type"
                            checked
                            readOnly
                            className="w-5 h-5 accent-primary-900" />
                        <span className="ml-2 text-sm font-medium text-primary-900 align-top">
                            APA
                        </span>
                    </label>
                    <label
                        htmlFor="apa"
                        className="w-full cursor-pointer py-2 mx-2"
                    >
                        <input
                            id="apa"
                            type="radio"
                            value="citation-type"
                            name="citation-type"
                            className="w-5 h-5 accent-primary-900" />
                        <span className="ml-2 text-sm font-medium text-primary-900 align-top">
                            BibTeX
                        </span>
                    </label>
                </CardItem>

                <div className="my-4">
                    <fieldset className="border border-solid border-primary-300 p-3">
                        <legend className="text-sm">Citation:</legend>
                        <p className="text-primary-600">
                            {props.dataset.data.references}
                        </p>
                    </fieldset>
                </div>
            </div>
        </div>
    );
}
/**
 * Check if the dataset has a DOI registered.
 * @param dataset to check DOI info
 * @returns true if has DOI registered to dataset, otherwise false.
 */
function hasDOIRegistered(dataset: GetDatasetDetailsResponse) {
    debugger;
    return dataset?.current_version?.doi;
}

