import { Injectable, NotFoundException } from '@nestjs/common';
import { Notification, NotificationCategory } from '@prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { PrismaService } from '../database/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthenticatedUser) {
    const items = await this.prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return items.map((n) => this.toResponse(n));
  }

  async markRead(user: AuthenticatedUser, id: number) {
    const existing = await this.prisma.notification.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) throw new NotFoundException('Notificacao nao encontrada');
    await this.prisma.notification.update({ where: { id }, data: { read: true } });
    return { ok: true };
  }

  async markAllRead(user: AuthenticatedUser) {
    await this.prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
    return { ok: true };
  }

  async remove(user: AuthenticatedUser, id: number) {
    const existing = await this.prisma.notification.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) throw new NotFoundException('Notificacao nao encontrada');
    await this.prisma.notification.delete({ where: { id } });
    return { ok: true };
  }

  async create(userId: number, dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        category: dto.category,
        icon: dto.icon,
        title: dto.title,
        description: dto.description,
      },
    });
    return this.toResponse(notification);
  }

  private toResponse(n: Notification) {
    const categoryMap: Record<NotificationCategory, string> = {
      NAVIGATION: 'Navegacao',
      ACCESS: 'Acesso',
      HELP_SOS: 'Ajuda-SOS',
    };
    return {
      id: n.id,
      category: categoryMap[n.category],
      icon: n.icon,
      title: n.title,
      description: n.description,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    };
  }
}
