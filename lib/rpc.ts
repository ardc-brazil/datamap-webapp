import axios, { HttpStatusCode } from 'axios';
import { APIError, HttpCode } from "../types/APIError";
import { AppLocalContext } from './appLocalContext';
import { callOutcome, operationOf, recordExternalCall } from './externalCalls';

const apiBaseURL = process.env.DATAMAP_BASE_URL;
const apiKey = process.env.DATAMAP_API_KEY;
const apiSecret = process.env.DATAMAP_API_SECRET;

const axiosInterceptorInstance = axios.create({
  baseURL: apiBaseURL,
  timeout: (1000 * 10), // 10 sec
  headers: {
    "Accept": "application/json",
    "X-Api-Key": apiKey,
    "X-Api-Secret": apiSecret
  }
});

const STARTED_AT = Symbol("startedAt");

type TimedConfig = { method?: string; url?: string; [STARTED_AT]?: number };

function recordCall(config: TimedConfig | undefined, status: number | undefined, error?: { code?: string }) {
  const startedAt = config?.[STARTED_AT];
  if (startedAt === undefined) return;
  recordExternalCall(
    "gatekeeper",
    operationOf(config?.method, config?.url),
    callOutcome(status, error),
    (Date.now() - startedAt) / 1000
  );
}

axiosInterceptorInstance.interceptors.request.use((config) => {
  (config as TimedConfig)[STARTED_AT] = Date.now();
  return config;
});

const RETRYABLE_CODES = new Set(["ECONNREFUSED", "ECONNRESET", "EAI_AGAIN"]);

/**
 * A deploy replaces the two API instances one at a time, so for a moment one is
 * started but not yet listening. Only a request that never reached the API, and
 * only one whose repetition cannot create or change anything.
 */
export function shouldRetry(error: {
  code?: string;
  response?: unknown;
  config?: { method?: string; __retried?: boolean };
}): boolean {
  const config = error?.config;
  if (!config || config.__retried) return false;
  if (error?.response) return false;
  if (!RETRYABLE_CODES.has(error?.code ?? "")) return false;
  const method = (config.method ?? "get").toLowerCase();
  return method === "get" || method === "head";
}

axiosInterceptorInstance.interceptors.response.use(
  (response) => {
    recordCall(response.config, response.status);
    return response;
  },
  (error) => {
    recordCall(error?.config, error?.response?.status, error ?? {});

    if (shouldRetry(error)) {
      error.config.__retried = true;
      return axiosInterceptorInstance.request(error.config);
    }

    return Promise.reject(error);
  }
);

export function buildHeaders(context: AppLocalContext) {
  return {
    headers: {
      "X-User-Id": context.uid ?? "",
      "X-Datamap-Tenancies": context.tenancy,
      // The gatekeeper honours this, so one action reads as one id across both.
      ...(context.requestId ? { "X-Request-Id": context.requestId } : {}),
    }
  }
}

export default axiosInterceptorInstance;

export function httpErrorHandler(error) {

  let handledError: APIError;
  if (error === null) {
    handledError = new APIError(
      "NULL_ERROR",
      HttpStatusCode.InternalServerError,
      "Error is null",
      false
    );
  }

  if (axios.isAxiosError(error)) {
    //here we have a type guard check, error inside this if will be treated as AxiosError
    const response = error?.response
    const request = error?.request

    // here we have access the config used to make the api call (we can make a retry using this conf)
    // const config = error?.config 

    if (response) {
      //The request was made and the server responded with a status code that falls out of the range of 2xx the http status code mentioned above
      const statusCode = response?.status
      if (statusCode === 404) {
        handledError = new APIError(
          "NOT_FOUND",
          HttpStatusCode.NotFound,
          "Resource does not exists",
          true
        );
      } else if (statusCode === 401) {
        handledError = new APIError(
          "UNAUTHORIZED",
          HttpStatusCode.Unauthorized,
          "user not authorized to perform the operation",
          true
        )
      } else if (statusCode === 400) {
        handledError = new APIError(
          "BAD_REQUEST",
          HttpStatusCode.BadRequest,
          response?.data?.details ?? response?.data?.detail,
          true,
          response?.data?.errors,
          response?.data?.detail
        )
      } else if (statusCode === 403) {
        handledError = new APIError(
          "FORBIDDEN",
          HttpStatusCode.Forbidden,
          "user not allowed to perform the operation",
          true
        )
      } else if (statusCode === 409) {
        handledError = new APIError(
          "CONFLICT",
          HttpStatusCode.Conflict,
          response?.data?.detail,
          true,
          undefined,
          response?.data?.detail
        )
      } else if (statusCode >= 400 && statusCode < 500) {
        handledError = new APIError(
          "CLIENT_ERROR",
          statusCode as HttpCode,
          typeof response?.data?.detail === "string" ? response.data.detail : "Client error",
          true,
          response?.data?.errors,
          response?.data?.detail
        )
      }
    } else if (request) {
      //The request was made but no response was received, 
      // `error.request` is an instance of XMLHttpRequest in the browser and an 
      // instance of http.ClientRequest in Node.js
      handledError = new APIError(
        "NOT_RESPONSE",
        HttpStatusCode.InternalServerError,
        "No response received",
        true
      );
    }
  }

  if (handledError === null || handledError === undefined) {
    handledError = new APIError(
      "INTERNAL_SERVER_ERROR",
      HttpStatusCode.InternalServerError,
      "InternalServerError",
      true
    )
  }

  //Something happened in setting up the request and triggered an Error
  // console.log({
  //   originalError: error,
  //   handledError: handledError
  // })

  return handledError;
}