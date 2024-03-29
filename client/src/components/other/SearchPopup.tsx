import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { searchUsers } from '../../services/users.js';
import { usePopUp } from '../../contexts/PopUpContext.js';
import { User } from 'types';
import { useLoading } from '../../contexts/LoaderContext.js';

const SearchPopup = (props: { searchVal: string }) => {
	const { updatePopUp } = usePopUp();
	const { setLoading } = useLoading();
	const { searchVal } = props;

	const navigate = useNavigate();

	const location = useParams();

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
				2000
			);
			return () => clearTimeout(doSearch);
		} else {
			setSearchedUsers([]);
		}
	}, [searchVal]);

	return (
		<div id='search-popup'>
			<div id='search-popup-parent'>
				<div id='search-popup-top'>
					<div id='search-popup-x-button' onClick={hideSearch}>
						✕ Cancel
					</div>
					<div id='search-popup-title'>Search</div>
					<div id='search-popup-x-button-hidden'>✕ Cancel</div>
				</div>
				<div id='search-popup-bottom'>
					{searchedUsers.map((searchedUser) => {
						const redirect = () => {
							updatePopUp();
							if (location.otherUserId == null) {
								navigate(`/${searchedUser.id}`);
							} else {
								navigate(`/${searchedUser.id}`);
								window.location.reload();
							}
						};
						return (
							<div
								className='search-result'
								onClick={redirect}
								key={searchedUser.id}
							>
								<img
									className='search-result-image'
									src={
										searchedUser.image
											? searchedUser.image
											: undefined
									}
								/>
								<div className='search-result-name'>
									@ {searchedUser.username}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export { SearchPopup };
