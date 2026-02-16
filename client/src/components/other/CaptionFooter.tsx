import { useState, useEffect, SetStateAction } from 'react';

const CaptionFooter = (props: {
  caption: string;
  setCaptionPasses: React.Dispatch<SetStateAction<boolean>>;
}) => {
  const { setCaptionPasses, caption } = props;
  const [footerText, setFooterText] = useState('Caption cannot be empty.');
  const [footerClass, setFooterClass] = useState('grey');

  // Update caption footer text, className, and captionPasses state upon caption change
  useEffect(() => {
    // Check if no caption is entered
    if (caption.match(/^.{0,0}$/) != null) {
      setCaptionPasses(false);
      setFooterText('Caption cannot be empty.');
      setFooterClass('grey');
    }
    // Check if caption is greater than 120 characters
    else if (caption.match(/^.{121,}$/) != null) {
      setCaptionPasses(false);
      setFooterText('Caption is too long!');
      setFooterClass('red');
    }
    // Caption passes
    else {
      setCaptionPasses(true);
      setFooterText('Valid caption! :-)');
      setFooterClass('grey');
    }
  }, [caption]);

  return (
    <div id='new-post-caption-footer' className={footerClass}>
      {footerText}
    </div>
  );
};

export { CaptionFooter };
