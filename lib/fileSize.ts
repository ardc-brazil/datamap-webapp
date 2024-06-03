import { GetDatasetDetailsVersionResponse } from "../types/BffAPI";

/**
 * Check if the files has size_bytes available to calculate.
 * @param current_version Dataset version with files
 * @returns true if the files set has size
 */
function hasFilesSize(current_version: GetDatasetDetailsVersionResponse): boolean {
    return current_version?.files?.length > 0 &&
        current_version?.files?.[0].size_bytes > 0;
}

/**
 * Total bytes of the file set
 * @param current_version Dataset version with files
 * @returns Number with total bytes of the file set
 */
function totalBytes(current_version: GetDatasetDetailsVersionResponse): number {

    if (!hasFilesSize(current_version)) {
        return 0;
    }

    return current_version.files.
        map(x => x.size_bytes).
        reduce((acc, size) => 0 + acc + size, 0)
}

/**
 * Converts total bytes in size.
 * @param bytes Total bytes to convert to size
 * @returns String size of the total bytes
 */
function bytesToSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes'
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
    if (i === 0) return `${bytes} ${sizes[i]}`;
    return `${(bytes / (1024 ** i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Total dataset version files size.
 * @param current_version Dataset version with files to calculate the size.
 * @returns String that represents the total dataset version files size.
 */
export function totalDatasetVersionFilesSize(current_version: GetDatasetDetailsVersionResponse): string {
    const total = totalBytes(current_version);
    return bytesToSize(total);
}
