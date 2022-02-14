import { likeExists, addLike, removeLike } from '../../../../firebase/likes.js'
import LikeHollow from '../../../../assets/images/like.png'
import LikeSolid from '../../../../assets/images/like-solid.png'
import { useEffect, useState } from 'react'

const LikeButton = (props) => {
    const { user, postId, postOwnerId, redirect, setLikesNum, likesNum } = props

    const [likeId, setLikeId] = useState(null)

    const [isUpdating, setIsUpdating] = useState(false)

    const [imgSrc, setImgSrc] = useState(LikeHollow)

    useEffect(async () => {
        const id = await likeExists(postId, postOwnerId)
        setLikeId(id)
        if (id != null) {
            setImgSrc(LikeSolid)
        } else {
            setImgSrc(LikeHollow)
        }
    }, [])

    // Called on by likeButtonFunction and runs lbfIsRunning is false
    const addRemoveLike = async () => {
        // disable like button function while functions run
        setIsUpdating(true)
        // perform db updates & state changes
        if (likeId == null) {
            const id = await addLike(postId, postOwnerId)
            setLikeId(id)
            setImgSrc(LikeSolid)
            setLikesNum(likesNum + 1)
        } else {
            await removeLike(likeId, postId, postOwnerId)
            setLikeId(null)
            setImgSrc(LikeHollow)
            setLikesNum(likesNum - 1)
        }
        // enable like button once everything is done
        setIsUpdating(false)
    }

    // Runs when like button is clicked and calls addRemoveLike() when lbfIsrunning is false
    const likeButtonFunction = () => {
        if (user == null) {
            console.log(user)
            redirect()
        } else if (isUpdating == false && user != null) {
            addRemoveLike()
        }
    }

    return <img className="post-like-button" src={imgSrc} onClick={likeButtonFunction} />
}

export { LikeButton }