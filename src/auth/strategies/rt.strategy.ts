import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { Injectable } from '@nestjs/common';

type JwtPayload = {
    sub: string;
    email: string;
    role: string;
};

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: 'rt-secret',
            passReqToCallback: true,
        });
    }
    validate(req: Request, payload: JwtPayload) {
        const refreshToken = req.get('authorization')?.replace('Bearer', '').trim();
        return {
            ...payload,
            refreshToken,
        };
    }
}
