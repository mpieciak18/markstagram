import { useAuth } from '@/contexts/AuthContext';
import { timeSinceTrunc } from '@/other/timeSinceTrunc';
import type { Conversation, HasUsers, Message, User } from '@markstagram/shared-types';
import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

interface ConvoRecord extends Conversation, HasUsers {
	messages: Message[];
}

export const MessagesChild = (props: { convo: ConvoRecord }) => {
	const { convo } = props;
	const { user } = useAuth();
	const [otherUser, setOtherUser] = useState<User>();

	// Update otherUser when convo changes
	useEffect(() => {
		if (convo?.users?.length === 2) {
			for (const convoUser of convo.users) {
				if (user?.id === convoUser.id) {
				} else {
					setOtherUser(convoUser);
				}
			}
		}
	}, [convo]);

	return otherUser ? (
		<Link
			className="convo-row"
			key={convo.id}
			to="/messages/$otherUserId"
			params={{ otherUserId: String(otherUser.id) }}
		>
			<div className="convo-row-left">
				<img className="convo-image" src={otherUser.image ? otherUser.image : undefined} />
				<div className="convo-text">
					<div className="convo-name">{otherUser.name}</div>
					<div className="convo-username">@{otherUser.username}</div>
				</div>
			</div>
			<div className="convo-row-right">
				<div className="convo-row-message">
					{`${
						convo.messages[0]?.senderId === user?.id ? 'You' : 'Them'
					}: "${convo.messages[0]?.message}"`}
				</div>
				<div className="convo-row-time">{timeSinceTrunc(convo.messages[0]?.createdAt)}</div>
			</div>
		</Link>
	) : null;
};
