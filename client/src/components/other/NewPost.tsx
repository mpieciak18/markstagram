import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { newPost } from '../../services/posts';
import { ImageInput } from './ImageInput';
import { CaptionFooter } from './CaptionFooter';
import { useAuth } from '../../contexts/AuthContext';
import { usePopUp } from '../../contexts/PopUpContext';
import { setLocalUser } from '../../services/localstor';
import { useLoading } from '../../contexts/LoaderContext';

const NewPost = () => {
  const { user, setUser } = useAuth();
  const { updatePopUp } = usePopUp();
  const { setLoading } = useLoading();

  // Init useNavigate function
  const navigate = useNavigate();

  // Init useParams
  const location = useParams();

  // Init ref for ImageInput component
  const inputRef = useRef<HTMLInputElement>(null);

  // Init file state
  const [file, setFile] = useState<File | null>(null);

  // Init caption field value form validation state
  const [captionPasses, setCaptionPasses] = useState(false);

  // Init name field value state
  const [caption, setCaption] = useState('');

  // OnChange event handler for for bio field on form
  const updateCaption = (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setCaption(e.target.value);

  // Init error message class state
  const [errorClass, setErrorClass] = useState('inactive');

  // Init form button type state
  const [button, setButton] = useState<'submit' | 'button'>('submit');

  // Init form buttonc class state
  const [buttonClass, setButtonClass] = useState('active');

  // Upload file to storage & add new post to firebase
  const addPost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Check validation first
    if (captionPasses && file) {
      setLoading(true);
      // Check for possible error with adding post to DB
      try {
        const post = await newPost(caption, file);
        if (post?.id) {
          if (user) {
            const updatedUser = {
              ...user,
              _count: {
                ...user._count,
                posts: user._count.posts + 1,
              },
            };
            setUser(updatedUser);
            setLocalUser(updatedUser);
          }
          updatePopUp();
          if (location.postOwnerId == null) {
            setLoading(false);
            navigate(`/${user?.id}/${post.id}`);
          } else {
            setLoading(false);
            navigate(`/${user?.id}/${post.id}`);
            window.location.reload();
          }
        } else {
          throw new Error();
        }
      } catch (e) {
        setLoading(false);
        setErrorClass('active');
        setTimeout(() => {
          setErrorClass('inactive');
        }, 2000);
      }
    }
  };

  // Closes newPost
  const xButtonClick = () => updatePopUp();

  // Update button & button class
  useEffect(() => {
    if (file == null || captionPasses == false) {
      setButton('button');
      setButtonClass('inactive');
    } else {
      setButton('submit');
      setButtonClass('active');
    }
  }, [file, captionPasses]);

  return (
    <div id='new-post'>
      <div id='new-post-parent'>
        <div id='new-post-error' className={errorClass}>
          <p>There was an error!</p>
          <p>Please try again.</p>
        </div>
        <div id='new-post-header'>
          <div id='new-post-x-button' onClick={xButtonClick}>
            ✕ Cancel
          </div>
          <div id='new-post-title'>New Post</div>
          <div id='new-post-x-button-hidden'>✕ Cancel</div>
        </div>
        <div id='new-post-divider' />
        <form id='new-post-form' onSubmit={addPost}>
          <ImageInput
            inputRef={inputRef}
            setFile={setFile}
            setErrorClass={setErrorClass}
          />
          <div id='new-post-caption-parent'>
            <textarea
              id='new-post-caption-input'
              name='caption'
              placeholder='Enter a caption...'
              value={caption}
              onChange={updateCaption}
            />
            <CaptionFooter
              caption={caption}
              setCaptionPasses={setCaptionPasses}
            />
          </div>
          <button type={button} id='new-post-button' className={buttonClass}>
            Upload New Post
          </button>
        </form>
      </div>
    </div>
  );
};

export { NewPost };
