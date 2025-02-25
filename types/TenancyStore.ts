/**
 * Unique name for any (cookie, localstorage) tenancy storage.
 */
export const TENANCY_STORAGE_NAME = "datamap.tenancy-selector-storage";

/**
 * Stores tenancy selection and options for the user
 */
export interface TenancyStore {
    root?: string
    environment?: string
    namespace?: string
    tenancySelected: string
    isTenancySelected?(): boolean
    setTenancySelected(tenancy: string): void
}

