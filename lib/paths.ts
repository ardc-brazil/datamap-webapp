/**
 * The path param is a valid file path?
 * @param path File serve path
 * @returns true if is a valid file pattern, otherwise false.
 */
export function isValidPath(path: string): boolean {
    const regex = /\/\w+\.\w+$/g;
    return regex.test(path);
}