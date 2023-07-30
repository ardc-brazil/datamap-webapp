import React, { useEffect, useState } from 'react'
import LoggedLayout from '../../../components/LoggedLayout'
import { useSession } from 'next-auth/react'

export default function HomePage() {
    const { data: session, status } = useSession();
    return (
        <LoggedLayout noPadding={false}>
            <div className="w-full container">
                <h2>Welcome, {session.user.name}!</h2>
                <p className="text-primary-700">
                    Step into the world of scientific data analysis with DataMap, where data exploration becomes a breeze.
                </p>
            </div>
        </LoggedLayout>
    )
}

HomePage.auth = {
    role: "admin",
    loading: <div>loading...</div>,
};
