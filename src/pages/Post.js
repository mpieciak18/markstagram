import '../styles/Post.css'
import { useParams } from 'react-router-dom'
import { SinglePost } from '../components/SinglePost.js'
import { findSinglePost } from '../firebase/posts.js'
import { Navbar } from '../components/Navbar.js'

const Post = (props) => {
    const [user] = props

    // Extract post id from url parameters
    const { postOwnerId, postId } = useParams()

    // Get post data from database
    const post = findSinglePost(postId, postOwnerId)

    const BackButton = (
        <div id='post-back-button'>
            <div id='back-arrow'>⇽</div>
            <div id='back-text'>Back to Profile</div>
        </div>
    )

    return (
        <div id="post" class="page">
            <Navbar user={user} />
            {BackButton}
            <SinglePost 
                page="true" 
                id={postId}
                text={post.data.text}
                image={post.data.image}
                date={post.data.date}
                postOwnerId={postOwnerId}
                likes={post.data.likes}
                user={user}
            />
        </div>
    )
}

export { Post }