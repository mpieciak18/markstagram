import '../styles/Home.css'
import { findPosts } from '../firebase/posts.js'
import { Navbar } from '../components/Navbar.js'
import { Post } from '../components/Post.js'
import { UserCard } from '../components/UserCard.js'
import { useEffect } from 'react'

const Home = async (props) => {
    const { user } = props

    // Init postsNumber state
    const [postsNumber, setPostsNumber] = await useState(10)

    // Init posts state
    const postsArr = await findPosts(postsNumber)
    const [posts, setPosts] = useState(postsArr)

    // Load-more function that updates the posts reel
    const loadMore = () => {
        const newPostsNumber = postsNumber + 10
        setPostsNumber(newPostsNumber)
    }

    // Load More button
    const LoadButton = (
        <div id='load-more-button' onClick={loadMore}>Load More</div>
    )

    // Update posts state when postsNumber state changes
    useEffect(async () => {
        const newPostsArr = await findPosts(postsNumber)
        setPosts(newPostsArr)
    }, postsNumber)

    const Posts = (
        <div id='home-posts'>
            {posts.map((post) => {
                return (
                    <Post 
                        id={post.id}
                        text={post.data.text}
                        image={post.data.image}
                        date={post.data.date}
                        postOwnerId={post.data.user}
                        likes={post.data.likes}
                        user={user}
                    />
                )
            })}
        </div>
    )

    return (
        <div id='home' class='page'>
            <Navbar user={user} />
            <UserCard user={user} />
            {Posts}
            {LoadButton}
        </div>
    )
}

export {Home}