import { NewContext } from "../../../../lib/appLocalContext";
import { getDatasetBy } from "../../../../lib/dataset";
import { getUserByUID } from "../../../../lib/users";
import DatasetDetailsPage from "../../../../components/DatasetDetailsPage";

export default function DatasetDetailsPageById(props) {
    return DatasetDetailsPage(props)
}

export async function getServerSideProps({ req, query }) {
    const context = await NewContext(req);
    const datasetId = query.datasetId as string;
    const dataset = await getDatasetBy(context, datasetId);
    const user = await getUserByUID(context);

    return {
        props: {
            dataset,
            user
        }
    };
}

DatasetDetailsPageById.auth = {
    role: "admin",
    loading: <div>loading...</div>,
};