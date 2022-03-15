import { checkForFollow, addFollow, removeFollow } from '../../firebase/followers.js'
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const FollowButton = (props) => {
    const { user, otherUserId } = props

    const navigate = useNavigate()

    const path = useLocation().path

    // Init states

    const [followingId, setFollowingId] = useState(null)

    const [isUpdating, setIsUpdating] = useState(false)

    const [followText, setFollowText] = useState('Follow')

    const [followButtonClass, setFollowButtonClass] = useState('inactive')

    // Update followingId on user prop change & on render
    useEffect(async () => {
        if (user == null) {
            setFollowingId(null)
        } else {
            const followId = await checkForFollow(otherUserId)
            setFollowingId(followId)
        }
    }, [user])

    // Update isUpdating, followText, & followButtonClass when followingId changes
    useEffect(async () => {
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
            setFollowButtonClass('inactive')
            setIsUpdating(true)
            const newId = await addFollow(otherUserId)
            setFollowingId(newId)
        } else if (isUpdating == false && followingId != null) {
            setFollowButtonClass('inactive')
            setIsUpdating(true)
            await removeFollow(followingId, otherUserId)
            setFollowingId(null)
        }
    }

    if (user.id == otherUserId) {
        return <div className={`follow-button inactive`}>This is you.</div>
    } else {
        return (
        <div className={`follow-button ${followButtonClass}`} onClick={clickFollow}>
            {followText}
        </div>
        )
    }
}

export { FollowButton }

// import { checkForFollow, addFollow, removeFollow } from '../../firebase/followers.js'
// import { useState, useEffect } from 'react'
// import { useNavigate, useLocation } from 'react-router-dom'
// import './other.css'

// const FollowButton = (props) => {
//     const { user, otherUserId } = props

//     const navigate = useNavigate()

//     const path = useLocation().path

//     // Init states

//     const [followingId, setFollowingId] = useState(null)

//     const [isUpdating, setIsUpdating] = useState(false)

//     const [followText, setFollowText] = useState('Follow')

//     const [followButtonClass, setFollowButtonClass] = useState('inactive')

//     // Update followingId on user prop change & on render
//     useEffect(async () => {
//         if (user == null) {
//             setFollowingId(null)
//         } else if (user.id == otherUserId) {
//             setFollowingId(null)
//         } else {
//             const followId = await checkForFollow(otherUserId)
//             setFollowingId(followId)
//         }
//     }, [user])

//     // Update isUpdating, followText, & followButtonClass when followingId changes
//     useEffect(async () => {
//         if (user.id == otherUserId) {
//             setFollowText('yourself')
//         } else if (followingId != null) {
//             setFollowText('Unfollow')
//         } else {
//             setFollowText('Follow')
//         }
//     }, [followingId])

//     // Change followButtonClass back to loaded when followText changes
//     useEffect(() => {
//         if (user.id == otherUserId) {
//             setFollowButtonClass('inactive')
//         } else {
//             setIsUpdating(false)
//             setFollowButtonClass('active')
//         }
//     }, [followText])

//     // User clicks on follow button & either follows or unfollows other user
//     const clickFollow = async () => {
//         if (user == null) {
//             navigate('/signup', {state: {path: path}})
//         } else if (user.id == otherUserId) {
//             return
//         } else if (isUpdating == false && followingId == null) {
//             setFollowButtonClass('inactive')
//             setIsUpdating(true)
//             const newId = await addFollow(otherUserId)
//             setFollowingId(newId)
//         } else if (isUpdating == false && followingId != null) {
//             setFollowButtonClass('inactive')
//             setIsUpdating(true)
//             await removeFollow(followingId, otherUserId)
//             setFollowingId(null)
//         }
//     }

//     return (
//         <div className={`follow-button ${followButtonClass}`} onClick={clickFollow}>
//             {followText}
//         </div>
//     )
// }

// export { FollowButton }