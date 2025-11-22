import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService) {}

    login() {
        return 'Hola Mundo';
    }

    async register(dto: AuthDto) {
        const hash = await argon.hash(dto.password);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hash,
            },
        });
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    logout() {
        return 'Hola Mundo';
    }
}
