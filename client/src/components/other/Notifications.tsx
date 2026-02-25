import { useAuth } from '@/contexts/AuthContext';
import { usePopUp } from '@/contexts/PopUpContext';
import { timeSince } from '@/other/timeSince';
import type { Notification, User } from '@markstagram/shared-types';
import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
	useMarkNotificationsRead,
	useReadNotifications,
	useUnreadNotifications,
} from '@/queries/useNotificationQueries';

interface NotificationRecord extends Notification {
	otherUser: User;
}

const Notifications = () => {
	const { user } = useAuth();
	const { updatePopUp } = usePopUp();

	const navigate = useNavigate();

	// Init notifications count state
	const [notifsCount, setNotifsCount] = useState(20);

	// Init whichTab state
	const [whichTab, setWhichTab] = useState('new');

	const buttonOne = whichTab === 'new' ? 'active' : ('inactive' as 'active' | 'inactive');
	const buttonTwo = whichTab !== 'new' ? 'active' : ('inactive' as 'active' | 'inactive');

	// Reset count when tab changes
	useEffect(() => {
		setNotifsCount(20);
	}, [whichTab]);

	const { data: unreadData = [] } = useUnreadNotifications(notifsCount);
	const { data: readData = [] } = useReadNotifications(notifsCount);

	const notifications: NotificationRecord[] =
		whichTab === 'new' ? (unreadData as NotificationRecord[]) : (readData as NotificationRecord[]);

	const allLoaded =
		whichTab === 'new' ? unreadData.length < notifsCount : readData.length < notifsCount;

	const markReadMutation = useMarkNotificationsRead();

	// Load more notifications when user reaches bottom of pop-up
	const loadMore = (e: React.UIEvent<HTMLDivElement>) => {
		const elem = e.target as HTMLDivElement;
		if (
			!allLoaded &&
			Math.ceil(elem.scrollHeight - elem.scrollTop) === elem.clientHeight
		) {
			setNotifsCount(notifsCount + 20);
		}
	};

	// Event handlers for buttons
	const newClick = () => setWhichTab('new');

	const oldClick = () => setWhichTab('old');

	const xButtonClick = () => updatePopUp();

	const clearNotifs = () => {
		markReadMutation.mutate();
	};

	return (
		<div id="notifs">
			<div id="notifs-pop-up">
				<div id="notifs-header">
					<div id="notifs-x-button" onClick={xButtonClick}>
						« Go Back
					</div>
					<div id="notifs-header-menu">
						<div id="notifs-button-label">Notifications:</div>
						<div id="new-button" className={buttonOne} onClick={newClick}>
							New
						</div>
						<div id="old-button" className={buttonTwo} onClick={oldClick}>
							Old
						</div>
					</div>
					<div id="notifs-x-button-hidden">« Go Back</div>
				</div>
				<div id="notifs-divider" />
				<div id="notifs-list" className={buttonOne} onScroll={loadMore}>
					{notifications.map((notif) => {
						const redirectToProfile = () => {
							navigate({
								to: '/$otherUserId',
								params: { otherUserId: String(notif.otherUserId) },
							});
							updatePopUp();
						};
						let text: string;
						const redirectToPath = () => {
							if (notif.type === 'like' || notif.type === 'comment') {
								navigate({
									to: '/$postOwnerId/$postId',
									params: {
										postOwnerId: String(user?.id),
										postId: String(notif.postId),
									},
								});
							} else if (notif.type === 'follow') {
								navigate({
									to: '/$otherUserId',
									params: { otherUserId: String(notif.otherUserId) },
								});
							} else {
								navigate({
									to: '/messages/$otherUserId',
									params: { otherUserId: String(notif.otherUserId) },
								});
							}
							updatePopUp();
						};
						if (notif.type === 'like') {
							text = 'liked your post.';
						} else if (notif.type === 'comment') {
							text = 'commented on a post.';
						} else if (notif.type === 'follow') {
							text = 'is following you.';
						} else {
							text = 'messaged you.';
						}
						const time = timeSince(notif.createdAt);
						return (
							<div className="notif-row" key={notif.id}>
								<div className="notif-row-left">
									<img
										className="notif-image"
										onClick={redirectToProfile}
										src={notif.otherUser.image ? notif.otherUser.image : undefined}
									/>
									<div className="notif-text" onClick={redirectToPath}>
										<div className="notif-name">{notif.otherUser.name}</div>
										<div className="notif-action">{text}</div>
									</div>
								</div>
								<div className="notif-row-right">
									<div className="notif-time">{time}</div>
								</div>
							</div>
						);
					})}
				</div>
				{whichTab === 'new' && notifications?.length > 0 ? (
					<div id="notifs-clear" className="button" onClick={clearNotifs}>
						Mark All Read
					</div>
				) : whichTab === 'new' ? (
					<div id="notifs-clear" className="message">
						No Unread Notifications
					</div>
				) : whichTab === 'old' && notifications?.length === 0 ? (
					<div id="notifs-clear" className="message">
						No Read Notifications
					</div>
				) : null}
			</div>
		</div>
	);
};

export { Notifications };
