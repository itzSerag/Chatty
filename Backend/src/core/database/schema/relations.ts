import { relations } from 'drizzle-orm';
import { users } from './users.schema';
import { conversations } from './conversations.schema';
import { conversationParticipants } from './conversation-participants.schema';
import { messages } from './messages.schema';

export const usersRelations = relations(users, ({ many }) => ({
  participants: many(conversationParticipants),
  sentMessages: many(messages),
}));

export const conversationsRelations = relations(conversations, ({ many }) => ({
  participants: many(conversationParticipants),
  messages: many(messages),
}));

export const conversationParticipantsRelations = relations(conversationParticipants, ({ one }) => ({
  user: one(users, {
    fields: [conversationParticipants.userId],
    references: [users.id],
  }),
  conversation: one(conversations, {
    fields: [conversationParticipants.conversationId],
    references: [conversations.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));
