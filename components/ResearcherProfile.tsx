interface ResearcherProps {
    profile: {
        name: string
        role: string
        profilePicture?: string
        orcid?: string
    }
}

export function ResearcherProfile(props: ResearcherProps) {

    function profilePictureUrl() {
        return props.profile.profilePicture ?? "/img/researcher-profile/default-profile.webp"
    }

    const content = (
        <>
            <img
                className="w-full aspect-square object-cover rounded-md bg-primary-100 grayscale group-hover:grayscale-0 transition"
                src={profilePictureUrl()}
                alt={`${props.profile.name} - ${props.profile.role}`}
            />
            <span className="flex flex-col gap-1 pt-3">
                <span className="flex items-center gap-1.5 text-[15px] font-semibold leading-5 text-primary-900">
                    {props.profile.name}
                    {props.profile.orcid && <img src="/img/orcid-logo.svg" alt="ORCID" className="w-4 h-4" />}
                </span>
                <span className="text-[13px] leading-[18px] font-normal text-primary-500">{props.profile.role}</span>
            </span>
        </>
    );

    const className = "group flex flex-col rounded-lg border border-primary-200 bg-primary-0 p-3";

    if (props.profile.orcid) {
        return (
            <a href={`https://orcid.org/${props.profile.orcid}`} target="_blank" rel="noreferrer" className={`${className} hover:border-primary-400 hover:text-primary-900`}>
                {content}
            </a>
        );
    }

    return <div className={className}>{content}</div>;
}
