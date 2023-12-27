import './Messages.css';
import { getConvos } from '../../services/messages.js';
import { useState, useEffect } from 'react';
import { Navbar } from '../other/Navbar.js';
import MessageSolid from '../../assets/images/dm.png';
import { ConvoPopup } from '../other/ConvoPopup.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { usePopUp } from '../../contexts/PopUpContext.js';
import { MessagesChild } from './children/MessagesChild.js';
import { Conversation, HasUsers, Message } from 'types';
import { useLoading } from '../../contexts/LoaderContext.js';

interface ConvoRecord extends Conversation, HasUsers {
	messages: Message[];
}

const Messages = () => {
	const { loading, setLoading } = useLoading();
	const { user } = useAuth();
	const { popUpState, updatePopUp } = usePopUp();

	// Init convos count state
	const [convosCount, setConvosCount] = useState(20);

	// Init convos arr state
	const [convos, setConvos] = useState<ConvoRecord[]>([]);

	// Init all convos loaded state
	const [allLoaded, setAllLoaded] = useState(false);

	// Open search pop-up on click
	const openPopup = () => updatePopUp('convosOn');

	// Update convos state when convosCount or user changes
	useEffect(() => {
		setLoading(true);
		getConvos(convosCount)
			.then((newConvos) => {
				if (newConvos != null) {
					setConvos(newConvos);
					if (newConvos.length < convosCount) {
						setAllLoaded(true);
					}
				} else {
					setConvos([]);
				}
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, [convosCount]);

	// Load-more function that updates the convos component
	const loadMore = () => {
		if (allLoaded == false) {
			const newConvosCount = convosCount + 10;
			setConvosCount(newConvosCount);
		}
	};

	// Trigger loadMore when user scrolls to bottom of page
	window.addEventListener('scroll', () => {
		if (
			window.innerHeight + Math.ceil(window.pageYOffset) >=
			document.body.offsetHeight - 2
		) {
			loadMore();
		}
	});

	return (
		<div
			id='messages'
			className='page'
			style={{ pointerEvents: `${loading ? 'none' : 'auto'}` }}
		>
			<Navbar />
			{user ? (
				<div id='convos'>
					{popUpState.convosOn ? <ConvoPopup /> : null}
					<div id='convos-top'>
						<img
							id='convos-user-icon'
							src={user.image ? user.image : undefined}
						/>
						<div id='convos-title'>Messages</div>
						<div id='convos-message-icon-container'>
							<img
								id='convos-message-icon'
								src={MessageSolid}
								onClick={openPopup}
							/>
						</div>
					</div>
					<div id='convos-divider'></div>
					<div id='convos-bottom'>
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
