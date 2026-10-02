import Link from "next/link";
import { MaterialSymbol } from "react-material-symbols";
import { formatEmbargoDate } from "../../lib/embargoDates";

interface Props {
    until: string
    doi: string | null
}

export function EmbargoNotice(props: Props) {
    return (
        <div role="status" className="mx-auto max-w-[560px] px-4 md:px-8 pt-24 pb-28 flex flex-col items-center gap-4 text-center">
            <span aria-hidden="true" className="flex items-center justify-center h-14 w-14 rounded-full bg-embargo-100 text-embargo-800">
                <MaterialSymbol icon="lock" size={28} grade={-25} weight={400} fill />
            </span>
            <h1 className="m-0 mt-2 text-[28px] leading-[1.2] font-semibold tracking-[-0.02em] text-primary-900">This dataset is under embargo</h1>
            <p className="m-0 max-w-[440px] text-base leading-[25px] text-primary-700 [text-wrap:pretty]">
                It will become available on DataMap on <strong className="font-semibold text-primary-900">{formatEmbargoDate(props.until)}</strong>.
                {" "}The identifier below is reserved and will lead to the dataset once it is published.
            </p>
            {props.doi && <span className="mt-2 font-mono text-[13px] text-primary-500">doi:{props.doi}</span>}
            <span className="mt-6 text-[13px] text-primary-400">
                DataMap is a data platform for atmospheric big data and data science research in Brazil.{" "}
                <Link href="/project/about" className="font-medium text-primary-600 hover:text-primary-900">Learn more</Link>
            </span>
        </div>
    );
}
