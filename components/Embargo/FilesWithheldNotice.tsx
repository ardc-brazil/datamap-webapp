import { MaterialSymbol } from "react-material-symbols";
import { formatShortDate, tenancyDisplayName } from "../../lib/embargoDisplay";
import { bytesToSize } from "../../lib/file";
import { GetDatasetDetailsResponse, GetDatasetDetailsVersionResponse } from "../../types/BffAPI";

interface Props {
    dataset: GetDatasetDetailsResponse
    version?: GetDatasetDetailsVersionResponse
}

export function FilesWithheldNotice(props: Props) {
    if (!props.version?.files_withheld) {
        return null;
    }

    const summary = props.version.files_summary;
    const tenancy = tenancyDisplayName(props.dataset.tenancy);
    const owner = props.dataset.owner?.name;

    return (
        <div data-testid="files-withheld" className="flex flex-col items-center gap-3 rounded-lg border border-primary-200 bg-primary-0 px-8 py-9 text-center">
            <span aria-hidden="true" className="flex items-center justify-center h-11 w-11 rounded-full bg-embargo-100 text-embargo-800">
                <MaterialSymbol icon="lock" size={22} grade={-25} weight={400} fill />
            </span>
            <span className="text-base font-semibold text-primary-900">
                {summary?.count ?? 0} files · {bytesToSize(summary?.total_size_bytes ?? 0)}, under embargo
            </span>
            <span className="max-w-[460px] text-sm leading-[21px] text-primary-600">
                File names and downloads become available to {tenancy} members on{" "}
                <strong className="font-semibold text-primary-900">{formatShortDate(props.dataset.embargo?.until ?? "")}</strong>.
                Until then only the owner and the people they&apos;ve shared it with can reach them. You can cite the dataset now.
            </span>
            {owner && <span className="mt-1 text-[13px] text-primary-500">Need it earlier? Ask the owner, {owner}, to share it with you.</span>}
        </div>
    );
}
