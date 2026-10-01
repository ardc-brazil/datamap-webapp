import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { DatasetsTabs } from "../../../components/Datasets/DatasetsTabs";
import LoggedLayout from "../../../components/LoggedLayout";
import { EmptySearch } from "../../../components/Search/EmptySearch";
import { ListDataset } from "../../../components/Search/ListDataset";
import { useTenancyStore } from "../../../components/TenancyStore";
import { ROUTE_PAGE_DATASETS_NEW } from "../../../contants/InternalRoutesConstants";
import { tenancyDisplayName } from "../../../lib/embargoDisplay";
import { SWRRetry, fetcher } from "../../../lib/fetcher";
import { GetDatasetsResponse } from "../../../types/BffAPI";

export default function SharedDatasetsPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const tenancySelected = useTenancyStore((state) => state.tenancySelected);

    const { data, error, isLoading } = useSWR(
        `/api/datasets/shared?page=${currentPage}&page_size=${pageSize}`,
        fetcher,
        { onErrorRetry: SWRRetry }
    );
    const datasets = data as GetDatasetsResponse;

    return (
        <LoggedLayout tenancyOptional>
            <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
                <div className="flex flex-wrap justify-between items-end gap-6">
                    <div>
                        <h2 className="m-0 text-3xl leading-tight">Datasets</h2>
                        <p className="mt-2 mb-0 text-[15px] leading-[23px] text-primary-600">Explore, analyze, and share quality data.</p>
                    </div>
                    {tenancySelected &&
                        <Link href={ROUTE_PAGE_DATASETS_NEW} className="btn-primary m-0 flex-none hover:text-primary-50">+ New dataset</Link>
                    }
                </div>

                <DatasetsTabs
                    active="shared"
                    tenancyName={tenancySelected ? tenancyDisplayName(tenancySelected) : null}
                    sharedCount={datasets?.total_count}
                />

                <div>
                    {isLoading && <EmptySearch>Loading datasets...</EmptySearch>}
                    {error && <EmptySearch>The shared datasets could not be loaded.</EmptySearch>}
                    {datasets && datasets.content.length === 0 &&
                        <EmptySearch>Nothing has been shared with you yet.</EmptySearch>
                    }
                    {datasets && datasets.content.length > 0 &&
                        <ListDataset
                            data={datasets.content}
                            requestedAt={Date.now()}
                            currentPage={datasets.page}
                            totalPages={datasets.total_pages}
                            totalCount={datasets.total_count}
                            hasNext={datasets.has_next}
                            hasPrevious={datasets.has_previous}
                            onPageChange={setCurrentPage}
                            pageSize={pageSize}
                            onPageSizeChange={(size) => {
                                setPageSize(size);
                                setCurrentPage(1);
                            }}
                        />
                    }
                </div>
            </div>
        </LoggedLayout>
    );
}

SharedDatasetsPage.auth = {
    role: "user",
    loading: <div>loading...</div>,
};
