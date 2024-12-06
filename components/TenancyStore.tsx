import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type TenancyStore = {
    root?: string
    environment?: string
    namespace?: string
    tenancySelected: string
    isTenancySelected?(): boolean
    setTenancySelected(tenancy: string): void
}

export const useTenancyStore = create<TenancyStore>()(
    persist(
        (set, get) => ({
            tenancySelected: "",
            root: "",
            environment: "",
            namespace: "",
            isTenancySelected() {
                return !!get().tenancySelected
            },
            setTenancySelected(tenancy) {
                set((state => ({
                    tenancySelected: tenancy,
                    root: tenancy?.split("/")?.[0],
                    environment: tenancy?.split("/")?.[1],
                    namespace: tenancy?.split("/")?.[2],
                })))
            },
        }),
        {
            name: "tenancy-selector-storage",
            storage: createJSONStorage(() => localStorage)
        }
    )
)