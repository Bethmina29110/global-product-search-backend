import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    async create(dto: any) {
        this.logger.log(`Dispatching notification to user ${dto.userId}: ${dto.title}`);
        return { message: 'Notification dispatched' };
    }

    async findAll(userId: number, paginationDto: any) {
        return {
            message: 'Notifications retrieved successfully',
            data: [],
            meta: {
                unreadCount: 0,
            },
        };
    }

    async markAsRead(id: string, userId: number) {
        return { message: 'Notification marked as read' };
    }

    async markAllAsRead(userId: number) {
        return { message: 'All notifications marked as read' };
    }

    async remove(id: string, userId: number) {
        return { message: 'Notification deleted successfully' };
    }
}