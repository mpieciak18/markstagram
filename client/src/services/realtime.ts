import type { Message, RealtimeServerFrame } from '@markstagram/shared-types';
import { RealtimeServerFrameSchema } from '@markstagram/shared-types';
import { type Socket, io } from 'socket.io-client';
import { REALTIME_TRANSPORT, SOCKET_BASE_URL, WS_ENDPOINT_URL } from './api';

type EventPayloadMap = {
	auth_ok: { user: { id: number; username: string } };
	auth_error: { message: string };
	input_error: { errors: Array<{ message: string }> };
	new_message: { message: Message };
	receive_new_message: { message: Message };
	server_error: { message: string };
};

type EventType = keyof EventPayloadMap;
type Listener<T extends EventType> = (payload: EventPayloadMap[T]) => void;
type ListenerMap = {
	[K in EventType]: Set<Listener<K>>;
};

const createListenerMap = (): ListenerMap => ({
	auth_ok: new Set(),
	auth_error: new Set(),
	input_error: new Set(),
	new_message: new Set(),
	receive_new_message: new Set(),
	server_error: new Set(),
});

const normalizeLegacyInputErrors = (
	payload: unknown,
): EventPayloadMap['input_error'] => {
	if (Array.isArray(payload)) {
		return {
			errors: payload
				.filter((entry): entry is { message: string } => {
					return (
						typeof entry === 'object' &&
						entry !== null &&
						typeof (entry as { message?: unknown }).message === 'string'
					);
				})
				.map((entry) => ({ message: entry.message })),
		};
	}

	return { errors: [{ message: 'Invalid realtime payload.' }] };
};

const dispatch = <T extends EventType>(
	listeners: ListenerMap,
	type: T,
	payload: EventPayloadMap[T],
) => {
	for (const listener of listeners[type]) {
		listener(payload);
	}
};

const normalizeMessage = (message: {
	id: number;
	createdAt: string | Date;
	message: string;
	senderId: number;
	conversationId: number;
}): Message => ({
	...message,
	createdAt: message.createdAt instanceof Date ? message.createdAt : new Date(message.createdAt),
});

export type RealtimeClient = {
	connect: (token: string) => Promise<void>;
	disconnect: () => void;
	joinConversation: (conversationId: number) => void;
	sendMessage: (conversationId: number, message: string) => void;
	on: <T extends EventType>(type: T, listener: Listener<T>) => () => void;
};

class NativeRealtimeClient implements RealtimeClient {
	private socket?: WebSocket;
	private listeners: ListenerMap = createListenerMap();
	private reconnectTimer?: ReturnType<typeof setTimeout>;
	private reconnectAttempts = 0;
	private manuallyDisconnected = false;
	private token = '';
	private joinedConversationIds = new Set<number>();

	async connect(token: string): Promise<void> {
		this.token = token;
		this.manuallyDisconnected = false;
		await this.connectSocket();
	}

