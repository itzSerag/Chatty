import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CloudinaryService } from "../../core/cloudinary";
import { WebSocketsGateway } from '../../socket/socket.provider';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageType } from '@prisma/client';

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly webSocketsProvider: WebSocketsGateway,
  ) { }

  private formatMessage<T extends { id: string }>(msg: T | null): (T & { _id: string }) | null {
    if (!msg) return null;
    return {
      ...msg,
      _id: msg.id,
    };
  }

  // Fetch only users that the current user has chatted with (WhatsApp Sidebar style)
  async findAllUserForSidebar(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
      include: {
        participants: {
          where: {
            userId: { not: userId },
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                phoneNumber: true,
                profileImg: true,
                bio: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            text: true,
            type: true,
            createdAt: true,
            senderId: true,
          },
        },
      },
    });

    // Map each conversation to its partner user for the sidebar list
    const sidebarUsers = conversations
      .map((conv) => {
        const partner = conv.participants[0]?.user;
        if (!partner) return null;
        return {
          ...partner,
          _id: partner.id,
          imgUrl: partner.profileImg ?? null,
          lastMessage: conv.messages[0]
            ? { ...conv.messages[0], _id: conv.messages[0].id }
            : null,
          lastMessageAt: conv.lastMessageAt,
          conversationId: conv.id,
        };
      })
      .filter((u): u is NonNullable<typeof u> => u !== null);

    return sidebarUsers;
  }

  // Get message history between two users
  async getMessagesHistory(userId: string, otherUserId: string) {
    // Find direct conversation between the two users
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: otherUserId } } },
        ],
      },
      select: { id: true },
    });

    if (!conversation) {
      return [];
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
    });

    return messages.map((m) => this.formatMessage(m));
  }

  // Send message using a Prisma Transaction
  async sendMessage(
    dto: CreateMessageDto,
    senderId: string,
    receiverId: string,
  ) {
    let uploadedImageUrl: string | null = null;

    if (dto.imageBase64 && dto.imageBase64.startsWith('data:image/')) {
      uploadedImageUrl = await this.cloudinaryService.uploadChatImg(
        dto.imageBase64,
        senderId,
        receiverId,
      );
    }

    const finalMediaUrl = uploadedImageUrl || dto.mediaUrl || null;
    let messageType: MessageType = MessageType.TEXT;

    if (dto.type) {
      messageType = dto.type;
    } else if (finalMediaUrl) {
      messageType = MessageType.IMAGE;
    }

    // Execute atomic transaction
    const newMessage = await this.prisma.$transaction(async (tx) => {
      // 1. Find or create 1-on-1 conversation
      let conversation = await tx.conversation.findFirst({
        where: {
          isGroup: false,
          AND: [
            { participants: { some: { userId: senderId } } },
            { participants: { some: { userId: receiverId } } },
          ],
        },
      });

      if (!conversation) {
        conversation = await tx.conversation.create({
          data: {
            isGroup: false,
            participants: {
              create: [
                { userId: senderId },
                { userId: receiverId },
              ],
            },
          },
        });
      }

      // 2. Create the message
      const created = await tx.message.create({
        data: {
          conversationId: conversation.id,
          senderId,
          receiverId,
          text: dto.text || '',
          image: finalMediaUrl,
          mediaUrl: finalMediaUrl,
          fileName: dto.fileName || null,
          fileSize: dto.fileSize || null,
          mimeType: dto.mimeType || null,
          type: messageType,
        },
      });

      // 3. Update conversation lastMessageAt
      await tx.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });

      return created;
    });

    const formattedMessage = this.formatMessage(newMessage);

    // 4. Emit real-time WebSocket event
    const receiverSocketId = this.webSocketsProvider.getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      this.webSocketsProvider.server.to(receiverSocketId).emit('newMessage', formattedMessage);
    }

    return formattedMessage;
  }
}
