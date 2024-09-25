import axios, { HttpStatusCode } from 'axios';
import { APIError, ClientErrors, ErrorDetails } from "../types/APIError";
import { AppLocalContext } from './appLocalContext';

const apiBaseURL = process.env.DATAMAP_BASE_URL;
const apiKey = process.env.DATAMAP_API_KEY;
const apiSecret = process.env.DATAMAP_API_SECRET;
export const defaultTenancy = "datamap/production/data-amazon";

const axiosInterceptorInstance = axios.create({
  baseURL: apiBaseURL,
  timeout: (1000 * 10), // 10 sec
  headers: {
    "Accept": "application/json",
    "X-Api-Key": apiKey,
    "X-Api-Secret": apiSecret
  }
});

export function buildHeaders(context: AppLocalContext) {
  return {
    headers: {
      "X-User-Id": context.uid ?? "",
      "X-Datamap-Tenancies": context.tenancies?.join(";") ?? defaultTenancy,
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
            "Invalid request data",
            true,
            response?.data?.errors
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