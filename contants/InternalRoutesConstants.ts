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
 * Route to the datasets internal page.
 * @constant
 */
export const ROUTE_PAGE_DATASETS_DETAILS = (params) => replaceIt(ROUTE_APP_CONTEXT + '/datasets/:id', params);

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
export const ROUTE_PAGE_SEARCH = ROUTE_APP_CONTEXT + '/search';

function replaceIt(url: string, params: any = {}) {
    var newUrl = '';
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

