export type HttpCode = 200 | 300 | 400 | 401 | 403 | 404 | 409 | 422 | 500;

export interface ErrorDetails {
    code: string,
    field?: string
}

/* centralized error object that derives from Node's Error */
export class APIError extends Error {
    public readonly name: string;
    public readonly httpCode: HttpCode;
    public readonly isOperational: boolean;
    public readonly errors?: ErrorDetails[];
    public readonly detail?: unknown;

    constructor(name: string, httpCode: HttpCode, description: string, isOperational: boolean, errors?: ErrorDetails[], detail?: unknown) {
        super(description);
        Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
        this.name = name;
        this.httpCode = httpCode;
        this.isOperational = isOperational;
        this.errors = errors;
        this.detail = detail;
        Error.captureStackTrace(this);
    }
}