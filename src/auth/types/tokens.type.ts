export type Tokens = {
    access_token: string;
    refresh_token: string;
    session_id: string;
};

export type LoginResponse = Tokens | { mfa_required: true; mfa_token: string };
