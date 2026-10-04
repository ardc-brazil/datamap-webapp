import Head from "next/head";
import { ResetPasswordForm } from "../../../components/Account/ResetPasswordForm";
import { BareLayout } from "../../../components/Public/BareLayout";

interface Props {
    token: string
}

export default function ResetPasswordPage(props: Props) {
    return (
        <BareLayout>
            <Head>
                {/* The token is in this page's URL. */}
                <meta name="referrer" content="no-referrer" />
            </Head>
            <div className="mx-auto w-full max-w-[560px] px-4 md:px-8 pt-20 pb-24">
                <ResetPasswordForm token={props.token} />
            </div>
        </BareLayout>
    );
}

export async function getServerSideProps({ query }) {
    return { props: { token: query.token as string } };
}
