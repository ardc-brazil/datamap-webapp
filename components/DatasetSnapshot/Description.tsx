import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import { ExpansibleDiv } from "../DatasetDetails/DataCard/ExpansibleDiv";
import remarkGfm from "remark-gfm";

interface DescriptionProps {
    description: string
    title: string
}

export function Description(props: DescriptionProps) {
    return (
        <div className="space-y-4">
            <h3>{props.title}</h3>
            <div className="p-8">
                <ExpansibleDiv forceExpanded={false}>
                    <div    >
                        <article className="prose lg:prose-xl max-w-none small-font-size">
                            <ReactMarkdown
                                children={props.description}
                                remarkPlugins={[remarkGfm]} />
                        </article>
                    </div>
                </ExpansibleDiv>
            </div>
        </div>
    )
}