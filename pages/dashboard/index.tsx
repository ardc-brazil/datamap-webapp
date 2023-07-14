import { useEffect } from "react";
import useSWR from "swr";
import LoggedLayout from "../../components/LoggedLayout";

import { useRouter } from "next/router";
import { fetcher, useUser } from "../../lib/hooks";

function UserList() {
  const { data: { users } = {} } = useSWR("/api/users", fetcher);
  return (
    <>
      <h2>All users</h2>
      {!!users?.length && (
        <ul>
          {users.map((user) => (
            <li key={user.username}>
              <pre>{JSON.stringify(user, null, 2)}</pre>
            </li>
          ))}

          <style jsx>{`
            pre {
              white-space: pre-wrap;
              word-wrap: break-word;
            }
          `}</style>
        </ul>
      )}
    </>
  );
}

export default function DashboardPage() {
  const [user, { loading }] = useUser();
  const router = useRouter();

  useEffect(() => {

    debugger;
    // redirect user to login if not authenticated
    if (!loading && !user) router.replace("/account/login");

  }, [user, loading]);

  return (
    <LoggedLayout>
      <div>DashboardPage</div>

      {user && (
        <>
          <p>Currently logged in as:</p>
          <pre>{JSON.stringify(user, null, 2)}</pre>
        </>
      )}

      <UserList />
    </LoggedLayout>
  );
}
