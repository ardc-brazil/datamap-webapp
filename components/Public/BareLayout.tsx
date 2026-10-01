import Head from "next/head";
import Link from "next/link";
import { ReactNode } from "react";
import { Logo } from "../Brand/Logo";

interface Props {
    right?: ReactNode
    children: ReactNode
}

export function BareLayout(props: Props) {
    return (
        <div className="min-h-screen bg-primary-50">
            <Head>
                <title>DataMap</title>
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <header className="h-16 px-4 md:px-8 flex items-center justify-between border-b border-primary-200">
                <Link href="/" className="flex items-center"><Logo size="md" /></Link>
                {props.right}
            </header>
            <main>{props.children}</main>
        </div>
    );
}
