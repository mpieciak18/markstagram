import { timeSinceTrunc } from '../../../other/timeSinceTrunc.js'
import { getUrl } from '../../../firebase/storage.js'
import { useNavigate } from 'react-router-dom'

// Component list all available convos in a user's messages
const ConvosList = (props) => {
    const { user, convosArr } = props

    const navigate = useNavigate()

    // Redirect to inidividual conversation page
    const redirect = (userId) => {
        return navigate(`/messages/${userId}`)
    }

    // Renders individual convo preview
    const convoPreview = (otherUserId, lastMessage) => {
        const time = timeSinceTrunc(lastMessage.data.date)
        const message = lastMessage.data.message

        return (
            <div className='convo-preview-block' onClick={() => redirect(otherUserId)}>
                <img className='convo-preview-left' />
                <div className='convo-preview-right'>
                    <div className='convo-preview-name'></div>
                    <div className='convo-preview-right-bottom'>
                        <div className='convo-preview-text'>{message}</div>
                        <div className='convo-preview-date'>{time}</div>
                    </div>
                </div>
            </div>
        )
    }

    // Renders each convo preview
    const allConvosList = (
        <div id='convos-list-bottom'>
            {convosArr.map((convo) => convoPreview(convo.id, convo.lastMessage))}
        </div>
    )

    const userIcon = async () => {
        return await getUrl(user.data.image)
    }

    return (
        <div id="convos-list">
            <div id='convos-list-top'>
                <img id='convos-list-user-icon' src={`/${userIcon()}`} />
                <div id='convos-list-top-title'>
                    Messages
                </div>
                <img id='convos-list-message-icon' />
            </div>
            {allConvosList}
        </div>
    )
}

export { ConvosList }