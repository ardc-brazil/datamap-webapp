import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { TabPanel } from "../../../components/DatasetDetails/TabPanel";
import { Tabs } from "../../../components/DatasetDetails/Tabs";

import { signIn } from "next-auth/react";
import Head from "next/head";
import { FormEventHandler, useState } from "react";

function OrcidButton(props) {
  return (
    <button
      type="button"
      className="btn-primary-outline self-center font-medium text-sm px-5 py-2.5 text-center inline-flex items-center mr-2 mb-2 cursor-pointer"
      onClick={() => signIn("orcid", { callbackUrl: props.callbackUrl })}
    >
      <svg
        className="w-8 h-8 mr-2 -ml-1"
        width="327"
        height="327"
        viewBox="0 0 327 327"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M326.072 0H0.0955568C0.0427823 0 0 0.0427823 0 0.0955568V326.072C0 326.125 0.0427823 326.167 0.0955568 326.167H326.072C326.125 326.167 326.167 326.125 326.167 326.072V0.0955568C326.167 0.0427823 326.125 0 326.072 0Z" />
        <path
          d="M163.084 326.167C253.152 326.167 326.167 253.152 326.167 163.084C326.167 73.015 253.152 0 163.084 0C73.015 0 0 73.015 0 163.084C0 253.152 73.015 326.167 163.084 326.167Z"
          fill="#A6CE39"
        />
        <path
          d="M110.209 236.981H90.4605V100.653H110.209V236.981ZM138.876 100.653H191.751C242.077 100.653 264.374 136.965 264.374 168.817C264.374 203.855 236.981 236.981 191.751 236.981H138.239L138.876 100.653ZM158.624 219.781H189.84C234.433 219.781 244.626 186.017 244.626 169.454C244.626 142.061 227.425 119.128 189.203 119.128H159.261L158.624 219.781ZM113.394 72.6232C113.394 79.6307 107.661 85.3641 100.653 85.3641C93.6458 85.3641 87.9124 79.6307 87.9124 72.6232C87.9124 69.2441 89.2547 66.0034 91.6441 63.614C94.0335 61.2246 97.2742 59.8823 100.653 59.8823C107.661 59.8823 113.394 65.6157 113.394 72.6232Z"
          fill="white"
        />
      </svg>
      {props.children}
    </button>
  );
}

function GithubButton(props) {

  const router = useRouter();

  return (
    <button
      type="button"
      className="btn-primary-outline self-center font-medium text-sm px-5 py-2.5 text-center inline-flex items-center mr-2 mb-2 cursor-pointer"
      onClick={() => signIn("github", { callbackUrl: props.callbackUrl })}
    >
      <svg className="w-8 h-8 mr-2 -ml-1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <title>GitHub dark icon</title>
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>

      {props.children}
    </button>
  );
}

export default function LoginPage(props) {
  function getSelectedTabIndex() {
    return 0;
  }

  const defaultTabIndex = getSelectedTabIndex();

  return (
    <div className="container mx-auto flex flex-col gap-16 mt-16">
      <Head>
        <title>DataMap</title>
        <link rel="icon" href="/favicon.ico" />
        <meta charSet="utf-8"></meta>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
      </Head>
      <Link href="/" className="w-full md:w-2/12 h-16 self-center">
        <Image width={0} height={0} className="w-full h-full" src="/img/logo.svg" alt="Datamap logo" />
      </Link>


      {props.error &&
        <div className="flex w-10/12 md:w-4/12 self-center items-center p-4 mb-4 text-primary-900 border-t-4 border-error-300 bg-error-50" role="alert">
          <svg className="flex-shrink-0 w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
          </svg>
          <div className="ml-3 text-sm">
            Error! You are not authenticated.
            <br />
            <span className="text-xs">
              Details:{props.error}
            </span>
          </div>
        </div>
      }

      <div className="w-10/12 md:w-4/12 h-fit border border-primary-200 self-center rounded">
        <Tabs className="py-8" defaultSelectedIndex={defaultTabIndex}>
          <TabPanel title="Sign In">
            <div className="flex flex-col">
              <OrcidButton callbackUrl={props.callbackUrl}>Sign in with ORCID</OrcidButton>
              {process.env.NODE_ENV == "development" &&
                <GithubButton callbackUrl={props.callbackUrl}>Sign in with GitHub</GithubButton>
              }

              {/* 
                This kind of login is only available for local development for automated testing purposes 
                PLEASE: DO NOT ENABLE IT IN PRODUCTION
              */}
              {process.env.NODE_ENV == "development" &&
                (
                  <div className="px-4">
                    <div className="my-8 flex flex-row justify-center items-center">
                      <hr className="w-full" />
                      <span className="px-4">or</span>
                      <hr className="w-full" />
                    </div>
                    <SignInForm callbackUrl={props.callbackUrl} />
                  </div>
                )
              }
            </div>
          </TabPanel>
        </Tabs>
      </div>
    </div>
  );
}

function SignInForm(props) {
  const [userInfo, setUserInfo] = useState({ name: "", email: "", password: "" });
  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    // validate your userinfo
    e.preventDefault();

    signIn("credentials", {
      name: userInfo.name,
      email: userInfo.email,
      password: userInfo.password,
      redirect: true,
      callbackUrl: props.callbackUrl,
    });

  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2 items-center">
        <input
          value={userInfo.name}
          onChange={({ target }) =>
            setUserInfo({ ...userInfo, name: target.value })
          }
          type="name"
          placeholder="John Doe"
          className="w-52"
        />
        <input
          value={userInfo.email}
          onChange={({ target }) =>
            setUserInfo({ ...userInfo, email: target.value })
          }
          type="email"
          placeholder="john@email.com"
          className="w-52"
        />
        <input
          value={userInfo.password}
          onChange={({ target }) =>
            setUserInfo({ ...userInfo, password: target.value })
          }
          type="password"
          placeholder="********"
          className="w-52"
        />
        <input type="submit" value="Login With Credential" className="w-52" />
      </form>
    </div>
  )
}

LoginPage.getInitialProps = async ({ query }) => {
  const { callbackUrl, error } = query
  return { callbackUrl: (callbackUrl ?? "/"), error }
}
