import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchUsers } from '../../services/users';
import './other.css';
import type { User } from '@markstagram/shared-types';
import { useLoading } from '../../contexts/LoaderContext';
import { usePopUp } from '../../contexts/PopUpContext';

const ConvoPopup = () => {
	const { setLoading } = useLoading();
	const { updatePopUp } = usePopUp();

	const navigate = useNavigate();

	// Init search value state
	const [value, setValue] = useState('');

	// Update search value on input change
	const updateValue = (e: React.ChangeEvent<HTMLInputElement>) => {
		setValue(e.target.value);
	};

	// Init results array state
	const [results, setResults] = useState<User[]>([]);

	// Closes search
	const hideSearch = () => updatePopUp();

	// Update results when value changes
	useEffect(() => {
		if (value === '') setResults([]);
		else {
			setLoading(true);
			searchUsers(value)
				.then((newResults) => {
					setResults(newResults);
					setLoading(false);
				})
				.catch(() => setLoading(false));
		}
	}, [value]);

	// Redirects user to searched user's page
	const redirect = (id: string) => {
		navigate(`/messages/${id}`);
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
