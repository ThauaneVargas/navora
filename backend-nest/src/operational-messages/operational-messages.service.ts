import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OperationalMessage } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateOperationalMessageDto } from './dto/create-operational-message.dto';

@Injectable()
export class OperationalMessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const messages = await this.prisma.operationalMessage.findMany({ orderBy: { createdAt: 'desc' } });
    return messages.map(this.toApi);
  }

  async create(payload: CreateOperationalMessageDto) {
    const recipient = payload.recipient || payload.to;
    const content = payload.content || payload.message;

    if (!recipient?.trim() || !content?.trim()) {
      throw new BadRequestException('Destinatario e mensagem sao obrigatorios');
    }

    const message = await this.prisma.operationalMessage.create({
      data: {
        recipient: recipient.trim(),
        content: content.trim(),
        priority: payload.priority?.trim() || 'Media',
        direction: 'Enviada',
      },
    });
    return this.toApi(message);
  }

  async markRead(messageId: number) {
    await this.find(messageId);
    const message = await this.prisma.operationalMessage.update({
      where: { id: messageId },
      data: { readAt: new Date() },
    });
    return this.toApi(message);
  }

  private async find(messageId: number) {
    const message = await this.prisma.operationalMessage.findUnique({ where: { id: messageId } });
    if (!message) {
      throw new NotFoundException('Mensagem nao encontrada');
    }
    return message;
  }

  private toApi(message: OperationalMessage) {
    return {
      id: message.id,
      to: message.recipient,
      recipient: message.recipient,
      message: message.content,
      content: message.content,
      priority: message.priority,
      direction: message.direction,
      read_at: message.readAt?.toISOString() ?? null,
      created_at: message.createdAt.toISOString(),
      updated_at: message.updatedAt.toISOString(),
    };
  }
}
