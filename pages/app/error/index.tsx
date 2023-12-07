import React from 'react'
import LoggedLayout from "../../../components/LoggedLayout";
import { useRouter } from 'next/router'


export default function ErrorHandlingPage(props) {

    const router = useRouter()



    return (
        <LoggedLayout noPadding={false}>
            <div className="text-center">
                <h3>Access Denied</h3>
                <p className="text-sm">You do not have permission to view this page.</p>
                {router.query['status'] == "403" && (
                    <p className="text-sm">Please request your credentials to <a href="mailto:amaia@usp.br">amaia@usp.br</a>.</p>
                )}
                <p className="text-sm"><b>Error code:</b> {router.query['status']}</p>
            </div>
        </LoggedLayout>
    )
}

ErrorHandlingPage.auth = {
    role: "user",
    loading: <div>loading...</div>,
};