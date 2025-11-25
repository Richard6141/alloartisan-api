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

    async login(dto: AuthDto) {
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
        const { passwordHash: _, ...userWithoutpasswordHash } = user;
        return userWithoutpasswordHash;
        return 'Hola Mundo';
    }

    logout() {
        return 'Hola Mundo';
    }
}
