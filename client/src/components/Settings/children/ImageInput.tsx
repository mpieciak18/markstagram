import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

const ImageInput = (props: {
	setFile: React.Dispatch<React.SetStateAction<File | null>>;
	setErrorClass: React.Dispatch<React.SetStateAction<string>>;
	inputRef: React.MutableRefObject<HTMLInputElement | null>;
}) => {
	const { user } = useAuth();
	const { setFile, setErrorClass, inputRef } = props;

	const [filePreviewUrl, setFilePreviewUrl] = useState<string | undefined>(undefined);

	const [overlayClass, setOverlayClass] = useState('inactive');

	const maxFileSize = 10 * 1024 * 1024; // 5 MB

	// Returns true if passed file is an image
	const isImage = (file: File) => {
		const validTypes = ['image/png', 'image/jpg', 'image/jpeg'];
		if (validTypes.includes(file.type)) {
			return true;
		}
		return false;
	};

	// Runs when user selects image to upload
	const validateImage = async () => {
		try {
			if (!inputRef.current?.files) {
				throw new Error();
			}
			if (
				inputRef.current.files[0].size > maxFileSize ||
				isImage(inputRef.current.files[0]) === false
			) {
				throw new Error();
			}
			setFile(inputRef.current.files[0]);
			setFilePreviewUrl(URL.createObjectURL(inputRef.current.files[0]));
		} catch (e) {
			if (inputRef?.current) inputRef.current.value = '';
			setFile(null);
			setFilePreviewUrl(user?.image ? user.image : undefined);
			setErrorClass('active');
			setTimeout(() => {
				setErrorClass('inactive');
			}, 2000);
		}
	};

	useEffect(() => {
		setFilePreviewUrl(user?.image ? user.image : undefined);
	}, [user]);

	return (
		<div
			id="settings-image-input-parent"
			onPointerDown={() => setOverlayClass('active')}
			onPointerUp={() => setOverlayClass('inactive')}
			onMouseOver={() => setOverlayClass('active')}
			onMouseOut={() => setOverlayClass('inactive')}
		>
			{/* Image Input */}
			<input
				ref={inputRef}
				type="file"
				id="settings-image-input"
				name="image"
				onChange={validateImage}
				onMouseDown={() => setOverlayClass('active')}
				onMouseUp={() => setOverlayClass('inactive')}
				onMouseOver={() => setOverlayClass('active')}
				onMouseOut={() => setOverlayClass('inactive')}
			/>
			{/* File Preview */}
			<img id="settings-image-preview" src={filePreviewUrl} />,
			<div id="settings-image-overlay" className={overlayClass} />
		</div>
	);
};

export { ImageInput };
