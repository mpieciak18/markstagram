import { useEffect, useState } from 'react';
import SaveSolid from '../../../../assets/images/save-solid.png';
import SaveHollow from '../../../../assets/images/save.png';
import { useAuth } from '../../../../contexts/AuthContext';
import { useSaveExists, useAddSave, useRemoveSave } from '../../../../queries/useSaveQueries';

const SaveButton = (props: {
	postId: number;
	postOwnerId: number;
	redirect: () => void;
}) => {
	const { user } = useAuth();
	const { postId, redirect } = props;

	const { data: save = null } = useSaveExists(postId);
	const addSaveMutation = useAddSave(postId);
	const removeSaveMutation = useRemoveSave(postId);

	const isUpdating = addSaveMutation.isPending || removeSaveMutation.isPending;

	const [img, setImg] = useState(SaveHollow);

	useEffect(() => {
		if (save) setImg(SaveSolid);
		else setImg(SaveHollow);
	}, [save]);

	const addRemoveSave = async () => {
		if (save === null) {
			await addSaveMutation.mutateAsync();
			setImg(SaveSolid);
		} else {
			await removeSaveMutation.mutateAsync(save.id);
			setImg(SaveHollow);
		}
	};

	const saveButtonFunction = () => {
		if (user == null) redirect();
		else if (!isUpdating) addRemoveSave();
	};

	return (
		<img
			className="post-save-button"
			src={img}
			onClick={saveButtonFunction}
			onMouseDown={() => {
				if (save) setImg(SaveHollow);
				else setImg(SaveSolid);
			}}
			onMouseUp={() => {
				if (save) setImg(SaveSolid);
				else setImg(SaveHollow);
			}}
			onMouseOver={() => {
				if (save) setImg(SaveHollow);
				else setImg(SaveSolid);
			}}
			onMouseOut={() => {
				if (save) setImg(SaveSolid);
				else setImg(SaveHollow);
			}}
		/>
	);
};

export { SaveButton };
