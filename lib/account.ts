import axiosInstance from "./rpc";

export async function signUp(input: { name: string; email: string; password: string }): Promise<{ challengeId: string }> {
    const response = await axiosInstance.post("/auth/sign-up", { name: input.name, email: input.email, password: input.password });
    return { challengeId: response.data.challenge_id };
}

export async function confirmSignUp(challengeId: string, code: string): Promise<{ userId: string }> {
    const response = await axiosInstance.post(`/auth/sign-up/${encodeURIComponent(challengeId)}/confirm`, { code });
    return { userId: response.data.user_id };
}

export async function resendChallenge(challengeId: string): Promise<void> {
    await axiosInstance.post(`/auth/challenges/${encodeURIComponent(challengeId)}/resend`);
}

export async function login(email: string, password: string): Promise<{ userId: string }> {
    const response = await axiosInstance.post("/auth/login", { email, password });
    return { userId: response.data.user_id };
}

export async function requestPasswordReset(email: string): Promise<void> {
    await axiosInstance.post("/auth/password-reset", { email });
}

export async function confirmPasswordReset(token: string, password: string): Promise<void> {
    await axiosInstance.post("/auth/password-reset/confirm", { token, password });
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    await axiosInstance.put(
        `/users/${encodeURIComponent(userId)}/password`,
        { current_password: currentPassword, new_password: newPassword },
        { headers: { "X-User-Id": userId } },
    );
}

export async function requestEmailVerification(input: { orcid: string; email: string; name: string }): Promise<{ challengeId: string }> {
    const response = await axiosInstance.post("/auth/email-verifications", {
        orcid: input.orcid,
        email: input.email,
        name: input.name,
    });
    return { challengeId: response.data.challenge_id };
}

export async function confirmEmailVerification(challengeId: string, code: string): Promise<{ userId: string }> {
    const response = await axiosInstance.post(`/auth/email-verifications/${encodeURIComponent(challengeId)}/confirm`, { code });
    return { userId: response.data.user_id };
}
