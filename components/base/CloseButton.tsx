export default function CloseButton(props) {
    return <button
        className="rounded-full h-6 w-6 bg-primary-200 hover:bg-primary-300 text-primary-700 hover:text-primary-900 text-sm font-bold"
        type="button"
        onClick={props.onClick}
    >
        x
    </button>;
}