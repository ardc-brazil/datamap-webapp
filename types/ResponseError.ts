/**
 * Represents a Http Response error to use in the error handler with Next-Connect at /pages/api.
 * @interface
 */
export interface ResponseError extends Error {
    statusCode?: number;
}