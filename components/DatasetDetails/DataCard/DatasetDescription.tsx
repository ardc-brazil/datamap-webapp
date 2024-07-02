import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import TextareaAutosize from 'react-textarea-autosize';
import remarkGfm from "remark-gfm";
import { BFFAPI } from "../../../gateways/BFFAPI";
import { UserDetailsResponse, canEditDataset } from "../../../lib/users";
import { GetDatasetDetailsResponse, UpdateDatasetRequest } from "../../../types/BffAPI";
import { ExpansibleDiv } from "./ExpansibleDiv";

interface Props {
    dataset: GetDatasetDetailsResponse
    user?: UserDetailsResponse
}

export function DatasetDescription(props: Props) {
    const bffGateway = new BFFAPI();
    const [editingDescription, setEditDescription] = useState(false);
    const [textContent, setTextContent] = useState(props.dataset.data.description)
    const canEdit = canEditDataset(props.user);

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
        <div>
            <div className="flex">
                <h5 className="w-full">About Dataset</h5>
                <button className={`${(editingDescription || !canEdit) && "hidden"} btn-primary-outline btn-small w-16 h-8`} onClick={handleEditDescription}>Edit</button>
            </div>
            {editingDescription
                ? (
                    <div className="flex flex-col">
                        <div>
                            {/* TODO: Use Formik */}
                            <TextareaAutosize autoFocus
                                value={textContent}
                                onChange={e => setTextContent(e.target.value)} />
                        </div>

                        <div className="flex flex-row justify-end py-4">
                            <button className="btn-primary-outline btn-small w-fit" onClick={handleCancelEditing}>Cancel</button>
                            <button className="btn-primary btn-small w-fit" onClick={handleSave}>Save</button>
                        </div>
                    </div>
                )
                : (
                    <article className="prose lg:prose-xl max-w-none small-font-size">
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
