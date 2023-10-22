import { useState, useEffect, useRef } from 'react';
import { timeSince } from '../../../other/timeSince.js';
import { useAuth } from '../../../contexts/AuthContext.js';

const ConvoMessages = (props) => {
	const { user } = useAuth();

	const { otherUser, messagesArr, loadMore } = props;

	const [otherUserImg, setOtherUserImg] = useState(null);

	const [otherUserName, setOtherUserName] = useState(null);

	const [isInit, setIsInit] = useState(false);

	const ref = useRef();

	// Update image source on render
	useEffect(() => {
		if (otherUser != null) {
			setOtherUserImg(otherUser.data.image);
			setOtherUserName(otherUser.data.name);
		}
	}, [otherUser]);

	// Scroll down when messages changes
	useEffect(() => {
		if (isInit == false && messagesArr) {
			const elem = document.getElementById('convo-messages');
			elem.scrollTop = elem.scrollHeight;
			setIsInit(true);
		}
	}, [messagesArr]);

	// Update messages state when messagesArr changes
	const generateMessages = () => {
		return messagesArr.map((message) => {
			let sender;
			if (user.id == message.data.sender) {
				sender = 'self';
			} else {
				sender = 'other';
			}

			let icon;
			let name = null;

			if (message.data.senderChange == true) {
				if (sender == 'self') {
					icon = <div className='message-block-icon' />;
					name = (
						<div className='message-name'>
							You, {timeSince(message.data.date)}:
						</div>
					);
				} else {
					icon = (
						<img
							className='message-block-icon'
							src={otherUserImg}
						/>
					);
					name = (
						<div className='message-name'>
							{otherUserName}, {timeSince(message.data.date)}
						</div>
					);
				}
			}

			return (
				<div
					className={`message-block-container ${sender}`}
					key={message.id}
				>
					{name}
					<div className='message-block'>
						<div className='message-block-icon-container'>
							{icon}
						</div>
						<div className='message-block-bubble'>
							<div className='message-block-message'>
								{message.data.message}
							</div>
						</div>
					</div>
				</div>
			);
		});
	};

	return (
		<div id='convo-messages' onScroll={loadMore} ref={ref}>
			{messagesArr?.length > 0 ? generateMessages() : null}
		</div>
	);
};

export { ConvoMessages };
