import { getToken } from "next-auth/jwt";
import { InvitationCard } from "../../components/Invitation/InvitationCard";
import { BareLayout } from "../../components/Public/BareLayout";
import { invitationAccount, invitationPageProps } from "../../lib/invitationPage";
import { rethrowSafely } from "../../lib/logging";
import { getInvitationPreview } from "../../lib/share";
import { InvitationPreview } from "../../types/GatekeeperAPI";

interface Props {
    token: string
    preview: InvitationPreview
    account: string | null
}

export default function InvitationPage(props: Props) {
    return (
        <BareLayout>
            <div className="mx-auto w-full max-w-[560px] px-4 md:px-8 pt-20 pb-24">
                <InvitationCard token={props.token} preview={props.preview} account={props.account} />
            </div>
        </BareLayout>
    );
}

export async function getServerSideProps({ req, query }) {
    const token = query.token as string;
    let preview: InvitationPreview | null = null;
    try {
        preview = await getInvitationPreview(token);
    } catch (error) {
        if (error?.response?.status !== 404) {
            rethrowSafely("invitation page failed", error);
        }
    }
    const session = await getToken({ req });
    return invitationPageProps(preview, token, invitationAccount(session));
}
