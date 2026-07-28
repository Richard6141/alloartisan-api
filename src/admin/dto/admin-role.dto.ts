import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class GrantAdminDto {
    @ApiProperty({ description: "ID de l'utilisateur à promouvoir administrateur" })
    @IsUUID()
    userId!: string;

    @ApiProperty({ description: "ID du rôle admin (AdminRoleDef) à attribuer" })
    @IsUUID()
    roleId!: string;
}
