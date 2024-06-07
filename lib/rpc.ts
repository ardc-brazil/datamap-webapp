import axios from 'axios';
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