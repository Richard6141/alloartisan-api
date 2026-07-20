import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { RoleAdmin } from 'src/generated/prisma';

export class GrantAdminDto {
    @ApiProperty({ description: "ID de l'utilisateur à promouvoir administrateur" })
    @IsUUID()
    userId!: string;

    @ApiProperty({ enum: RoleAdmin, description: 'Rôle admin à attribuer' })
    @IsEnum(RoleAdmin)
    adminRole!: RoleAdmin;
}

export class ChangeAdminRoleDto {
    @ApiProperty({ enum: RoleAdmin, description: 'Nouveau rôle admin' })
    @IsEnum(RoleAdmin)
    adminRole!: RoleAdmin;
}
