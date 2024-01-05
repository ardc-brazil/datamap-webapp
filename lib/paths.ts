/**
 * The path param is a valid file path?
 * @param path File serve path
 * @returns true if is a valid file pattern, otherwise false.
 */
export function isValidPath(path: string): boolean {
    const regex = /\/\w+\.\w+$/g;
    return regex.test(path);
}

/**
 * The path param is a valid folder path?
 * @param path Folder serve path
 * @returns true if is a valid folder pattern, otherwise false.
 */
export function isValidPathForFolder(path: string): boolean {
    const regex = /\/\w+\/\*\*$/g;
    return regex.test(path);
}