import Router from "next/router";
import { useEffect } from "react";
import { ROUTE_PAGE_ADMIN_REQUESTS } from "../../../contants/InternalRoutesConstants";

export default function AdminIndexPage() {
    useEffect(() => {
        Router.replace(ROUTE_PAGE_ADMIN_REQUESTS);
    }, []);
    return null;
}

AdminIndexPage.auth = {
    role: "admin",
    admin: true,
    loading: <div>loading...</div>,
};
