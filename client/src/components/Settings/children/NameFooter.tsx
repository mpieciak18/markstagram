import { useEffect, useState } from 'react';

const NameFooter = (props: {
	name: string | null;
	setNamePasses: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
	const { setNamePasses, name } = props;
	const [footerText, setFooterText] = useState('Name must contain letters & spaces only.');
	const [footerClass, setFooterClass] = useState('grey');

	// Update name footer text, className, and namePasses state upon username change
	useEffect(() => {
		// Check if name is undefined
		if (name === null) {
			setFooterText('Name must contain letters & spaces only.');
			setFooterClass('grey');
		}
		// Check if no name is entered (ie, entered then backspaced)
		else if (name.match(/^.{0,0}$/) != null) {
			setNamePasses(false);
			setFooterText('Name must contain letters & spaces only.');
			setFooterClass('grey');
		}
		// Check if name only contains letters or spaces
		else if (name.match(/^[a-zA-Z\s]*$/) == null) {
			setNamePasses(false);
			setFooterText('No spaces or symbols, other than "-" or "_"!');
			setFooterClass('red');
		}
		// Check if name is greater than 30 characters
		else if (name.match(/^.{31,}$/) != null) {
			setNamePasses(false);
			setFooterText('Name is too long!');
			setFooterClass('red');
		}
		// Check if name is greater than 3 characters
		else if (name.match(/^.{0,2}$/) != null) {
			setNamePasses(false);
			setFooterText('Name is too short!');
			setFooterClass('red');
		}
		// Name passes
		else {
			setNamePasses(true);
			setFooterText('Valid username! :-)');
			setFooterClass('grey');
		}
	}, [name]);

	return (
		<div id="settings-name-footer" className={footerClass}>
			{footerText}
		</div>
	);
};

export { NameFooter };
