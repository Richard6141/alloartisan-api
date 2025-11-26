import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { Tokens } from './types';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OtpService } from 'src/common/services';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private config: ConfigService,
        private otpService: OtpService,
    ) {}

    async register(dto: AuthDto): Promise<Tokens> {
        //Générer le mot de passe haché
        const hash = await argon.hash(dto.password);
        //Sauvegarder l'utilisateur dans la base de données avec la gestion des erreurs
        try {
            const user = await this.prisma.user.create({
                data: {
                    email: dto.email,
                    passwordHash: hash,
                },
            });
            //const { passwordHash: _, ...userWithoutpasswordHash } = user;
            //return userWithoutpasswordHash;
            const tokens = await this.getTokens(user.id, user.email, user.role);
            await this.updateRtHash(user.id, tokens.refresh_token);
            return tokens;
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ForbiddenException('Email already exists');
                }
            }
            throw error;
        }
    }

    async login(dto: AuthDto): Promise<Tokens> {
        // Trouver l'utilisateur par email
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email,
            },
        });
        // Si non trouvé en renvoie erreur
        if (!user) {
            throw new ForbiddenException('Email or password incorrect');
        }
        // Si trouvé, on compare mot de passe
        const passwordMatch = await argon.verify(user.passwordHash, dto.password);
        //Si mot de passe incorrect, on renvoit erreur
        if (!passwordMatch) {
            throw new ForbiddenException('Email or password incorrect');
        }
        // Si trouvé, on renvoit, l'utilisateur
        const tokens = await this.getTokens(user.id, user.email, user.role);
        await this.updateRtHash(user.id, tokens.refresh_token);
        return tokens;
    }

    async logout(userId: string) {
        await this.prisma.user.updateMany({
            where: {
                id: userId,
                hasheRt: {
                    not: null,
                },
            },
            data: {
                hasheRt: null,
            },
        });
    }

    async refreshTokens(userId: string, rt: string) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId,
            },
        });
        if (!user || !user.hasheRt) {
            throw new ForbiddenException('Access Denied');
        }
        const rtMatches = await argon.verify(user.hasheRt, rt);
        if (!rtMatches) {
            throw new ForbiddenException('Access Denied');
        }
        const tokens = await this.getTokens(user.id, user.email, user.role);
        await this.updateRtHash(user.id, tokens.refresh_token);
        return tokens;
    }

    async getTokens(userId: string, email: string, role: string): Promise<Tokens> {
        const [at, rt] = await Promise.all([
            this.jwtService.signAsync(
                {
                    sub: userId,
                    email,
                    role,
                },
                {
                    secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
                    expiresIn: 60 * 15,
                },
            ),
            this.jwtService.signAsync(
                {
                    sub: userId,
                    email,
                    role,
                },
                {
                    secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
                    expiresIn: 60 * 60 * 24 * 7,
                },
            ),
        ]);
        return {
            access_token: at,
            refresh_token: rt,
        };
    }
    async updateRtHash(userId: string, rt: string): Promise<void> {
        const hash = await argon.hash(rt);
        await this.prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                hasheRt: hash,
            },
        });
    }
}
