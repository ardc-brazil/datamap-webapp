/**
 * A basic fetcher for SWR.
 * @param  {...any} args 
 * @returns 
 */
export const fetcher = (...args) => fetch(...args).then(res => res.json())