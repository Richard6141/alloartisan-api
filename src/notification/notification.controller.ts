import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { RegisterFcmTokenDto, GetNotificationsDto } from './dto';
import { GetCurrentUser } from 'src/common/decorators';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) {}

    // ============================================================
    // TOKENS FCM
    // ============================================================

    @Post('fcm-token')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Enregistrer un token FCM pour les notifications push' })
    @ApiResponse({ status: 204, description: 'Token enregistré avec succès' })
    async registerFcmToken(
        @GetCurrentUser('sub') userId: string,
        @Body() dto: RegisterFcmTokenDto,
    ): Promise<void> {
        await this.notificationService.registerFcmToken(userId, dto.token, dto.deviceName);
    }

    @Delete('fcm-token')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Supprimer (désactiver) un token FCM' })
    @ApiResponse({ status: 204, description: 'Token supprimé avec succès' })
    async deleteFcmToken(
        @GetCurrentUser('sub') userId: string,
        @Body() dto: RegisterFcmTokenDto,
    ): Promise<void> {
        await this.notificationService.deleteFcmToken(userId, dto.token);
    }

    // ============================================================
    // NOTIFICATIONS IN-APP
    // ============================================================

    @Get()
    @ApiOperation({ summary: 'Récupérer mes notifications (paginées)' })
    @ApiResponse({ status: 200, description: 'Liste paginée des notifications' })
    async getMyNotifications(
        @GetCurrentUser('sub') userId: string,
        @Query() dto: GetNotificationsDto,
    ) {
        return this.notificationService.getMyNotifications(userId, dto);
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'Obtenir le nombre de notifications non lues' })
    @ApiResponse({ status: 200, description: 'Compteur de notifications non lues' })
    async getUnreadCount(@GetCurrentUser('sub') userId: string) {
        return this.notificationService.getUnreadCount(userId);
    }

    @Patch('read-all')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Marquer toutes les notifications comme lues' })
    @ApiResponse({ status: 200, description: 'Toutes les notifications marquées comme lues' })
    async markAllAsRead(@GetCurrentUser('sub') userId: string) {
        return this.notificationService.markAllAsRead(userId);
    }

    @Patch(':id/read')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Marquer une notification comme lue' })
    @ApiParam({ name: 'id', description: 'ID de la notification (UUID)' })
    @ApiResponse({ status: 204, description: 'Notification marquée comme lue' })
    @ApiResponse({ status: 404, description: 'Notification non trouvée' })
    async markAsRead(
        @Param('id', ParseUUIDPipe) id: string,
        @GetCurrentUser('sub') userId: string,
    ): Promise<void> {
        await this.notificationService.markAsRead(id, userId);
    }
}
