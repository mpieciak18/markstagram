import { useEffect, useState } from 'react';

const LinkCopied = (props: { linkCopied: boolean }) => {
	const { linkCopied } = props;

	const [active, setActive] = useState('inactive');

	useEffect(() => {
		if (linkCopied === true) {
			setActive('active');
		} else {
			setActive('inactive');
		}
	}, [linkCopied]);

	return (
		<div className={`post-bottom-link-copied ${active}`}>
			<div>Link Copied!</div>
		</div>
	);
};

export { LinkCopied };
