import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdminPermGuard, RequirePerm } from './rbac.guard';
import { RolesService } from './roles.service';
import { GetCurrentUser, Roles } from 'src/common/decorators';
import { AtGuard, RolesGuard } from 'src/common/guards';
import { Role } from 'src/generated/prisma';
import { AssignRoleDto, CreateRoleDto, SetOverridesDto, UpdateRoleDto } from './dto/role.dto';

/**
 * RolesController — CRUD des rôles admin + assignation + surcharges de permissions.
 * Préfixe : /api/v1/admin — protégé par la même pile de gardes qu'AdminController.
 */
@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AtGuard, RolesGuard, AdminPermGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class RolesController {
    constructor(private readonly roles: RolesService) {}

    @RequirePerm('admins.view')
    @Get('permissions')
    getPermissions() {
        return this.roles.getCatalog();
    }

    @RequirePerm('admins.view')
    @Get('roles')
    listRoles() {
        return this.roles.listRoles();
    }

    @RequirePerm('admins.manage')
    @Post('roles')
    createRole(@Body() dto: CreateRoleDto, @GetCurrentUser('sub') actorId: string) {
        return this.roles.createRole(dto, actorId);
    }

    @RequirePerm('admins.manage')
    @Patch('roles/:id')
    updateRole(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateRoleDto,
        @GetCurrentUser('sub') actorId: string,
    ) {
        return this.roles.updateRole(id, dto, actorId);
    }

    @RequirePerm('admins.manage')
    @Delete('roles/:id')
    deleteRole(@Param('id', ParseUUIDPipe) id: string, @GetCurrentUser('sub') actorId: string) {
        return this.roles.deleteRole(id, actorId);
    }

    @RequirePerm('admins.manage')
    @Patch('admins/:id/role')
    assignRole(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: AssignRoleDto,
        @GetCurrentUser('sub') actorId: string,
    ) {
        return this.roles.assignRole(id, dto.roleId, actorId);
    }

    @RequirePerm('admins.manage')
    @Patch('admins/:id/overrides')
    setOverrides(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: SetOverridesDto,
        @GetCurrentUser('sub') actorId: string,
    ) {
        return this.roles.setOverrides(id, dto, actorId);
    }
}
