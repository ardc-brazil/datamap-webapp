import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import remarkGfm from "remark-gfm";
import { AnonymousBanner } from "../../components/Anonymous/AnonymousBanner";
import { AnonymousFilesCard } from "../../components/Anonymous/AnonymousFilesCard";
import { AnonymousMetadataList } from "../../components/Anonymous/AnonymousMetadataList";
import { BareLayout } from "../../components/Public/BareLayout";
import { REDACTED } from "../../contants/EmbargoConstants";
import { authorCount, latestVersion } from "../../lib/anonymousMetadata";
import { anonymousPageProps } from "../../lib/anonymousPage";
import { bytesToSize } from "../../lib/file";
import { rethrowSafely } from "../../lib/logging";
import { getAnonymousPage } from "../../lib/share";
import { AnonymousPageActive, AnonymousPageEnded } from "../../types/GatekeeperAPI";

interface Props {
    page: AnonymousPageActive | AnonymousPageEnded
}

export default function AnonymousPage(props: Props) {
    const dataset = props.page.dataset;
    const version = latestVersion(dataset.versions);
    const authors = authorCount(dataset.data);
    const description = String(dataset.data.description ?? "");

    return (
        <BareLayout right={<span className="text-xs font-semibold uppercase tracking-[0.08em] text-primary-500">Anonymous view</span>}>
            <AnonymousBanner page={props.page} />
            <div className="mx-auto w-full max-w-[720px] px-4 md:px-8 pt-8 pb-24 flex flex-col gap-7">
                <div className="flex flex-col gap-2.5">
                    {version &&
                        <span className="font-mono text-xs text-primary-500">
                            v{version.name} · {version.files_summary.count} files · {bytesToSize(version.files_summary.total_size_bytes)}
                        </span>
                    }
                    <h1 className="m-0 text-[26px] leading-[1.2] font-semibold tracking-[-0.02em] text-primary-900 [text-wrap:balance]">{dataset.name}</h1>
                    {authors > 0 &&
                        <div className="flex gap-1.5 items-center text-sm text-primary-600">
                            <span className="inline-flex px-2 py-px rounded bg-primary-200 font-mono text-xs text-primary-700">{REDACTED}</span>
                            · {authors} {authors === 1 ? "author" : "authors"}
                        </div>
                    }
                </div>

                {description &&
                    <section className="flex flex-col gap-2.5">
                        <h2 className="m-0 text-base font-semibold text-primary-900">About</h2>
                        <article className="prose max-w-none text-[15px] leading-6 text-primary-700">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{description}</ReactMarkdown>
                        </article>
                    </section>
                }

                <section className="flex flex-col gap-2.5">
                    <h2 className="m-0 text-base font-semibold text-primary-900">Files</h2>
                    <AnonymousFilesCard version={version} />
                </section>

                <section className="flex flex-col gap-2.5">
                    <h2 className="m-0 text-base font-semibold text-primary-900">Metadata</h2>
                    <AnonymousMetadataList data={dataset.data} />
                </section>
            </div>
        </BareLayout>
    );
}

export async function getServerSideProps({ query }) {
    try {
        return anonymousPageProps(await getAnonymousPage(query.token as string));
    } catch (error) {
        if (error?.response?.status === 404) {
            return { notFound: true };
        }
        rethrowSafely("anonymous page failed", error);
    }
}
