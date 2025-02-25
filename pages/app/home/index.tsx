import { useSession } from 'next-auth/react';
import LoggedLayout from '../../../components/LoggedLayout';
export default function HomePage() {
    const { data: session } = useSession();

    return (
        <LoggedLayout noPadding={false}>
            <div className="w-full container">
                <h2>Welcome, {session.user.name}!</h2>
                <p className="text-primary-700">
                    Step into the world of scientific data analysis with DataMap, where data exploration becomes a breeze.
                </p>

                {/* {userData &&
                    <span>{userData.user.email}</span>
                } */}
            </div>
        </LoggedLayout>
    )
}

HomePage.auth = {
    role: "admin",
    loading: <div>loading...</div>,
};
