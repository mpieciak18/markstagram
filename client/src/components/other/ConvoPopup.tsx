import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import './other.css';
import { useSearchUsers } from '../../queries/useUserQueries';
import { usePopUp } from '../../contexts/PopUpContext';

const ConvoPopup = () => {
	const { updatePopUp } = usePopUp();

	const navigate = useNavigate();

	// Init search value state
	const [value, setValue] = useState('');

	// Update search value on input change
	const updateValue = (e: React.ChangeEvent<HTMLInputElement>) => {
		setValue(e.target.value);
	};

	const { data: allResults = [] } = useSearchUsers(value);
	const results = value === '' ? [] : allResults;

	// Closes search
	const hideSearch = () => updatePopUp();

	// Redirects user to searched user's message page
	const redirect = (id: string) => {
		navigate({ to: '/messages/$otherUserId', params: { otherUserId: id } });
		updatePopUp();
	};

	return (
		<div id="convo-popup">
			<div id="convo-popup-parent">
				<div id="convo-popup-top">
					<div id="convo-popup-x-button" onClick={hideSearch}>
						✕ Cancel
					</div>
					<div id="convo-popup-title">Message Someone</div>
					<div id="convo-popup-x-button-hidden">✕ Cancel</div>
				</div>
				<div id="convo-popup-middle">
					<input id="convo-search" type="text" placeholder="Search" onChange={updateValue} />
				</div>
				<div id="convo-popup-bottom">
					{results.map((result) => {
						return (
							<div
								className="convo-result"
								onClick={() => redirect(String(result.id))}
								key={result.id}
							>
								<img className="convo-result-image" src={result.image ? result.image : undefined} />
								<div className="convo-result-name">@ {result.username}</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export { ConvoPopup };
