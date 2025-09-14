import { MaterialSymbol } from "react-material-symbols";
import { Button } from "../ui/button";
import { ROUTE_PAGE_DATASETS_DETAILS } from "@/contants/InternalRoutesConstants";
import Router from "next/router";

export function ActionItems(props: { dataset_id: string }) {
    return (
        <div>
            <Button size="lg" onClick={() => {
                Router.push({
                    pathname: ROUTE_PAGE_DATASETS_DETAILS({ id: props.dataset_id }),
                });
            }}>
                <MaterialSymbol icon="download" />
                Download
            </Button>
        </div>
    )
}