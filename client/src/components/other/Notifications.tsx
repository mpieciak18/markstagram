import { useAuth } from '@/contexts/AuthContext';
import { useLoading } from '@/contexts/LoaderContext';
import { usePopUp } from '@/contexts/PopUpContext';
import { timeSince } from '@/other/timeSince';
import {
	getReadNotifications,
	getUnreadNotifications,
	readNotifications,
} from '@/services/notifications';
import type { Notification, User } from '@markstagram/shared-types';
import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

interface NotificationRecord extends Notification {
	otherUser: User;
}

const Notifications = () => {
	const { setLoading } = useLoading();
	const { user } = useAuth();
	const { updatePopUp } = usePopUp();

	const navigate = useNavigate();

	// Init notifcations count state
	const [notifsCount, setNotifsCount] = useState(0);

	// Init notifications arr state
	const [notifications, setNotifications] = useState<NotificationRecord[]>([]);

	// Init all loaded state
	const [allLoaded, setAllLoaded] = useState(false);

	// Init loading state
	const [loadingMore, setLoadingMore] = useState(false);

	// Init whichTab state
	const [whichTab, setWhichTab] = useState('new');

	// Init new & old notifications button classes
	const [buttonOne, setButtonOne] = useState<'active' | 'inactive'>();
	const [buttonTwo, setButtonTwo] = useState<'active' | 'inactive'>();

	// Change notifsCount, allLoaded, button, and markAllRead states when whichTab changes
	useEffect(() => {
		setAllLoaded(false);
		if (whichTab === 'new') {
			setButtonOne('active');
			setButtonTwo('inactive');
		} else {
			setButtonOne('inactive');
			setButtonTwo('active');
		}
		if (notifsCount === 20) {
			updateNotifications();
		} else {
			setNotifsCount(20);
		}
	}, [whichTab]);

	const updateNotifications = async () => {
		setLoading(true);
		if (whichTab === 'new') {
			getUnreadNotifications(notifsCount)
				.then((newNotifications) => {
					setNotifications(newNotifications);
					if (newNotifications.length < notifsCount) {
						setAllLoaded(true);
					}
					setLoading(false);
				})
				.catch(() => setLoading(false));
		} else {
			getReadNotifications(notifsCount)
				.then((newNotifications) => {
					setNotifications(newNotifications);
					if (newNotifications?.length < notifsCount) {
						setAllLoaded(true);
					}
					setLoading(false);
				})
				.catch(() => setLoading(false));
		}
	};

	// Change notifications state when notifsCount changes
	useEffect(() => {
		if (notifsCount > 0) {
			updateNotifications();
		} else {
			setNotifications([]);
		}
	}, [notifsCount]);

	// Load more notifications when user reaches bottom of pop-up
	const loadMore = async (e: React.UIEvent<HTMLDivElement>) => {
		if (allLoaded === false && loadingMore === false) {
			const elem = e.target as HTMLDivElement;
			if (Math.ceil(elem.scrollHeight - elem.scrollTop) === elem.clientHeight) {
				await setLoadingMore(true);
				const newCount = notifsCount + 20;
				await setNotifsCount(newCount);
				await setLoadingMore(false);
			}
		}
	};

	// Event handlers for buttons
	const newClick = () => setWhichTab('new');

	const oldClick = () => setWhichTab('old');

	const xButtonClick = () => updatePopUp();

	const clearNotifs = () => {
		setLoading(true);
		readNotifications()
			.then(() => {
				setNotifsCount(0);
				setLoading(false);
			})
			.catch(() => setLoading(false));
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
							navigate({ to: `/${notif.otherUserId}` });
							updatePopUp();
						};
						let path: string;
						let text: string;
						if (notif.type === 'like') {
							path = `/${user?.id}/${notif.postId}`;
							text = 'liked your post.';
						} else if (notif.type === 'comment') {
							path = `/${user?.id}/${notif.postId}`;
							text = 'commented on a post.';
						} else if (notif.type === 'follow') {
							path = `/${notif.otherUserId}`;
							text = 'is following you.';
						} else {
							path = `/messages/${notif.otherUserId}`;
							text = 'messaged you.';
						}
						const redirectToPath = () => {
							navigate({ to: `${path}` });
							updatePopUp();
						};
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
