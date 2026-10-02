import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import TextareaAutosize from 'react-textarea-autosize';
import remarkGfm from "remark-gfm";
import { BFFAPI } from "../../../gateways/BFFAPI";
import { UserDetailsResponse, canEditDataset } from "../../../lib/users";
import { GetDatasetDetailsResponse, UpdateDatasetRequest } from "../../../types/BffAPI";
import { EditFormActions } from "../EditFormActions";
import { TextActionButton } from "../TextActionButton";
import { ExpansibleDiv } from "./ExpansibleDiv";

interface Props {
    dataset: GetDatasetDetailsResponse
    user?: UserDetailsResponse
}

export function DatasetDescription(props: Props) {
    const bffGateway = new BFFAPI();
    const [editingDescription, setEditDescription] = useState(false);
    const [textContent, setTextContent] = useState(props.dataset.data.description)
    const canEdit = canEditDataset(props.user, props.dataset);

    useEffect(() => {
        setTextContent(props.dataset.data.description)

    }, []);

    function handleEditDescription(event): void {
        setEditDescription(true);
    }
    function handleCancelEditing(event): void {
        setTextContent(props.dataset.data.description);
        setEditDescription(false);
    }

    function handleSave(event): void {
        props.dataset.data.description = textContent;

        try {
            const updateDatasetRequest = {
                id: props.dataset.id,
                name: props.dataset.name,
                data: props.dataset.data,
                tenancy: props.dataset.tenancy,
                is_enabled: props.dataset.is_enabled
            } as UpdateDatasetRequest

            bffGateway.updateDataset(updateDatasetRequest);
            setEditDescription(false);
        } catch (error) {
            console.log(error);
            alert("Sorry! Error...");
        }
    }

    return <ExpansibleDiv forceExpanded={editingDescription}>
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h2 className="m-0 text-lg leading-7 font-semibold tracking-[-0.01em] text-primary-900">About</h2>
                <TextActionButton hidden={editingDescription || !canEdit} onClick={handleEditDescription}>Edit</TextActionButton>
            </div>
            {editingDescription
                ? (
                    <div className="flex flex-col">
                        <div>
                            {/* TODO: Use Formik */}
                            <TextareaAutosize autoFocus
                                minRows={4}
                                aria-label="Description"
                                placeholder="Describe the dataset. Markdown is supported."
                                className="block w-full px-3 py-2.5 bg-primary-0 border border-primary-300 rounded-md text-sm leading-6 text-primary-900 placeholder:text-primary-400"
                                value={textContent}
                                onChange={e => setTextContent(e.target.value)} />
                        </div>

                        <EditFormActions onCancel={handleCancelEditing} onSave={handleSave} />
                    </div>
                )
                : (
                    <article className="prose max-w-none text-[15px] leading-6 text-primary-700">
                        {textContent
                            ? (<ReactMarkdown
                                children={textContent}
                                remarkPlugins={[remarkGfm]} />
                            )
                            : (<span className="italic">Add a description for your dataset.</span>)
                        }
                    </article>
                )}
        </div>
    </ExpansibleDiv>;
}
