import { z } from 'zod';
export const RealtimeTokenUserSchema = z.object({
    id: z.number().int().positive(),
    username: z.string(),
});
export const RealtimeMessageSchema = z.object({
    id: z.number().int().positive(),
    createdAt: z.union([z.string(), z.date()]),
    message: z.string(),
    senderId: z.number().int().positive(),
    conversationId: z.number().int().positive(),
});
export const RealtimeInputErrorSchema = z.object({
    message: z.string(),
});
export const RealtimeAuthFrameSchema = z.object({
    type: z.literal('auth'),
    payload: z.object({
        token: z.string().trim().min(1),
    }),
});
export const RealtimeJoinConversationFrameSchema = z.object({
    type: z.literal('join_conversation'),
    payload: z.object({
        conversationId: z.number().int().positive(),
    }),
});
export const RealtimeSendMessageFrameSchema = z.object({
    type: z.literal('send_message'),
    payload: z.object({
        conversationId: z.number().int().positive(),
        message: z.string().trim().min(1).max(2000),
    }),
});
export const RealtimeClientFrameSchema = z.discriminatedUnion('type', [
    RealtimeAuthFrameSchema,
    RealtimeJoinConversationFrameSchema,
    RealtimeSendMessageFrameSchema,
]);
export const RealtimeAuthOkFrameSchema = z.object({
    type: z.literal('auth_ok'),
    payload: z.object({
        user: RealtimeTokenUserSchema,
    }),
});
export const RealtimeAuthErrorFrameSchema = z.object({
    type: z.literal('auth_error'),
    payload: z.object({
        message: z.string(),
    }),
});
export const RealtimeInputErrorFrameSchema = z.object({
    type: z.literal('input_error'),
    payload: z.object({
        errors: z.array(RealtimeInputErrorSchema).min(1),
    }),
});
export const RealtimeNewMessageFrameSchema = z.object({
    type: z.literal('new_message'),
    payload: z.object({
        message: RealtimeMessageSchema,
    }),
});
export const RealtimeReceiveNewMessageFrameSchema = z.object({
    type: z.literal('receive_new_message'),
    payload: z.object({
        message: RealtimeMessageSchema,
    }),
});
export const RealtimeServerErrorFrameSchema = z.object({
    type: z.literal('server_error'),
    payload: z.object({
        message: z.string(),
    }),
});
export const RealtimeServerFrameSchema = z.discriminatedUnion('type', [
    RealtimeAuthOkFrameSchema,
    RealtimeAuthErrorFrameSchema,
    RealtimeInputErrorFrameSchema,
    RealtimeNewMessageFrameSchema,
    RealtimeReceiveNewMessageFrameSchema,
    RealtimeServerErrorFrameSchema,
]);
