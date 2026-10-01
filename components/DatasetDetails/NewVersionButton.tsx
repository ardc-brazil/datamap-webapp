import React from 'react'
import { MaterialSymbol } from "react-material-symbols";

interface NewVersionButtonProps {
    onClick();
}

export default function NewVersionButton(props: NewVersionButtonProps) {
    return (
        <button type="button"
            className="w-fit inline-flex items-center gap-1.5 h-8 pl-2.5 pr-3 rounded-md border border-primary-300 bg-primary-0 text-[13px] font-semibold text-primary-900 whitespace-nowrap hover:bg-primary-100 transition-colors"
            onClick={props.onClick}
        >
            <MaterialSymbol
                icon="add"
                size={18}
                grade={-25}
                weight={400} />
            <span>New version</span>
        </button>
    );
}