	disconnect(): void {
		this.manuallyDisconnected = true;
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = undefined;
		}
		this.socket?.close();
		this.socket = undefined;
	}

	joinConversation(conversationId: number): void {
		this.joinedConversationIds.add(conversationId);
		this.sendFrame({
			type: 'join_conversation',
			payload: { conversationId },
		});
	}

	sendMessage(conversationId: number, message: string): void {
		this.sendFrame({
			type: 'send_message',
			payload: { conversationId, message },
		});
	}

	on<T extends EventType>(type: T, listener: Listener<T>): () => void {
		this.listeners[type].add(listener);
		return () => {
			this.listeners[type].delete(listener);
		};
	}

	private sendFrame(frame: unknown): void {
		if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
			return;
		}
		this.socket.send(JSON.stringify(frame));
	}

	private async connectSocket(): Promise<void> {
		await new Promise<void>((resolve, reject) => {
			const ws = new WebSocket(WS_ENDPOINT_URL);
			let settled = false;

			ws.addEventListener('open', () => {
				this.socket = ws;
				this.reconnectAttempts = 0;
				this.sendFrame({
					type: 'auth',
					payload: { token: this.token },
				});
				if (settled) return;
				settled = true;
				resolve();
			});

			ws.addEventListener('error', () => {
				if (settled) return;
				settled = true;
				reject(new Error('Failed to connect websocket.'));
			});

			ws.addEventListener('message', (event) => {
				if (typeof event.data !== 'string') {
					dispatch(this.listeners, 'server_error', {
						message: 'WebSocket message frame is not text.',
					});
					return;
				}
				this.handleServerFrame(event.data);
			});

			ws.addEventListener('close', () => {
				this.socket = undefined;
				if (this.manuallyDisconnected) {
					return;
				}
				this.scheduleReconnect();
			});
		});
	}

	private scheduleReconnect(): void {
		if (this.manuallyDisconnected || this.reconnectTimer) {
			return;
		}

		const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 8000);
		this.reconnectAttempts += 1;
		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = undefined;
			void this.connectSocket().catch(() => {
				this.scheduleReconnect();
			});
		}, delay);
	}

	private handleServerFrame(rawFrame: string): void {
		let decoded: unknown;
		try {
			decoded = JSON.parse(rawFrame);
		} catch {
			dispatch(this.listeners, 'server_error', { message: 'Invalid realtime JSON payload.' });
			return;
		}

		const parsed = RealtimeServerFrameSchema.safeParse(decoded);
		if (!parsed.success) {
			dispatch(this.listeners, 'server_error', { message: 'Invalid realtime frame payload.' });
			return;
		}

		this.dispatchFrame(parsed.data);
	}

	private dispatchFrame(frame: RealtimeServerFrame): void {
		if (frame.type === 'auth_ok') {
			for (const conversationId of this.joinedConversationIds) {
				this.sendFrame({
					type: 'join_conversation',
					payload: { conversationId },
				});
			}
		}
		switch (frame.type) {
			case 'auth_ok':
				dispatch(this.listeners, 'auth_ok', frame.payload);
				return;
			case 'auth_error':
				dispatch(this.listeners, 'auth_error', frame.payload);
				return;
			case 'input_error':
				dispatch(this.listeners, 'input_error', frame.payload);
				return;
			case 'new_message':
				dispatch(this.listeners, 'new_message', {
					message: normalizeMessage(frame.payload.message),
				});
				return;
			case 'receive_new_message':
				dispatch(this.listeners, 'receive_new_message', {
					message: normalizeMessage(frame.payload.message),
				});
				return;
			case 'server_error':
				dispatch(this.listeners, 'server_error', frame.payload);
				return;
		}
	}
}

class SocketIoRealtimeClient implements RealtimeClient {
	private socket?: Socket;
	private listeners: ListenerMap = createListenerMap();

	async connect(token: string): Promise<void> {
		await new Promise<void>((resolve, reject) => {
			const socket = io(SOCKET_BASE_URL, {
				auth: { token },
			});

			let settled = false;
			socket.on('connect', () => {
				if (settled) return;
				settled = true;
				this.socket = socket;
				dispatch(this.listeners, 'auth_ok', { user: { id: 0, username: '' } });
				resolve();
			});

			socket.on('connect_error', (error) => {
				if (settled) {
					dispatch(this.listeners, 'auth_error', {
						message: error?.message || 'Realtime connection failed.',
					});
					return;
				}
				settled = true;
				reject(error);
			});

			socket.on('authError', (payload: unknown) => {
				const message =
					typeof payload === 'object' &&
					payload !== null &&
					typeof (payload as { message?: unknown }).message === 'string'
						? (payload as { message: string }).message
						: 'Authentication error.';
				dispatch(this.listeners, 'auth_error', { message });
			});

			socket.on('inputError', (payload: unknown) => {
				dispatch(this.listeners, 'input_error', normalizeLegacyInputErrors(payload));
			});

			socket.on('newMessage', (message: Message) => {
				dispatch(this.listeners, 'new_message', { message });
			});

			socket.on('receiveNewMessage', (message: Message) => {
				dispatch(this.listeners, 'receive_new_message', { message });
			});

			socket.on('error', (payload: unknown) => {
				const message =
					typeof payload === 'object' &&
					payload !== null &&
					typeof (payload as { message?: unknown }).message === 'string'
						? (payload as { message: string }).message
						: 'Realtime server error.';
				dispatch(this.listeners, 'server_error', { message });
			});
		});
	}

	disconnect(): void {
		this.socket?.disconnect();
		this.socket = undefined;
	}

	joinConversation(conversationId: number): void {
		this.socket?.emit('joinConversation', { conversationId });
	}

	sendMessage(conversationId: number, message: string): void {
		this.socket?.emit('sendNewMessage', { id: conversationId, message });
	}

	on<T extends EventType>(type: T, listener: Listener<T>): () => void {
		this.listeners[type].add(listener);
		return () => {
			this.listeners[type].delete(listener);
		};
	}
}

export const createRealtimeClient = (): RealtimeClient => {
	if (REALTIME_TRANSPORT === 'socketio') {
		return new SocketIoRealtimeClient();
	}
	return new NativeRealtimeClient();
};
