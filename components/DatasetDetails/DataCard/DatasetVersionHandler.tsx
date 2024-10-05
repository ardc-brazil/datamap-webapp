import { totalDatasetVersionFilesSize } from "../../../lib/file"
import { GetDatasetDetailsVersionResponse } from "../../../types/BffAPI"

interface Props {
  datasetVersion: GetDatasetDetailsVersionResponse
}

export default function DatasetVersionHandler(props: Props) {
  return (
    <>
      <span className="text-sm underline">
        Version {props.datasetVersion.name}
      </span>
      {" "}
      <span className="text-primary-500 no-underline">({totalDatasetVersionFilesSize(props.datasetVersion)})</span>
    </ >
  )
}
