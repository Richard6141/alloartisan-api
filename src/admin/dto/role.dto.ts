import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateRoleDto {
    @ApiProperty()
    @IsString()
    @Length(2, 60)
    name!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(0, 255)
    description?: string;

    @ApiProperty({ type: [String] })
    @IsArray()
    @ArrayUnique()
    @IsString({ each: true })
    permissions!: string[];

    @ApiPropertyOptional({ description: 'Cloner depuis ce rôle' })
    @IsOptional()
    @IsUUID()
    fromRoleId?: string;
}

export class UpdateRoleDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(2, 60)
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(0, 255)
    description?: string;

    @ApiPropertyOptional({ type: [String] })
    @IsOptional()
    @IsArray()
    @ArrayUnique()
    @IsString({ each: true })
    permissions?: string[];
}

export class AssignRoleDto {
    @ApiProperty()
    @IsUUID()
    roleId!: string;
}

export class SetOverridesDto {
    @ApiProperty({ type: [String] })
    @IsArray()
    @ArrayUnique()
    @IsString({ each: true })
    granted!: string[];

    @ApiProperty({ type: [String] })
    @IsArray()
    @ArrayUnique()
    @IsString({ each: true })
    revoked!: string[];
}
