import './Messages.css';
import { useCallback, useEffect, useState } from 'react';
import MessageSolid from '../../assets/images/dm.png';
import { useAuth } from '../../contexts/AuthContext';
import { usePopUp } from '../../contexts/PopUpContext';
import { useConversations } from '../../queries/useConversationQueries';
import { ConvoPopup } from '../other/ConvoPopup';
import { Navbar } from '../other/Navbar';
import { MessagesChild } from './children/MessagesChild';

const Messages = () => {
	const { user } = useAuth();
	const { popUpState, updatePopUp } = usePopUp();

	const [convosCount, setConvosCount] = useState(20);

	const {
		data: convos = [],
		isPending,
		isFetching,
		isSuccess,
	} = useConversations(convosCount);

	const isAllLoaded = isSuccess && convos.length < convosCount;

	const openPopup = () => updatePopUp('convosOn');

	const loadMore = useCallback(() => {
		if (!isAllLoaded && !isFetching) {
			setConvosCount((prev) => prev + 10);
		}
	}, [isAllLoaded, isFetching]);

	useEffect(() => {
		const handleScroll = () => {
			if (window.innerHeight + Math.ceil(window.pageYOffset) >= document.body.offsetHeight - 2) {
				loadMore();
			}
		};
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, [loadMore]);

	return (
		<div id="messages" className="page" style={{ pointerEvents: isPending ? 'none' : 'auto' }}>
			<Navbar />
			{user ? (
				<div id="convos">
					{popUpState.convosOn ? <ConvoPopup /> : null}
					<div id="convos-top">
						<img id="convos-user-icon" src={user.image ? user.image : undefined} />
						<div id="convos-title">Messages</div>
						<div id="convos-message-icon-container">
							<img id="convos-message-icon" src={MessageSolid} onClick={openPopup} />
						</div>
					</div>
					<div id="convos-divider" />
					<div id="convos-bottom">
						{convos.map((convo) => (
							<MessagesChild key={convo.id} convo={convo} />
						))}
					</div>
				</div>
			) : null}
		</div>
	);
};

export { Messages };
