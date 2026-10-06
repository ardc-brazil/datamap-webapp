export function ConsequenceList({ items }: { items: string[] }) {
    return (
        <ul className="m-0 p-0 list-none flex flex-col gap-2.5 text-sm leading-[21px] text-primary-700">
            {items.map((item) => (
                <li key={item} className="flex gap-2.5"><span className="text-primary-400">—</span><span>{item}</span></li>
            ))}
        </ul>
    );
}
