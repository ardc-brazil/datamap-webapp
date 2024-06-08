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

    function ResearcherContainer() {
        return (
            <div className="flex flex-col w-fit items-center">
                <div id="tooltip-jese" role="tooltip" className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
                    {props.profile.name}
                </div>
                <img className="rounded w-52 h-52" src={profilePictureUrl()} alt={`${props.profile.name} - ${props.profile.role}`} />
                <h5 className="text-center">{props.profile.name}{props.profile.orcid &&
                    <img src="/img/orcid-logo.svg" className="w-4 inline-block ml-2" />
                }</h5>
                <span className="font-light">{props.profile.role}</span>
            </div>
        )
    }

    return <>
        {!props.profile.orcid && <ResearcherContainer />}
        {props.profile.orcid &&
            <a href={`https://orcid.org/${props.profile.orcid}`} target="_blank">
                <ResearcherContainer />
            </a>}
    </>
}