import { useState } from "react"
import ShareIcon from '../../../../assets/images/messages.png'

const ShareButton = () => {

    const shareButtonFunction = () => {
        const url = window.location.href
        navigator.clipboard.writeText(url)
        setPopUpClass("post-share-button-pop-up visible")
        setTimeout(() => {setPopUpClass("post-share-button-pop-up hidden")}, 1500)
    }

    const [popUpClass, setPopUpClass] = useState("post-share-button-pop-up hidden")

    return (
        <div className="post-share-button" onClick={shareButtonFunction}>
            <img className="post-share-button-image" src={ShareIcon} />
            <div className={popUpClass}>Link Copied!</div>
        </div>
    )
}

export { ShareButton }