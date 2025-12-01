import { createParamDecorator, ExecutionContext } from '@nestjs/common';

type JwtPayloadWithRt = {
    sub: string;
    email: string;
    role: string;
    sessionId?: string;
    refreshToken?: string;
};

type RequestWithUser = {
    user: JwtPayloadWithRt;
};

export const GetCurrentUser = createParamDecorator(
    (
        data: keyof JwtPayloadWithRt | undefined,
        context: ExecutionContext,
    ): JwtPayloadWithRt | string | undefined => {
        const request = context.switchToHttp().getRequest<RequestWithUser>();
        if (data) {
            return request.user[data];
        }
        return request.user;
    },
);
