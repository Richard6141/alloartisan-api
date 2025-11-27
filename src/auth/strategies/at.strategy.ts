import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { SessionService } from 'src/common/services';
import { Statut } from 'src/generated/prisma';

type JwtPayload = {
    sub: string;
    sid: string;
};

@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        config: ConfigService,
        private prisma: PrismaService,
        private sessionService: SessionService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.getOrThrow('JWT_ACCESS_SECRET'),
        });
    }

    async validate(payload: JwtPayload) {
        // Vérifier que la session existe toujours dans Redis
        if (!payload.sid) {
            throw new UnauthorizedException('Access Denied');
        }

        const sessionExists = await this.sessionService.exists(payload.sub, payload.sid);
        if (!sessionExists) {
            throw new UnauthorizedException('Session expired or revoked');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                email: true,
                role: true,
                statut: true,
            },
        });

        if (!user || user.statut === Statut.BANNI || user.statut === Statut.SUSPENDU) {
            throw new UnauthorizedException('Access Denied');
        }

        return {
            sub: user.id,
            email: user.email,
            role: user.role,
            sessionId: payload.sid,
        };
    }
}
