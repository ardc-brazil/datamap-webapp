import { Description } from "@/components/DatasetSnapshot/Description";
import { DataExplorerSection } from "@/components/DatasetSnapshot/ExplorerSection";
import { Header } from "@/components/DatasetSnapshot/Header";
import { Metadata } from "@/components/DatasetSnapshot/Metadata";
import Layout from "@/components/Layout";
import { Separator } from "@/components/ui/separator";
import { NewContext } from "../../../lib/appLocalContext";
import { getDatasetSnapshot } from "../../../lib/dataset";
import { DatasetSnapshotResponse } from "../../../types/GatekeeperAPI";

interface PublicDatasetPageProps {
    dataset: DatasetSnapshotResponse;
    error: {
        status: number;
        info: string;
    };
}

export default function PublicDatasetPage(props: PublicDatasetPageProps) {

    if (props.error) {
        return <div>Error: {props.error.status} {props.error.info}</div>;
    }


    return (
        <Layout fluid={true} hideFooter={true}>
            <div className="container mx-auto px-8 space-y-12 pt-8 mb-24">
                <Header dataset={props.dataset} />
                <Separator className="my-8" orientation="horizontal" />
                <Description title="About Dataset" description={props.dataset.data.description} />
                <DataExplorerSection dataset={props.dataset} />
                <Metadata dataset={props.dataset} />
            </div>
        </Layout>
    );
}

export async function getServerSideProps({ req, query }) {
    const context = await NewContext(req);
    const datasetId = query.datasetId as string;
    const versionName = query.version as string;

    try {
        const dataset = await getDatasetSnapshot(context, datasetId, versionName)

        return {
            props: {
                dataset: dataset
            }
        }
    } catch (error) {
        console.error('Error in getServerSideProps:', error);
        return {
            props: {
                error: {
                    status: 500,
                    info: error.message || 'Failed to load dataset snapshot'
                }
            }
        };
    }
}