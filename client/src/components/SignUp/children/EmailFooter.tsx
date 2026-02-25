import { useEffect, useState } from 'react';

const EmailFooter = (props: {
	setEmailPasses: React.Dispatch<React.SetStateAction<boolean>>;
	email: string;
	isUnique: boolean;
}) => {
	const { setEmailPasses, email, isUnique } = props;
	const [footerText, setFooterText] = useState('Email address must be valid.');
	const [footerClass, setFooterClass] = useState('grey');

	// Regex variable for RFC 5322 standard for valid email addresses
	const reg =
		/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

	const updateStates = async () => {
		// Checks if no email is entered
		if (email.length === 0) {
			setEmailPasses(false);
			setFooterText('Email address must be valid.');
			setFooterClass('grey');
			// Checks for invalid email
		} else if (email.match(reg) == null) {
			setEmailPasses(false);
			setFooterText('Email is not valid!');
			setFooterClass('red');
			// Checks if email is unique
		} else if (!isUnique) {
			setEmailPasses(false);
			setFooterText('Email is already taken!');
			setFooterClass('red');
			// Valid email
		} else {
			setEmailPasses(true);
			setFooterText('Email is good.');
			setFooterClass('');
		}
	};

	// Update email footer text, className, and emailPasses state upon email change
	useEffect(() => {
		updateStates();
	}, [email]);

	return (
		<div id="sign-up-email-footer" className={`${footerClass} sign-up-input-footer`}>
			{footerText}
		</div>
	);
};

export { EmailFooter };
