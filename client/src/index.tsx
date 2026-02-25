import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import './index.css';
import { App } from './App';
import { AuthProvider } from './contexts/AuthContext';
import { LoadingProvider } from './contexts/LoaderContext';
import { PopUpProvider } from './contexts/PopUpContext';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<LoadingProvider>
			<AuthProvider>
				<PopUpProvider>
					<App />
				</PopUpProvider>
			</AuthProvider>
		</LoadingProvider>
	</React.StrictMode>,
);
