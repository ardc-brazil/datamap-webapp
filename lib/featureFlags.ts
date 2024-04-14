
/**
 * Is the feature Uppy upload enabled for user?
 * @param session NextAuth Session.
 * @returns True if the feature is enabled. Otherwise false.
 */
export function isUppyUploadEnabled(session): boolean {

    const usersEnabled = [
        // André Maia
        "cbb0a683-630f-4b86-8b45-91b90a6fce1c",
        "252e740f-02a5-4733-a592-b48bfdb4f6e7",
        "64cd8613-a728-474b-b6c9-e366498edf53",

        // Caio
        "e298c0ec-9ff2-4b35-9f8c-ea728a407a02",
    ];

    return usersEnabled.indexOf(session?.user?.uid) >= 0;
}