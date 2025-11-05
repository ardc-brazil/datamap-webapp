import { NewContext } from "../../../../../../lib/appLocalContext";
import { getDatasetBy } from "../../../../../../lib/dataset";
import { handleDatasetRequestErrors } from "../../../../../../lib/requestErrorHandler";
import DatasetDetailsPage from "../../../../../../components/DatasetDetailsPage";

export default function DatasetDetailsByVersionNamePage(props) {
  return DatasetDetailsPage(props);
}

export async function getServerSideProps({ req, res, query }) {
  const context = await NewContext(req);
  const datasetId = query.datasetId as string;
  
  try {
    const dataset = await getDatasetBy(context, datasetId);

    return {
      props: {
        selectedVersionName: query.versionName,
        dataset
      }
    };
  } catch (error) {
    return handleDatasetRequestErrors(error, req, datasetId, query.versionName);
  }
}