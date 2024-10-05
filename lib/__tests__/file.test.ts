import { GetDatasetDetailsVersionFileResponse, GetDatasetDetailsVersionResponse } from "../../types/BffAPI";
import { totalDatasetVersionFilesSize } from "../file";

describe('bytesToSize', () => {
    test.each([
        [buildVersion(0), '0 Bytes'],
        [buildVersion(1), '1 Bytes'],
        [buildVersion(2000), '2.0 KB'],
        [buildVersion(30000), '29.3 KB'],
        [buildVersion(400000), '390.6 KB'],
        [buildVersion(5000000), '4.8 MB'],
        [buildVersion(60000000), '57.2 MB'],
        [buildVersion(700000000), '667.6 MB'],
        [buildVersion(8000000000), '7.5 GB'],
        [buildVersion(90000000000), '83.8 GB'],
        [buildVersion(100000000000), '93.1 GB'],
        [buildVersion(1100000000000), '1.0 TB'],
        [buildVersion(12000000000000), '10.9 TB'],
        [buildVersion(130000000000000), '118.2 TB'],
        [buildVersion(1400000000000000), '1273.3 TB'],
        [buildVersion(15000000000000000), '13642.4 TB'],
    ])('.totalDatasetVersionFilesSize(%p)', (
        version: GetDatasetDetailsVersionResponse,
        expected: string,
    ) => {
        expect(
            totalDatasetVersionFilesSize(version),
        ).toBe(expected);
    });
});

function buildVersion(sizeBytes: number): GetDatasetDetailsVersionResponse {
    return {
        files: [
            {
                size_bytes: sizeBytes
            } as GetDatasetDetailsVersionFileResponse
        ]

    } as GetDatasetDetailsVersionResponse;
}