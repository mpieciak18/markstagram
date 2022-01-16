import '.../styles/components/Profile/ProfileCard.css'

const ProfileCard = async (props) => {
    const { user } = props

    return (
        <div id='profile-card'>
            <img id='profile-card-icon' src={user.image} />
            <div id='profile-card-name'>{user.name}</div>
            <div id='profile-card-username'>{user.username}</div>
            <div id='profile-card-stats'>
                <div id='profile-card-posts'>{user.posts}</div>
                <div id='profile-card-following'>{user.following}</div>
                <div id='profile-card-followers'>{user.followers}</div>
            </div>
            <div id='profile-card-bio'>{user.bio}</div>
        </div>
    )
}

export { ProfileCard }