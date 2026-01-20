import { GetMinimalDatasetsDetasetDetailsResponse } from "../../types/BffAPI";
import { ListDatasetHeader } from "./ListDatasetHeader";
import ListItem from "./ListItem";
import { ListDatasetPageNavigator } from "./ListDatasetPageNavigator";
import { PageSizeSelector } from "./PageSizeSelector";

interface Props {
  data: GetMinimalDatasetsDetasetDetailsResponse[]
  requestedAt: number
  currentPage: number
  totalPages: number
  totalCount: number
  hasNext: boolean
  hasPrevious: boolean
  onPageChange: (page: number) => void
  pageSize: number
  onPageSizeChange: (pageSize: number) => void
}

export function ListDataset(props: Props) {
  const itemCount = props.totalCount;
  return (
    <div id="listDataset" className="flex flex-col mr-4 w-full">
      <ListDatasetHeader itemCount={itemCount} requestedAt={props?.requestedAt} />
      <div data-testid="listDataset-items" className="border-t border-primary-200">
        {props.data.map((element, index) => (
          <ListItem key={index} dataset={element} />
        ))}
      </div>
      <div className="py-8 flex flex-row items-center justify-between gap-4">
        <PageSizeSelector
          pageSize={props.pageSize}
          onPageSizeChange={props.onPageSizeChange}
        />
        {props.totalPages > 1 && (
          <ListDatasetPageNavigator
            currentPage={props.currentPage}
            totalPages={props.totalPages}
            hasNext={props.hasNext}
            hasPrevious={props.hasPrevious}
            onPageChange={props.onPageChange}
          />
        )}
      </div>
    </div>
  );
}
