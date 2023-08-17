import { useSession } from 'next-auth/react';
import LoggedLayout from '../../../components/LoggedLayout';

export default function HomePage() {
    const { data: session, status } = useSession();

    // TODO: Create for to update user email if the email is fake
    // const [userData, setUserData] = useState(null);

    // useEffect(() => {

    //     axios.get("/api/user")
    //         .then(response => {
    //             try {
    //                 setUserData(response.data);
    //                 console.log(userData);
    //             } catch (error) {
    //                 console.log(error);
    //             }
    //         })
    //         .catch(error => {
    //             console.log(error);
    //         });
    // }, []);


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
