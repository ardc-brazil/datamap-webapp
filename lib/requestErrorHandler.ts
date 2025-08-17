import { ROUTE_PAGE_DATASETS_DETAILS, ROUTE_PAGE_DATASETS_VERSION_DETAILS, ROUTE_PAGE_LOGIN } from "../contants/InternalRoutesConstants";

/**
 * Utility function to handle 401 errors in dataset pages by redirecting to login
 * @param error The error object from catch block
 * @param req The request object from getServerSideProps
 * @param datasetId The dataset ID
 * @param versionName Optional version name for version-specific pages
 * @returns Redirect object for 401 errors, throws other errors
 */
export function handleDatasetRequestErrors(error: any, req: any, datasetId: string, versionName?: string) {
    // Only redirect to login for 401 (unauthenticated) errors
    if (error.status === 401 || error.statusCode === 401) {
        // Generate current URL based on whether we have a version or not
        const currentUrl = versionName 
            ? ROUTE_PAGE_DATASETS_VERSION_DETAILS({ id: datasetId, versionName })
            : ROUTE_PAGE_DATASETS_DETAILS({ id: datasetId });
        
        // Check if the request is a redirect from nginx or localhost
        const isNginxRedirect = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.headers['x-forwarded-proto'];
        const isLocalhost = req.headers.host?.includes('localhost') || req.headers.host?.includes('127.0.0.1') || req.headers.host?.includes('::1');
        const isDoi = Boolean(isNginxRedirect || isLocalhost);
        
        const loginUrl = ROUTE_PAGE_LOGIN({
            hostname: `https://${req.headers.host}`,
            callbackUrl: currentUrl,
            error: encodeURIComponent("You must be signed in to view dataset information."),
            isDoi: isDoi.toString()
        });
        
        return {
            redirect: {
                destination: loginUrl,
                permanent: false,
            },
        };
    }
    
    // For other errors, let them propagate
    throw error;
}
