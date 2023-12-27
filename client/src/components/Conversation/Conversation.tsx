import { useParams, useNavigate } from 'react-router-dom';
import './Conversation.css';
import { getSingleConvo, createConvo } from '../../services/messages.js';
import { useEffect, useState } from 'react';
import { ConvoMessages } from './children/ConvoMessages.js';
import { Navbar } from '../other/Navbar.js';
import { findUser } from '../../services/users.js';
import { io, Socket } from 'socket.io-client';
import { getToken } from '../../services/localstor.js';
import { Conversation, HasUsers, Message, User, UserStatsCount } from 'types';
import { useLoading } from '../../contexts/LoaderContext.js';

interface ConvoRecord extends Conversation, HasUsers {
	messages: Message[];
}

const ConvoPage = () => {
	const navigate = useNavigate();
	const { loading, setLoading } = useLoading();

	// Socket state
	const [socket, setSocket] = useState<Socket>();

	// Grab other user's id from url parameters
	const otherUserId = Number(useParams().otherUserId);

	// Init other user state
	const [otherUser, setOtherUser] = useState<User & UserStatsCount>();

	// Init messages number state
	const [messagesNumber, setMessagesNumber] = useState<number>();

	// A function to update messages Number after the ConvoMessages child component renders
	// The purpose is to ensure the minimum number of messages load & render so that scrolling is possible
	const getInitMessagesNumber = (elem: HTMLDivElement) => {
		let number = 13;
		let defaultDenom = 45;
		if (elem?.clientHeight) {
			number = Math.ceil(elem.clientHeight / defaultDenom);
		}
		setMessagesNumber(number);
	};

	// Init diffMessNumber state
	const [diffMessNumber, setDiffMessNumber] = useState(0);

	// Init convo db record array state
	const [convo, setConvo] = useState<ConvoRecord | null>(null);

	// Function to updates messages array of convo object (in response to socket receiving new messages)
	const updateConvoMessages = (message: Message) => {
		setConvo((prevConvo) => {
			if (!prevConvo) return null;
			return {
				...prevConvo,
				messages: [message, ...prevConvo.messages],
			};
		});
	};

	// Set initial message input value & reset it on submission
	const [messageValue, setMessageValue] = useState('');

	const initSocket = async (): Promise<Socket> => {
		return new Promise((resolve, reject) => {
			const socket = io(import.meta.env.VITE_API_URL, {
				auth: {
					token: getToken(),
				},
			});
			socket.on('connect', () => {
				resolve(socket);
			});

			socket.on('connect_error', (error) => {
				reject(error);
			});
		});
	};

	// Update otherUser state upon init render
	useEffect(() => {
		initSocket().then((newSocket) => {
			setSocket(newSocket);
			if (otherUserId && !otherUser) {
				setLoading(true);
				findUser(otherUserId)
					.then((newUser) => {
						setOtherUser(newUser);
						if (!newUser) {
							setLoading(false);
						}
					})
					.catch(() => setLoading(false));
			}
		});
	}, []);

	// Update convo state when otherUser or messagesNumber changes
	useEffect(() => {
		// If this useEffect fires off to retrieve a new convo + messages data,
		// but there have been new messages sent since this component rendered,
		// as tracked by diffMessNumber, then we must clear out diffMessNumber
		// and add its prev value to messagesNumber, which will retrigger this useEffect.
		// This will ensure we grab the correct number of messages.
		if (diffMessNumber > 0 && messagesNumber) {
			const newNum = messagesNumber + diffMessNumber;
			setDiffMessNumber(0);
			setMessagesNumber(newNum);
		} else if (otherUser && messagesNumber) {
			setLoading(true);
			getSingleConvo(otherUserId, messagesNumber)
				.then((newConvo) => {
					setConvo(newConvo);
					setLoading(false);
				})
				.catch(() => setLoading(false));
		}
	}, [otherUser, messagesNumber]);

	// Init websocket & establish connection to it once we have a convo id
	useEffect(() => {
		if (convo?.id && socket) {
			// Establish WebSocket connection
			socket.emit('joinConversation', { conversationId: convo.id });
			socket.on('receiveNewMessage', (newMessage: Message) => {
				updateConvoMessages(newMessage);
			});
			// Disconnect from WebSocket on unmount
			return () => {
				socket.disconnect();
				socket.off('sendNewMessage');
				socket.off('receiveNewMessage');
				setSocket(undefined);
			};
		}
	}, [convo?.id, socket]);

	// Update scroll height when convo.messages changes (only on new message, ie diffMessNumber > 0)
	useEffect(() => {
		if (diffMessNumber > 0) {
			const elem = document.getElementById('convo-messages');
			if (elem !== null) elem.scrollTop = elem.scrollHeight;
		}
	}, [convo?.messages]);

	// Load more messages when user reaches bottom of messages component
	const loadMore = (e: React.UIEvent<HTMLDivElement>) => {
		const elem = e.target as HTMLDivElement;
		if (elem.scrollTop == 0 && messagesNumber) {
			const newMessagesNumber = messagesNumber + diffMessNumber + 10;
			setDiffMessNumber(0);
			setMessagesNumber(newMessagesNumber);
		}
	};

	// Updates message state / field
	const updateMessage = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		setMessageValue(val);
	};

	// Add new message to specific convo in db
	const sendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (messageValue.length > 0) {
			setMessageValue('');
			let id = convo?.id;
			if (!id) {
				const newConvo = await createConvo(otherUserId);
				setConvo(newConvo);
				id = newConvo.id;
			}
			if (socket) {
				socket.emit('sendNewMessage', {
					id,
					message: messageValue,
				});
			}
			setDiffMessNumber(diffMessNumber + 1);
		}
	};

	// Redirect back to messages page
	const goBack = () => navigate('/messages');

	// Redirect to other user's page
	const redirect = () => navigate(`/${otherUserId}`);

	return (
		<div
			id='conversation'
			className='page'
			style={{ pointerEvents: `${loading ? 'none' : 'auto'}` }}
		>
			<Navbar />
			<div id='conversation-container'>
				<div id='convo-header'>
					<div id='convo-back-arrow' onClick={goBack}>
						« Go Back
					</div>
					{otherUser ? (
						<div id='convo-title-container'>
							<div id='title'>{otherUser.name}</div>
							<div id='subtitle' onClick={redirect}>
								@{otherUser.username}
							</div>
						</div>
					) : null}
					<div id='convo-back-arrow-hidden'>« Go Back</div>
				</div>
				{otherUser ? (
					<ConvoMessages
						otherUser={otherUser}
						messages={convo?.messages}
						loadMore={loadMore}
						initNumber={getInitMessagesNumber}
					/>
				) : null}
				<form id='convo-message-bar' onSubmit={sendMessage}>
					<input
						type='text'
						id='convo-message-bar-input'
						placeholder='Send a message...'
						value={messageValue}
						onChange={updateMessage}
					/>
					<button
						type={messageValue.length > 0 ? 'submit' : 'button'}
						id='convo-message-button'
						className={
							messageValue.length > 0 ? 'active' : 'inactive'
						}
					>
						Send
					</button>
				</form>
			</div>
		</div>
	);
};

export { ConvoPage };
