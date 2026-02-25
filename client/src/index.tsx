import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import { router } from './router';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PopUpProvider } from './contexts/PopUpContext';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60,
			gcTime: 1000 * 60 * 5,
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
});

const InnerApp = () => {
	const { user } = useAuth();
	return <RouterProvider router={router} context={{ auth: user, queryClient }} />;
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<PopUpProvider>
					<InnerApp />
				</PopUpProvider>
			</AuthProvider>
		</QueryClientProvider>
	</React.StrictMode>,
);
