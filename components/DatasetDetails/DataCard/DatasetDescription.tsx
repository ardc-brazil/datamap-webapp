import axios from "axios";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import TextareaAutosize from 'react-textarea-autosize';
import remarkGfm from "remark-gfm";
import { ExpansibleDiv } from "./ExpansibleDiv";


export function DatasetDescription(props: any) {

    const [editingDescription, setEditDescription] = useState(false);
    const [textContent, setTextContent] = useState(props.dataset.description)


    useEffect(() => {
        setTextContent(props.dataset.description)

    }, []);

    function handleEditDescription(event): void {
        setEditDescription(true);
    }
    function handleCancelEditing(event): void {
        setTextContent(props.dataset.description);
        setEditDescription(false);
    }

    function handleSave(event): void {
        props.dataset.description = textContent;

        axios.put("/api/datasets/" + props.dataset.id, props.dataset)
            .then(response => {
                if (response.status == 200) {
                    setEditDescription(false);
                } else {
                    console.log(response);
                    alert("Sorry! Error...");
                }
            })
            .catch(error => {
                console.log(error);
                alert("Sorry! Error...");
            })
        // .finally(() => actions.setSubmitting(false));

    }


    return <ExpansibleDiv forceExpanded={editingDescription}>
        <div>
            <div className="flex">
                <h5 className="w-full">About Dataset</h5>
                <button className={`${editingDescription && "hidden"} btn-primary-outline btn-small`} onClick={handleEditDescription}>Edit</button>
            </div>
            {editingDescription
                ?
                (
                    <div className="flex flex-col">
                        <div>
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
                :
                (
                    <article className="prose lg:prose-xl max-w-none small-font-size">
                        <ReactMarkdown
                            children={textContent}
                            remarkPlugins={[remarkGfm]} />
                    </article>
                )}
        </div>
    </ExpansibleDiv>;
}
