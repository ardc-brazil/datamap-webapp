import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Custom404() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the home page after 3 seconds (or immediately if you prefer)
    const timeout = setTimeout(() => {
      router.push('/');
    }, 3000); // Redirect after 3 seconds

    // Clear the timeout if the component is unmounted
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <p>Redirecting to the home page...</p>
    </div>
  );
}
