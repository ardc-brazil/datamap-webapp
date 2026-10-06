export function DialogError({ message, id }: { message?: string | null; id?: string }) {
    return message ? <p id={id} role="alert" className="m-0 text-sm text-danger-700">{message}</p> : null;
}
