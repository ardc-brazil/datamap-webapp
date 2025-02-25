import { getCookie, removeCookie, setCookie } from 'typescript-cookie';
import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';
import { TENANCY_STORAGE_NAME, TenancyStore } from "../types/TenancyStore";

const cookiesStorage: StateStorage = {
  getItem: (name: string) => {
    return getCookie(name) ?? null;
  },
  setItem: (name: string, value: string) => {
    setCookie(name, value, {
      expires: Number.MAX_SAFE_INTEGER,
      path: "/",
      
    });
  },
  removeItem: (name: string) => {
    removeCookie(name);
  }
}

export default cookiesStorage;

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
        set((() => ({
          tenancySelected: tenancy,
          root: tenancy?.split("/")?.[0],
          environment: tenancy?.split("/")?.[1],
          namespace: tenancy?.split("/")?.[2],
        })))
      },
    }),
    {
      name: TENANCY_STORAGE_NAME,
      storage: createJSONStorage(() => cookiesStorage)
    }
  )
)