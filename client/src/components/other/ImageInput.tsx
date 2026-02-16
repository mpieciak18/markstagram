import { useState, SetStateAction } from 'react';

const ImageInput = (props: {
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
  setFile: React.Dispatch<SetStateAction<File | null>>;
  setErrorClass: React.Dispatch<SetStateAction<string>>;
}) => {
  const { inputRef, setFile, setErrorClass } = props;

  const [filePreviewUrl, setFilePreviewUrl] = useState<string>();

  const [overlayClass, setOverlayClass] = useState('inactive');

  const maxFileSize = 20 * 1024 * 1024; // 10 MB

  // Returns true if passed file is an image
  const isImage = (file: File) => {
    const validTypes = ['image/avif', 'image/png', 'image/jpeg', 'image/webp'];
    if (validTypes.includes(file.type)) {
      return true;
    } else {
      return false;
    }
  };

  // Runs when user selects image to upload
  const validateImage = async () => {
    try {
      if (!inputRef.current?.files) {
        throw new Error();
      } else if (
        inputRef.current.files[0].size > maxFileSize ||
        isImage(inputRef.current.files[0]) == false
      ) {
        throw new Error();
      } else {
        setFile(inputRef.current.files[0]);
        setFilePreviewUrl(URL.createObjectURL(inputRef.current.files[0]));
      }
    } catch (e) {
      if (inputRef.current) inputRef.current.value = '';
      setFile(null);
      setFilePreviewUrl(undefined);
      setErrorClass('active');
      setTimeout(() => {
        setErrorClass('inactive');
      }, 2000);
    }
  };

  return (
    <div
      id='new-post-image-input-parent'
      onPointerDown={() => setOverlayClass('active')}
      onPointerUp={() => setOverlayClass('inactive')}
      onMouseOver={() => setOverlayClass('active')}
      onMouseOut={() => setOverlayClass('inactive')}
    >
      <label id='new-post-image-footer' htmlFor='image'>
        File size limit: 5 mb
      </label>
      <input
        ref={inputRef}
        type='file'
        id='new-post-image-input'
        name='image'
        onChange={validateImage}
        onMouseDown={() => setOverlayClass('active')}
        onMouseUp={() => setOverlayClass('inactive')}
        onMouseOver={() => setOverlayClass('active')}
        onMouseOut={() => setOverlayClass('inactive')}
      />
      {filePreviewUrl ? (
        <img id='new-post-image-preview' src={filePreviewUrl} />
      ) : (
        <div id='new-post-image-preview' />
      )}
      <div id='new-post-image-overlay' className={overlayClass} />
    </div>
  );
};

export { ImageInput };
