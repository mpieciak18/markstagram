import { useState, useEffect } from 'react';

const PasswordFooter = (props: {
  setPasswordPasses: React.Dispatch<React.SetStateAction<boolean>>;
  password: string;
}) => {
  const { setPasswordPasses, password } = props;
  const [footerText, setFooterText] = useState(
    'Must contain >8 characters, 1+ uppercase letter, 1+ lowercase letter, and 1+ number.',
  );
  const [footerClass, setFooterClass] = useState('grey');

  // Update password footer text, className, and passwordPasses state upon password change
  useEffect(() => {
    // Checks if no password is entered
    if (password.length == 0) {
      setPasswordPasses(false);
      setFooterText(
        'Must contain 8+ characters, 1+ uppercase letter, 1+ lowercase letter, and 1+ number.',
      );
      setFooterClass('grey');
      // Checks for minimum length of 8
    } else if (password.match(/^.{0,7}$/) != null) {
      setPasswordPasses(false);
      setFooterText('Password is too short!');
      setFooterClass('red');
      // Checks for at least one uppercase letter
    } else if (password.match(/^[^A-Z]*$/) != null) {
      setPasswordPasses(false);
      setFooterText('Password needs an uppercase letter!');
      setFooterClass('red');
      // Checks for at least one lowercase letter
    } else if (password.match(/^[^a-z]*$/) != null) {
      setPasswordPasses(false);
      setFooterText('Password needs a lowercase letter!');
      setFooterClass('red');
      // Checks for at least one number
    } else if (password.match(/^[^0-9]*$/) != null) {
      setPasswordPasses(false);
      setFooterText('Password needs a number!');
      setFooterClass('red');
    } else {
      setPasswordPasses(true);
      setFooterText('Password is good.');
      setFooterClass('');
    }
  }, [password]);

  return (
    <div
      id='sign-up-password-footer'
      className={`${footerClass} sign-up-input-footer`}
    >
      {footerText}
    </div>
  );
};

export { PasswordFooter };
