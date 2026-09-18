import { Inject, Injectable } from '@nestjs/common';
import { CloudinaryService } from '../../core/cloudinary';
import { WebSocketsGateway } from '../../socket/socket.provider';
import { CreateMessageDto } from './dto/create-message.dto';
import { DRIZZLE, DrizzleDB } from '../../core/database/drizzle.provider';
import {
  conversations,
  conversationParticipants,
  messages,
  MessageType,
} from '../../core/database/schema';
import { eq, and, desc, asc, sql } from 'drizzle-orm';

@Injectable()
export class MessageService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: DrizzleDB,
    private readonly cloudinaryService: CloudinaryService,
    private readonly webSocketsProvider: WebSocketsGateway,
  ) {}

  private formatMessage<T extends { id: string }>(
    msg: T | null | undefined,
  ): (T & { _id: string }) | null {
    if (!msg) return null;
    return {
      ...msg,
      _id: msg.id,
    };
  }

  // Fetch only users that the current user has chatted with (WhatsApp Sidebar style)
  async findAllUserForSidebar(userId: string) {
    const userConversations = await this.db.query.conversations.findMany({
      where: sql`EXISTS (
        SELECT 1 FROM ${conversationParticipants} 
        WHERE ${conversationParticipants.conversationId} = ${conversations.id} 
        AND ${conversationParticipants.userId} = ${userId}
      )`,
      orderBy: [desc(conversations.lastMessageAt)],
      with: {
        participants: {
          where: (participants, { ne }) => ne(participants.userId, userId),
          with: {
            user: {
              columns: {
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
          limit: 1,
          orderBy: [desc(messages.createdAt)],
          columns: {
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
    const sidebarUsers = userConversations
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
    const conversation = await this.db.query.conversations.findFirst({
      where: and(
        eq(conversations.isGroup, false),
        sql`EXISTS (SELECT 1 FROM ${conversationParticipants} WHERE ${conversationParticipants.conversationId} = ${conversations.id} AND ${conversationParticipants.userId} = ${userId})`,
        sql`EXISTS (SELECT 1 FROM ${conversationParticipants} WHERE ${conversationParticipants.conversationId} = ${conversations.id} AND ${conversationParticipants.userId} = ${otherUserId})`,
      ),
      columns: { id: true },
    });

    if (!conversation) {
      return [];
    }

    const chatMessages = await this.db.query.messages.findMany({
      where: eq(messages.conversationId, conversation.id),
      orderBy: [asc(messages.createdAt)],
    });

    return chatMessages.map((m) => this.formatMessage(m));
  }

  // Send message using an atomic database transaction
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
    const newMessage = await this.db.transaction(async (tx) => {
      // 1. Find or create 1-on-1 conversation
      let conversation = await tx.query.conversations.findFirst({
        where: and(
          eq(conversations.isGroup, false),
          sql`EXISTS (SELECT 1 FROM ${conversationParticipants} WHERE ${conversationParticipants.conversationId} = ${conversations.id} AND ${conversationParticipants.userId} = ${senderId})`,
          sql`EXISTS (SELECT 1 FROM ${conversationParticipants} WHERE ${conversationParticipants.conversationId} = ${conversations.id} AND ${conversationParticipants.userId} = ${receiverId})`,
        ),
        columns: { id: true },
      });

      let conversationId = conversation?.id;

      if (!conversationId) {
        const [createdConv] = await tx
          .insert(conversations)
          .values({ isGroup: false })
          .returning();
        conversationId = createdConv.id;

        await tx.insert(conversationParticipants).values([
          { userId: senderId, conversationId },
          { userId: receiverId, conversationId },
        ]);
      }

      // 2. Create the message
      const [created] = await tx
        .insert(messages)
        .values({
          conversationId,
          senderId,
          receiverId,
          text: dto.text || '',
          image: finalMediaUrl,
          mediaUrl: finalMediaUrl,
          fileName: dto.fileName || null,
          fileSize: dto.fileSize || null,
          mimeType: dto.mimeType || null,
          type: messageType,
        })
        .returning();

      // 3. Update conversation lastMessageAt
      await tx
        .update(conversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversations.id, conversationId));

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
