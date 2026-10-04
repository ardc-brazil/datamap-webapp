import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { ConfirmEmailForm } from "../../components/Account/ConfirmEmailForm";
import { BareLayout } from "../../components/Public/BareLayout";
import { safeCallbackUrl } from "../../lib/authRoutes";

const COLUMN = "mx-auto w-full max-w-[560px] px-4 md:px-8 pt-20 pb-24";

export default function ConfirmEmailPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const rawCallbackUrl = router.query.callbackUrl;

    return (
        <BareLayout>
            <div className={COLUMN}>
                <ConfirmEmailForm
                    emailHint={session?.user?.emailHint}
                    callbackUrl={safeCallbackUrl(typeof rawCallbackUrl === "string" ? rawCallbackUrl : undefined)}
                />
            </div>
        </BareLayout>
    );
}

ConfirmEmailPage.auth = {
    role: "pending",
    loading: <BareLayout><div className={COLUMN} /></BareLayout>,
};
