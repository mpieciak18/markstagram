import { Navigate, useParams } from 'react-router-dom'
import '../styles/pages/Conversation.css'
import { sendMessage, retrieveSingleConvo } from '../firebase/messages.js'

const Conversation = (props) => {
    const { user } = props

    // Grab other user's id from url parameters
    const { userId } = useParams()

    // Add new message to specific convo in db
    const sendNewMessage = async (event) => {
        event.preventDefault()
        const message = event.target.message
        if (message.length > 0) {
            await sendMessage(message, userId)
        }
    }

    // Redirect back to messages page
    const redirect = () => {
        return <Navigate to='/messages' />
    }

    // Retrieve all messages in conversation
    const messages = retrieveSingleConvo(userId)

    return (
        <div id="conversation" className='page'>
            <div id="convo-back-button" onClick={redirect}>
                <div id='convo-back-arrow'>⇽</div>
                <div id='convo-back-text'>Back to Messages</div>
            </div>
            <div id="convo-messages">
                {messages.map((message) => {
                    return (
                        <MessageBlock user={user} messageData={message.data} />
                    )
                })}
            </div>
            <form class="convo-message-bar" onSubmit={sendNewMessage}>
                <input type="text" name="message" class="convo-message-bar-input" placeholder="Send a message..." />
                <button type="submit" class="convo-message-button">
                    <img class="convo-message-button-icon" />
                </button>
            </form>
        </div>
    )
}

export { Conversation }