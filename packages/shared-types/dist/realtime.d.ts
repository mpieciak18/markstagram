import { z } from 'zod';
export declare const RealtimeTokenUserSchema: z.ZodObject<{
    id: z.ZodNumber;
    username: z.ZodString;
}, z.core.$strip>;
export declare const RealtimeMessageSchema: z.ZodObject<{
    id: z.ZodNumber;
    createdAt: z.ZodUnion<readonly [z.ZodString, z.ZodDate]>;
    message: z.ZodString;
    senderId: z.ZodNumber;
    conversationId: z.ZodNumber;
}, z.core.$strip>;
export declare const RealtimeInputErrorSchema: z.ZodObject<{
    message: z.ZodString;
}, z.core.$strip>;
export declare const RealtimeAuthFrameSchema: z.ZodObject<{
    type: z.ZodLiteral<"auth">;
    payload: z.ZodObject<{
        token: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const RealtimeJoinConversationFrameSchema: z.ZodObject<{
    type: z.ZodLiteral<"join_conversation">;
    payload: z.ZodObject<{
        conversationId: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const RealtimeSendMessageFrameSchema: z.ZodObject<{
    type: z.ZodLiteral<"send_message">;
    payload: z.ZodObject<{
        conversationId: z.ZodNumber;
        message: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const RealtimeClientFrameSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"auth">;
    payload: z.ZodObject<{
        token: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"join_conversation">;
    payload: z.ZodObject<{
        conversationId: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"send_message">;
    payload: z.ZodObject<{
        conversationId: z.ZodNumber;
        message: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>], "type">;
export declare const RealtimeAuthOkFrameSchema: z.ZodObject<{
    type: z.ZodLiteral<"auth_ok">;
    payload: z.ZodObject<{
        user: z.ZodObject<{
            id: z.ZodNumber;
            username: z.ZodString;
        }, z.core.$strip>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const RealtimeAuthErrorFrameSchema: z.ZodObject<{
    type: z.ZodLiteral<"auth_error">;
    payload: z.ZodObject<{
        message: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const RealtimeInputErrorFrameSchema: z.ZodObject<{
    type: z.ZodLiteral<"input_error">;
    payload: z.ZodObject<{
        errors: z.ZodArray<z.ZodObject<{
            message: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const RealtimeNewMessageFrameSchema: z.ZodObject<{
    type: z.ZodLiteral<"new_message">;
    payload: z.ZodObject<{
        message: z.ZodObject<{
            id: z.ZodNumber;
            createdAt: z.ZodUnion<readonly [z.ZodString, z.ZodDate]>;
            message: z.ZodString;
            senderId: z.ZodNumber;
            conversationId: z.ZodNumber;
        }, z.core.$strip>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const RealtimeReceiveNewMessageFrameSchema: z.ZodObject<{
    type: z.ZodLiteral<"receive_new_message">;
    payload: z.ZodObject<{
        message: z.ZodObject<{
            id: z.ZodNumber;
            createdAt: z.ZodUnion<readonly [z.ZodString, z.ZodDate]>;
            message: z.ZodString;
            senderId: z.ZodNumber;
            conversationId: z.ZodNumber;
        }, z.core.$strip>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const RealtimeServerErrorFrameSchema: z.ZodObject<{
    type: z.ZodLiteral<"server_error">;
    payload: z.ZodObject<{
        message: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const RealtimeServerFrameSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"auth_ok">;
    payload: z.ZodObject<{
        user: z.ZodObject<{
            id: z.ZodNumber;
            username: z.ZodString;
        }, z.core.$strip>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"auth_error">;
    payload: z.ZodObject<{
        message: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"input_error">;
    payload: z.ZodObject<{
        errors: z.ZodArray<z.ZodObject<{
            message: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"new_message">;
    payload: z.ZodObject<{
        message: z.ZodObject<{
            id: z.ZodNumber;
            createdAt: z.ZodUnion<readonly [z.ZodString, z.ZodDate]>;
            message: z.ZodString;
            senderId: z.ZodNumber;
            conversationId: z.ZodNumber;
        }, z.core.$strip>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"receive_new_message">;
    payload: z.ZodObject<{
        message: z.ZodObject<{
            id: z.ZodNumber;
            createdAt: z.ZodUnion<readonly [z.ZodString, z.ZodDate]>;
            message: z.ZodString;
            senderId: z.ZodNumber;
            conversationId: z.ZodNumber;
        }, z.core.$strip>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"server_error">;
    payload: z.ZodObject<{
        message: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>], "type">;
export type RealtimeClientFrame = z.infer<typeof RealtimeClientFrameSchema>;
export type RealtimeServerFrame = z.infer<typeof RealtimeServerFrameSchema>;
export type RealtimeTokenUser = z.infer<typeof RealtimeTokenUserSchema>;
//# sourceMappingURL=realtime.d.ts.map