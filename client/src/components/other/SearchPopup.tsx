import type { User } from '@markstagram/shared-types';
import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useLoading } from '../../contexts/LoaderContext';
import { usePopUp } from '../../contexts/PopUpContext';
import { searchUsers } from '../../services/users';

const SearchPopup = (props: { searchVal: string }) => {
	const { updatePopUp } = usePopUp();
	const { setLoading } = useLoading();
	const { searchVal } = props;

	const navigate = useNavigate();


	// Init results array state
	const [searchedUsers, setSearchedUsers] = useState<User[]>([]);

	// Closes search
	const hideSearch = () => {
		updatePopUp();
	};

	// Update results when value changes
	useEffect(() => {
		if (searchVal != null) {
			setLoading(true);
			const doSearch = setTimeout(
				() =>
					searchUsers(searchVal)
						.then((results) => {
							setSearchedUsers(results);
							setLoading(false);
						})
						.catch(() => setLoading(false)),
				2000,
			);
			return () => clearTimeout(doSearch);
		}
		setSearchedUsers([]);
	}, [searchVal]);

	return (
		<div id="search-popup">
			<div id="search-popup-parent">
				<div id="search-popup-top">
					<div id="search-popup-x-button" onClick={hideSearch}>
						✕ Cancel
					</div>
					<div id="search-popup-title">Search</div>
					<div id="search-popup-x-button-hidden">✕ Cancel</div>
				</div>
				<div id="search-popup-bottom">
					{searchedUsers.map((searchedUser) => {
						const redirect = () => {
							updatePopUp();
							navigate({ to: '/$otherUserId', params: { otherUserId: String(searchedUser.id) } });
						};
						return (
							<div className="search-result" onClick={redirect} key={searchedUser.id}>
								<img
									className="search-result-image"
									src={searchedUser.image ? searchedUser.image : undefined}
								/>
								<div className="search-result-name">@ {searchedUser.username}</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export { SearchPopup };
