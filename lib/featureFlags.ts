

const engUserIds = [

    // André Maia
    "afb36eb1-0018-4917-a115-350b5afd23e6",
    "cbb0a683-630f-4b86-8b45-91b90a6fce1c",
    "252e740f-02a5-4733-a592-b48bfdb4f6e7",
    "64cd8613-a728-474b-b6c9-e366498edf53",

    // Caio Maia
    "e298c0ec-9ff2-4b35-9f8c-ea728a407a02",
];

const additionalUsers = [
    // Aline Nascimento 
    "39979429-1080-4eee-9a7d-3b6ced8ec252",
    // Helvecio Bezerra Leal Neto
    "4121ac26-f638-48e2-a433-624c89214bab",
    // Alan James Peixoto Calheiros
    "e92c32a7-78c6-415e-9411-fe0765d1fcae",
]

/**
 * Is the feature Uppy upload enabled for user?
 * @param session NextAuth Session.
 * @returns True if the feature is enabled. Otherwise false.
 */
export function isUppyUploadEnabled(session): boolean {
    return engUserIds.indexOf(session?.user?.uid) >= 0;
}

/**
 * Is the feature DOI status upate enabled for user?
 * @param session NextAuth Session.
 * @returns True if the feature is enabled. Otherwise false.
 */
export function isDOIUpdateStatusEnabled(session): boolean {
    return engUserIds.indexOf(session?.user?.uid) >= 0 || additionalUsers.indexOf(session?.user?.uid) >= 0;
}
