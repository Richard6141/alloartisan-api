import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService) { }

    async register(dto: AuthDto) {
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
            const { passwordHash: _, ...userWithoutpasswordHash } = user;
            return userWithoutpasswordHash;
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ForbiddenException('Email already exists');
                }
            }
            throw error;
        }
    }

    login() {
        return 'Hola Mundo';
    }

    logout() {
        return 'Hola Mundo';
    }
}
