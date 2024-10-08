import { GetDatasetDetailsVersionResponse } from "../types/BffAPI";

/**
 * Check if the files has size_bytes available to calculate.
 * @param current_version Dataset version with files
 * @returns true if the files set has size
 */
function hasFilesSize(current_version: GetDatasetDetailsVersionResponse): boolean {
    return current_version?.files_in?.length > 0 &&
        current_version?.files_in?.[0].size_bytes > 0;
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

    return current_version.files_in.
        map(x => x.size_bytes).
        reduce((acc, size) => 0 + acc + size, 0)
}

/**
 * Converts total bytes in size.
 * @param bytes Total bytes to convert to size
 * @returns String size of the total bytes
 */
export function bytesToSize(bytes: number): string {
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

/**
     * Extract the file name from a full path file.
     * @param path full path for the file
     * @returns file name
     * @example
     * - /path/to/a/file.txt -> file.txt
     */
export function fileName(path: string): string {
    const tokens = path.split("/");
    return tokens[tokens.length - 1];
}

export function fileNameResolution(path: string): string {
    const fl = fileName(path);

    // If the path is a folder, also should the folder name.
    // This is temporary for Remote Files Upload mode.
    if (isFolder(path)) {
        const tokens = path.split("/");
        return tokens[tokens.length - 2];
    }

    return fl
}

export function isFolder(path: string): boolean {
    const fl = fileName(path);
    return fl == "**";
}
