import React from 'react'
import { MaterialSymbol } from "react-material-symbols";

interface NewVersionButtonProps {
    onClick();
}

export default function NewVersionButton(props: NewVersionButtonProps) {
    return (
        <button type="button"
            className="w-fit btn btn-primary-outline btn-small whitespace-nowrap rounded-3xl border-0"
            onClick={props.onClick}
        >
            <div className="flex flex-row justify-center items-center">
                <MaterialSymbol
                    className="pr-2"
                    icon="add"
                    size={16}
                    grade={-25}
                    weight={400} />
                <span>New Version</span>
            </div>
        </button>
    );
}
