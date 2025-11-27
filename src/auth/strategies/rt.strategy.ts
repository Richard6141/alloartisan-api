import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SessionService } from 'src/common/services';

type JwtPayload = {
    sub: string;
    sid: string;
};

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(
        config: ConfigService,
        private sessionService: SessionService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.getOrThrow('JWT_REFRESH_SECRET'),
            passReqToCallback: true,
        });
    }

    async validate(req: Request, payload: JwtPayload) {
        const refreshToken = req.get('authorization')?.replace('Bearer', '').trim();

        if (!payload.sid) {
            throw new ForbiddenException('Access Denied');
        }

        // Vérifier que la session existe dans Redis
        const sessionExists = await this.sessionService.exists(payload.sub, payload.sid);
        if (!sessionExists) {
            throw new ForbiddenException('Access Denied');
        }

        return {
            sub: payload.sub,
            sessionId: payload.sid,
            refreshToken,
        };
    }
}
