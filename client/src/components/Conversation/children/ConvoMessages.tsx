import type { Message, User, UserStatsCount } from '@markstagram/shared-types';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { timeSince } from '../../../other/timeSince';

const ConvoMessages = (props: {
	otherUser: User & UserStatsCount;
	messages: Message[] | undefined;
	loadMore: (e: React.UIEvent<HTMLDivElement>) => void;
	initNumber: (elem: HTMLDivElement) => void;
}) => {
	const { user } = useAuth();

	const { otherUser, messages, loadMore, initNumber } = props;

	const [isInit, setIsInit] = useState(false);

	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (ref.current) {
			initNumber(ref.current);
		}
	}, [ref]);

	// Scroll down when messages changes
	useEffect(() => {
		if (isInit === false && messages) {
			if (ref.current) {
				ref.current.scrollTop = ref.current.scrollHeight;
				setIsInit(true);
			}
		}
	}, [messages]);

	// Update messages state when messages changes
	const generateMessages = () => {
		return messages?.toReversed().map((message, i) => {
			//
			let sender;
			if (user?.id === message.senderId) {
				sender = 'self';
			} else {
				sender = 'other';
			}
			let icon;
			let name = null;
			let senderChange = false;

			if (i === 0) {
				senderChange = true;
			} else if (messages[i - 1].senderId !== message.senderId) {
				senderChange = true;
			}

			if (senderChange) {
				if (sender === 'self') {
					icon = <div className="message-block-icon" />;
					name = <div className="message-name">You, {timeSince(message.createdAt)}:</div>;
				} else {
					icon = (
						<img
							className="message-block-icon"
							src={otherUser.image ? otherUser.image : undefined}
						/>
					);
					name = (
						<div className="message-name">
							{otherUser.username}, {timeSince(message.createdAt)}:
						</div>
					);
				}
			}

			return (
				<div className={`message-block-container ${sender}`} key={message.id}>
					{name}
					<div className="message-block">
						<div className="message-block-icon-container">{icon}</div>
						<div className="message-block-bubble">
							<div className="message-block-message">{message.message}</div>
						</div>
					</div>
				</div>
			);
		});
	};

	return (
		<div id="convo-messages" onScroll={loadMore} ref={ref}>
			{generateMessages()}
		</div>
	);
};

export { ConvoMessages };
