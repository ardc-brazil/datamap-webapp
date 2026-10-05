import Link from "next/link";
import { Logo } from "../../../components/Brand/Logo";
import AvatarButton from "../../../components/Profile/AvatarButton";
import { TenancySelector } from "../../../components/Tenancy/TenancySelector";

export default function TenancySelectorPage() {
    return (
        <div className="absolute min-h-screen w-full top-0 z-50 left-0 bg-primary-50 flex flex-col overflow-y-auto">
            <header className="flex flex-none items-center justify-between h-16 px-4 md:px-8 border-b border-primary-200">
                <Link href="/" className="flex items-center">
                    <Logo />
                </Link>
                <AvatarButton />
            </header>
            <div className="flex justify-center w-full px-4 pt-16 pb-24">
                <div className="w-full max-w-[520px]">
                    <TenancySelector />
                </div>
            </div>
        </div>
    );
}

TenancySelectorPage.auth = {
    role: "admin",
    loading: <div>Tenancy selection loading...</div>,
};
