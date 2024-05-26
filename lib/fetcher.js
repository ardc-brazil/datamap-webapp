/**
 * A basic fetcher for SWR.
 * @param  {...any} args 
 * @returns 
 */
export const fetcher = async url => {
    const res = await fetch(url)
    // If the status code is not in the range 200-299,
    // we still try to parse and throw it.
    if (!res.ok) {
        const error = new Error('An error occurred while fetching the data.')
        // Attach extra info to the error object.
        error.info = res?.statusText
        error.status = res.status
        throw error
    }

    return res.json()
}

export function SWRRetry(error, key, config, revalidate, { retryCount }) {
    // Never retry on 404.
    if (error.status === 404) return

    // Never retry for a specific key.
    if (key === '/api/user') return

    // Only retry up to 10 times.
    if (retryCount >= 10) return

    // Retry after 5 seconds.
    setTimeout(() => revalidate({ retryCount }), 5000)
}