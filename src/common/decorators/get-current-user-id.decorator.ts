import { createParamDecorator, ExecutionContext } from '@nestjs/common';

type RequestWithUser = {
    user: {
        sub: string;
        email: string;
        role: string;
    };
};

export const GetCurrentUserId = createParamDecorator(
    (data: undefined, context: ExecutionContext): string => {
        const request = context.switchToHttp().getRequest<RequestWithUser>();
        return request.user.sub;
    },
);
