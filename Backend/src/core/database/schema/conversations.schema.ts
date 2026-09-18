import { pgTable, uuid, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    isGroup: boolean('is_group').default(false).notNull(),
    name: text('name'),
    lastMessageAt: timestamp('last_message_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index('idx_conversations_last_message_at').on(table.lastMessageAt),
  ]
);

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
