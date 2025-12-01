import { ApiProperty } from '@nestjs/swagger';

export class Tokens {
    @ApiProperty({
        description: 'JWT Access Token (expire en 15 minutes)',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    })
    access_token: string;

    @ApiProperty({
        description: 'JWT Refresh Token (expire en 7 jours)',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyfQ.refresh_token_example',
    })
    refresh_token: string;

    @ApiProperty({
        description: 'Identifiant unique de la session',
        example: 'sess_abc123def456',
    })
    session_id: string;
}

export class MfaRequiredResponse {
    @ApiProperty({
        description: 'Indique que le MFA est requis',
        example: true,
    })
    mfa_required: true;

    @ApiProperty({
        description: 'Token temporaire pour la vérification MFA',
        example: 'mfa_temp_token_xyz789',
    })
    mfa_token: string;
}

export type LoginResponse = Tokens | MfaRequiredResponse;
