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
        const isNotFound = props.error.status === 404;
        const title = isNotFound ? "Dataset Not Found" : "Error Loading Dataset";
        const message = isNotFound
            ? "The dataset snapshot you're looking for doesn't exist or hasn't been generated yet."
            : "An error occurred while loading the dataset.";

        return (
            <Layout fluid={true} hideFooter={true}>
                <div className="container mx-auto px-8 pt-16">
                    <div className="flex flex-col items-center justify-center max-w-lg mx-auto">
                        <div className="w-full p-6 text-primary-900 border-t-4 border-error-300 bg-error-50 rounded-b-lg" role="alert">
                            <div className="flex items-start">
                                <svg className="flex-shrink-0 w-5 h-5 mt-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
                                </svg>
                                <div className="ml-3">
                                    <h3 className="text-lg font-semibold">{title}</h3>
                                    <p className="mt-2 text-sm">{message}</p>
                                    <p className="mt-3 text-xs text-primary-600">
                                        Details: {props.error.info}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Layout>
        );
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
        const status = error?.status || 500;
        const message = error?.data?.message || 'Failed to load dataset snapshot';
        return {
            props: {
                error: {
                    status: status,
                    info: message
                }
            }
        };
    }
}