import { checkForFollow, addFollow, removeFollow } from '../../firebase/followers.js'
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './other.css'

const FollowButton = (props) => {
    const { user, otherUserId, numFollowers, setNumFollowers } = props

    const navigate = useNavigate()

    const path = useLocation().path

    // Init states

    const [followingId, setFollowingId] = useState(null)

    const [isUpdating, setIsUpdating] = useState(false)

    const [followText, setFollowText] = useState('Follow')

    const [followButtonClass, setFollowButtonClass] = useState('inactive')

    // Update followingId on user prop change & on render
    useEffect(async () => {
        if (user != null) {
            const followId = await checkForFollow(otherUserId)
            setFollowingId(followId)
        } else {
            setFollowingId(null)
        }
    }, [user])

    // Update isUpdating, followText, & followButtonClass when followingId changes
    useEffect(async () => {
        setIsUpdating(true)
        setFollowButtonClass('inactive')
        if (followingId != null) {
            setFollowText('Unfollow')
        } else {
            setFollowText('Follow')
        }
    }, [followingId])

    // Change followButtonClass back to loaded when followText changes
    useEffect(() => {
        setIsUpdating(false)
        setFollowButtonClass('active')
    }, [followText])

    // User clicks on follow button & either follows or unfollows other user
    const clickFollow = async () => {
        if (user == null) {
            navigate('/signup', {state: {path: path}})
        } else if (isUpdating == false && followingId == null) {
            const newId = await addFollow(otherUserId)
            setFollowingId(newId)
            // const newNum = numFollowers + 1
            // await setNumFollowers(newNum)
        } else if (isUpdating == false && followingId != null) {
            await removeFollow(followingId, otherUserId)
            setFollowingId(null)
            // const newNum = numFollowers - 1
            // await setNumFollowers(newNum)
        }
    }

    return (
        <div className={`follow-button ${followButtonClass}`} onClick={clickFollow}>
            {followText}
        </div>
    )
}

export { FollowButton }