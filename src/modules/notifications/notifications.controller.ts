import { Controller, Get, Post, Body, Param, Patch, Delete, ParseIntPipe } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Post()
    async create(@Body() dto: any) {
        return this.notificationsService.create(dto);
    }

    @Get()
    async findAll(@CurrentUser() user: RequestUser) {
        return this.notificationsService.findAll(parseInt(user.id), {});
    }

    @Patch('read-all')
    async markAllAsRead(@CurrentUser() user: RequestUser) {
        return this.notificationsService.markAllAsRead(parseInt(user.id));
    }

    @Patch(':id/read')
    async markAsRead(@Param('id') id: string, @CurrentUser() user: RequestUser) {
        return this.notificationsService.markAsRead(id, parseInt(user.id));
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
        return this.notificationsService.remove(id, parseInt(user.id));
    }
}