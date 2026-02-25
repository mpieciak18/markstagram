import {
	createRootRouteWithContext,
	createRoute,
	createRouter,
	redirect,
} from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import type { UserContext } from './contexts/AuthContext';
import { RootLayout } from './components/RootLayout';
import { Home } from './components/Home/Home';
import { HomeLoggedOut } from './components/Home/HomeLoggedOut';
import { Messages } from './components/Messages/Messages';
import { ConvoPage } from './components/Conversation/Conversation';
import { Saved } from './components/SavedPosts/Saved';
import { Settings } from './components/Settings/Settings';
import { PostPage } from './components/Post/Post';
import { Profile } from './components/Profile/Profile';
import { SignUp } from './components/SignUp/SignUp';
import { Login } from './components/Login/Login';

export interface RouterContext {
	auth: UserContext | null;
	queryClient: QueryClient;
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
	component: RootLayout,
});

// --- Authenticated routes ---

const homeRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/',
	beforeLoad: ({ context }) => {
		if (!context.auth) throw redirect({ to: '/login' });
	},
	component: Home,
});

const messagesRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/messages',
	beforeLoad: ({ context }) => {
		if (!context.auth) throw redirect({ to: '/login' });
	},
	component: Messages,
});

const conversationRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/messages/$otherUserId',
	beforeLoad: ({ context }) => {
		if (!context.auth) throw redirect({ to: '/login' });
	},
	component: ConvoPage,
});

const savedRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/saved',
	beforeLoad: ({ context }) => {
		if (!context.auth) throw redirect({ to: '/login' });
	},
	component: Saved,
});

const settingsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/settings',
	beforeLoad: ({ context }) => {
		if (!context.auth) throw redirect({ to: '/login' });
	},
	component: Settings,
});

const postRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/$postOwnerId/$postId',
	beforeLoad: ({ context }) => {
		if (!context.auth) throw redirect({ to: '/login' });
	},
	component: PostPage,
});

const profileRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/$otherUserId',
	beforeLoad: ({ context }) => {
		if (!context.auth) throw redirect({ to: '/login' });
	},
	component: Profile,
});

// --- Unauthenticated routes ---

const signupRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/signup',
	beforeLoad: ({ context }) => {
		if (context.auth) throw redirect({ to: '/' });
	},
	component: SignUp,
});

const loginRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/login',
	beforeLoad: ({ context }) => {
		if (context.auth) throw redirect({ to: '/' });
	},
	component: Login,
});

// --- Route tree ---

const routeTree = rootRoute.addChildren([
	homeRoute,
	messagesRoute,
	conversationRoute,
	savedRoute,
	settingsRoute,
	postRoute,
	profileRoute,
	signupRoute,
	loginRoute,
]);

// --- Router instance ---

export const router = createRouter({
	routeTree,
	context: {
		auth: null,
		queryClient: undefined!,
	},
	defaultNotFoundComponent: HomeLoggedOut,
});

// Type registration for full type safety
declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router;
	}
	interface HistoryState {
		path?: string;
		newSignUp?: boolean;
	}
}
