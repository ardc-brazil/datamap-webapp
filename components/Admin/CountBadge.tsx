interface Props {
    count?: number
    label: string
}

export function CountBadge({ count, label }: Props) {
    if (!count) {
        return null;
    }
    return (
        <span aria-label={`${count} ${label}`} className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-primary-900 px-[7px] py-px text-[11px] font-semibold leading-4 text-primary-50">
            {count}
        </span>
    );
}
