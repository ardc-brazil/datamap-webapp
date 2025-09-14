import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from "../ui/accordion";
import { CardItem } from "../DatasetDetails/CardItem";
import { DatasetSnapshotResponse } from "../../types/GatekeeperAPI";

interface MetadataProps {
    dataset: DatasetSnapshotResponse;
}

export function Metadata({ dataset }: MetadataProps) {
    const handleToggleAll = () => {
        const accordion = document.querySelector('[data-orientation="vertical"]');
        const allItems = accordion?.querySelectorAll('[data-state]');
        const allOpen = Array.from(allItems || []).every(item => {
            item.getAttribute('data-state') === 'open'
        });

        if (allOpen) {
            allItems?.forEach(item => {
                const trigger = item.querySelector('[data-radix-collection-item]');
                if (trigger && trigger instanceof HTMLElement) {
                    trigger.click();
                }
            });
        } else {
            allItems?.forEach(item => {
                const trigger = item.querySelector('[data-radix-collection-item]');
                if (trigger && trigger instanceof HTMLElement) {
                    trigger.click();
                }
            });
        }
    }

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3>Metadata</h3>
                <div className="flex justify-end mb-2">
                    <button
                        onClick={handleToggleAll}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Collapse All / Expand All
                    </button>
                </div>
            </div>
            <Accordion type="multiple" defaultValue={["item-1", "item-2", "item-3", "item-4", "item-5", "item-6"]}>
                <MetadataAccordionItem title="Colaborators" value="item-1">
                    {dataset.data.colaborators && dataset.data.colaborators.length > 0 ? (
                        dataset.data.colaborators.map((colaborator, index) => (
                            <ItemDescription key={index} title="Colaborator Name">
                                {colaborator.name}
                            </ItemDescription>
                        ))
                    ) : (
                        <ItemDescription title="Colaborator Name">
                            No collaborators
                        </ItemDescription>
                    )}
                </MetadataAccordionItem>
                <MetadataAccordionItem title="Authors" value="item-2">
                    {dataset.data.authors && dataset.data.authors.length > 0 ? (
                        dataset.data.authors.map((author, index) => (
                            <ItemDescription key={index} title="Author Name">
                                {author.name}
                            </ItemDescription>
                        ))
                    ) : (
                        <ItemDescription title="Author Name">
                            No authors
                        </ItemDescription>
                    )}
                </MetadataAccordionItem>
                <MetadataAccordionItem title="License" value="item-3">
                    <ItemDescription title="License Name">
                        {dataset.data.license || "No license specified"}
                    </ItemDescription>
                </MetadataAccordionItem>
                <MetadataAccordionItem title="Coverage" value="item-4">
                    <div className="flex flex-row gap-2">
                        <ItemDescription title="Temporal Coverage Start Date">
                            {formatDate(new Date(dataset.data.start_date))}
                        </ItemDescription>
                        <ItemDescription title="Temporal Coverage End Date">
                            {formatDate(new Date(dataset.data.end_date))}
                        </ItemDescription>
                        <ItemDescription title="Spatial Coverage">
                            <ul className="leading-5">
                                <li>Location: {dataset.data.location.location}</li>
                                <li>Latitude: {dataset.data.location.latitude || "N/A"}</li>
                                <li>Longitude: {dataset.data.location.longitude || "N/A"}</li>
                            </ul>
                        </ItemDescription>
                    </div>
                </MetadataAccordionItem>
                <MetadataAccordionItem title="Provenance" value="item-5">
                    <ItemDescription title="Sources">
                        {dataset.data.source || "No source informed."}
                    </ItemDescription>
                    <ItemDescription title="Source instrument">
                        {dataset.data.source_instrument || "No instrument informed."}
                    </ItemDescription>
                </MetadataAccordionItem>
                <MetadataAccordionItem title="Citation" value="item-6">
                    <ItemDescription title="DOI (DIGITAL OBJECT IDENTIFIER)">
                        <a href={dataset.doi_link} target="_blank">
                            {dataset.doi_identifier}
                        </a>
                    </ItemDescription>
                </MetadataAccordionItem>
            </Accordion>
        </div>
    )
}

interface MetadataAccordionItemProps {
    title: string;
    value: string;
    children: React.ReactNode;
}

function MetadataAccordionItem(props: MetadataAccordionItemProps) {
    return <AccordionItem value={props.value}>
        <AccordionTrigger className="hover:no-underline">
            <h5 className="min-h-fit">{props.title}</h5>
        </AccordionTrigger>
        <AccordionContent >
            <div className="flex flex-col gap-2">
                {props.children}
            </div>
        </AccordionContent>
    </AccordionItem>;
}

function ItemDescription(props: { title: string, children: React.ReactNode }) {
    return (
        <div className="flex flex-row w-full items-center">
            <div className="text-primary-500 w-full">
                <CardItem title={props.title}>
                    {props.children}
                </CardItem>
            </div>
        </div>
    )
}