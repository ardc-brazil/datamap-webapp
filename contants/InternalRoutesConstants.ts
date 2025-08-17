// Dedicated file to config reusable contants values.

/**
 * The name of the internal context of the app.
 * @constant
 */
export const ROUTE_APP_CONTEXT = '/app';

/**
 * Route to the home internal page.
 * @constant
 */
export const ROUTE_PAGE_HOME = ROUTE_APP_CONTEXT + '/home';

/**
 * Route to the datasets internal page.
 * @constant
 */
export const ROUTE_PAGE_DATASETS = ROUTE_APP_CONTEXT + '/datasets';

/**
 * Route to the notebooks internal page.
 * @constant
 */
export const ROUTE_PAGE_NOTEBOOKS = ROUTE_APP_CONTEXT + '/notebooks';

/**
 * Route to the new notebook internal page.
 * @constant
 */
export const ROUTE_PAGE_NOTEBOOKS_NEW = ROUTE_PAGE_NOTEBOOKS + "/new";

/**
 * Route to the tenancy selector pages
 * @constant
 */
export const ROUTE_PAGE_TENANCY_SELECTOR = ROUTE_APP_CONTEXT + "/tenancy";

/**
 * Route to the datasets internal page.
 * @constant
 */
export const ROUTE_PAGE_DATASETS_DETAILS = (params) => replaceIt(ROUTE_APP_CONTEXT + '/datasets/:id', params);

/**
 * Route to the datasets specific version internal page.
 * @constant
 */
export const ROUTE_PAGE_DATASETS_VERSION_DETAILS = (params) => replaceIt(ROUTE_APP_CONTEXT + '/datasets/:id/versions/:versionName', params);

/**
 * Route to the new datasets internal page.
 * @constant
 */
export const ROUTE_PAGE_DATASETS_NEW = ROUTE_PAGE_DATASETS + "/new";


/**
 * Route to the user profile internal page.
 * @constant
 */
export const ROUTE_PAGE_PROFILE = ROUTE_APP_CONTEXT + '/profile';

/**
 * Route to the search internal page.
 * @constant
 */
export const ROUTE_PAGE_SEARCH = ROUTE_APP_CONTEXT + '/datasets';

/**
 * Route to the error handling internal page.
 * @constant
 */
export const ROUTE_PAGE_ERROR = (params) => appendSearchParams(ROUTE_APP_CONTEXT + '/error', params);

/**
 * Route to the login page.
 * @constant
 */
export const ROUTE_PAGE_LOGIN = (params) => appendSearchParams('/account/login', params);

function appendSearchParams(urlString: string, params: any = {}) {
    // Check if we're in a browser environment
    const isBrowser = typeof window !== 'undefined';
    
    if (isBrowser) {
        // Client-side: use URL constructor with full origin
        let url = new URL(window.location.origin + urlString);
        
        Object.entries(params).forEach(entry => {
            const [key, value] = entry;
            url.searchParams.set(key, value as string);
        });
        
        return url.toString();
    } else {
        // Server-side: use hostname from params or fallback to localhost
        const hostname = params.hostname || 'http://localhost';
        const { hostname: _, ...queryParams } = params; // Remove hostname from query params
        
        const url = new URL(urlString, hostname);
        
        Object.entries(queryParams).forEach(entry => {
            const [key, value] = entry;
            console.log("===> key", key);
            console.log("===> value", value);
            url.searchParams.set(key, value as string);
        });
        
        // Return just the pathname and search params (without the base URL)
        return url.pathname + url.search;
    }
}

function replaceIt(url: string, params: any = {}) {
    const tokens = url.split('/')
    var result = [];

    for (const token of tokens) {
        const tk = token.replace(":", "")
        if (params[tk]) {
            result.push(params[tk]);
        } else {
            result.push(token);
        }
    }

    return result.join('/');
}

