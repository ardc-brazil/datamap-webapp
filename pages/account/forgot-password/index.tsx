import { ForgotPasswordForm } from "../../../components/Account/ForgotPasswordForm";
import { BareLayout } from "../../../components/Public/BareLayout";

export default function ForgotPasswordPage() {
    return (
        <BareLayout>
            <div className="mx-auto w-full max-w-[560px] px-4 md:px-8 pt-20 pb-24">
                <ForgotPasswordForm />
            </div>
        </BareLayout>
    );
}
