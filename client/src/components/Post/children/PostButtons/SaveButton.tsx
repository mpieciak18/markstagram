import { saveExists, addSave, removeSave } from '../../../../services/saves';
import { useState, useEffect } from 'react';
import SaveHollow from '../../../../assets/images/save.png';
import SaveSolid from '../../../../assets/images/save-solid.png';
import { useAuth } from '../../../../contexts/AuthContext';
import { Save } from '@markstagram/shared-types';
import { useLoading } from '../../../../contexts/LoaderContext';

const SaveButton = (props: {
  postId: number;
  postOwnerId: number;
  redirect: () => void;
}) => {
  const { user } = useAuth();
  const { postId, redirect } = props;
  const { setLoading } = useLoading();

  // Init save record state
  const [save, setSave] = useState<Save | null>(null);

  // Init isUpdating state
  const [isUpdating, setIsUpdating] = useState(false);

  // Init icon image source state
  const [img, setImg] = useState(SaveHollow);

  // Add or removes save from post
  const addRemoveSave = async () => {
    setIsUpdating(true);
    if (save === null) {
      const newSave = await addSave(postId);
      setSave(newSave);
      setImg(SaveSolid);
    } else {
      await removeSave(save.id);
      setSave(null);
      setImg(SaveHollow);
    }
    setIsUpdating(false);
  };

  // Calls addRemoveSave() if not already running
  const saveButtonFunction = () => {
    if (user == null) redirect();
    else if (isUpdating == false) addRemoveSave();
  };

  useEffect(() => {
    setLoading(true);
    saveExists(postId)
      .then((newSave) => {
        setSave(newSave);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (save) setImg(SaveSolid);
    else setImg(SaveHollow);
  }, [save]);

  return (
    <img
      className='post-save-button'
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
