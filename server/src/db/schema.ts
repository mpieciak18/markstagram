import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
  text,
} from 'drizzle-orm/pg-core';

export const users = pgTable(
  'User',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull(),
    email: varchar('email', { length: 254 }).notNull(),
    username: varchar('username', { length: 15 }).notNull(),
    password: varchar('password', { length: 60 }).notNull(),
    name: varchar('name', { length: 30 }).notNull(),
    bio: varchar('bio', { length: 160 }),
    image: text('image'),
  },
  (table) => [
    uniqueIndex('User_email_key').on(table.email),
    uniqueIndex('User_username_key').on(table.username),
    check('User_email_not_blank_chk', sql`char_length(btrim(${table.email})) >= 3`),
    check(
      'User_username_len_chk',
      sql`char_length(btrim(${table.username})) BETWEEN 3 AND 15`,
    ),
    check('User_name_len_chk', sql`char_length(btrim(${table.name})) BETWEEN 3 AND 30`),
    check(
      'User_password_bcrypt_chk',
      sql`${table.password} ~ '^\\$2[aby]\\$[0-9]{2}\\$[./A-Za-z0-9]{53}$'`,
    ),
  ],
);

export const follows = pgTable(
  'Follow',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull(),
    giverId: integer('giverId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    receiverId: integer('receiverId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (table) => [
    uniqueIndex('Follow_giverId_receiverId_key').on(table.giverId, table.receiverId),
    check('Follow_no_self_chk', sql`${table.giverId} <> ${table.receiverId}`),
  ],
);

export const posts = pgTable(
  'Post',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull(),
    image: text('image').notNull(),
    caption: varchar('caption', { length: 2200 }).notNull(),
    userId: integer('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (table) => [
    uniqueIndex('Post_image_key').on(table.image),
    check(
      'Post_caption_len_chk',
      sql`char_length(btrim(${table.caption})) BETWEEN 1 AND 2200`,
    ),
  ],
);

export const comments = pgTable(
  'Comment',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull(),
    message: varchar('message', { length: 2200 }).notNull(),
    userId: integer('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    postId: integer('postId')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (table) => [
    check(
      'Comment_message_len_chk',
      sql`char_length(btrim(${table.message})) BETWEEN 1 AND 2200`,
    ),
  ],
);

export const likes = pgTable(
  'Like',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull(),
    userId: integer('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    postId: integer('postId')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (table) => [uniqueIndex('Like_userId_postId_key').on(table.userId, table.postId)],
);

export const saves = pgTable(
  'Save',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull(),
    userId: integer('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    postId: integer('postId')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (table) => [uniqueIndex('Save_userId_postId_key').on(table.userId, table.postId)],
);

export const conversations = pgTable('Conversation', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('createdAt', { precision: 3, mode: 'date' }).defaultNow().notNull(),
});

export const conversationsToUsers = pgTable(
  '_ConversationToUser',
  {
    conversationId: integer('A')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    userId: integer('B')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (table) => [
    uniqueIndex('_ConversationToUser_AB_unique').on(table.conversationId, table.userId),
    index('_ConversationToUser_B_index').on(table.userId),
  ],
);

export const messages = pgTable(
  'Message',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull(),
    message: varchar('message', { length: 2000 }).notNull(),
    senderId: integer('senderId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    conversationId: integer('conversationId')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (table) => [
    check(
      'Message_message_len_chk',
      sql`char_length(btrim(${table.message})) BETWEEN 1 AND 2000`,
    ),
  ],
);

export const notifications = pgTable(
  'Notification',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'date' })
      .defaultNow()
      .notNull(),
    userId: integer('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    otherUserId: integer('otherUserId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    postId: integer('postId'),
    type: varchar('type', { length: 30 }).notNull(),
    read: boolean('read').notNull(),
  },
  (table) => [
    check('Notification_type_len_chk', sql`char_length(btrim(${table.type})) BETWEEN 1 AND 30`),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  likes: many(likes),
  saves: many(saves),
  messages: many(messages),
  givenFollows: many(follows, { relationName: 'givenFollows' }),
  receivedFollows: many(follows, { relationName: 'receivedFollows' }),
  givenNotifications: many(notifications, { relationName: 'givenNotifications' }),
  receivedNotifications: many(notifications, { relationName: 'receivedNotifications' }),
  conversationLinks: many(conversationsToUsers),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  giver: one(users, {
    fields: [follows.giverId],
    references: [users.id],
    relationName: 'givenFollows',
  }),
  receiver: one(users, {
    fields: [follows.receiverId],
    references: [users.id],
    relationName: 'receivedFollows',
  }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  comments: many(comments),
  likes: many(likes),
  saves: many(saves),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, { fields: [comments.userId], references: [users.id] }),
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, { fields: [likes.userId], references: [users.id] }),
  post: one(posts, { fields: [likes.postId], references: [posts.id] }),
}));

export const savesRelations = relations(saves, ({ one }) => ({
  user: one(users, { fields: [saves.userId], references: [users.id] }),
  post: one(posts, { fields: [saves.postId], references: [posts.id] }),
}));

export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
  conversationUsers: many(conversationsToUsers),
}));

export const conversationsToUsersRelations = relations(conversationsToUsers, ({ one }) => ({
  conversation: one(conversations, {
    fields: [conversationsToUsers.conversationId],
    references: [conversations.id],
  }),
  user: one(users, {
    fields: [conversationsToUsers.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
    relationName: 'receivedNotifications',
  }),
  otherUser: one(users, {
    fields: [notifications.otherUserId],
    references: [users.id],
    relationName: 'givenNotifications',
  }),
}));
