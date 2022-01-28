import '../styles/pages/Settings.css'
import { Link } from 'react-router-dom'
import { updateUser } from '../firebase/users.js'
import { useLocation, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { NameFooter } from '../components/Settings/NameFooter.js'
import { ImageInput } from '../components/Settings/ImageInput.js'

const Settings = (props) => {
    // Redirect to signup page if not signed in
    const { user } = props
    if (user.loggedIn == false) {
        const path = useLocation().pathname
        return <Navigate to='/signup' state={{path: path}} />
    }

    const [file, setFile] = useState(null)

    // Updates user's settings with form values
    const updateSettings = async (e) => {
        e.preventDefault()
        // Check validation first
        if (namePasses == true) {
            let image
            if (file == null) {
                image = user.image
            } else {
                image = file.name
                await uploadFile('images', file)
            }
            const possibleError = await updateUser(
                image,
                e.target.name.value,
                e.target.username.value,
                e.target.bio.value
            )
            if (possibleError == null) {
                // Redirect to own profile upon successful settings update
                return <Navigate to={`/${user.id}`} />
            } else {
                setErrorClass('visible')
                setTimeout(() => {setErrorClass('hidden')}, 2000)
            }
        }
    }
    
    // Display error upon unsuccessful settings update
    const [errorClass, setErrorClass] = useState('hidden')

    const errorMessage = (
        <div id='settings-error' className={errorClass}>
            There was an error! Please try again.
        </div>
    )

    // Display pop-up upon new user registration
    const [welcomeOn, setWelcomeOn] = useState(false)

    const welcomeMessage = () => {
        if (welcomeOn == true) {
            return (
                <div id='settings-welcome'>
                    You've successfully registered! Please update your bio and image.
                </div>
            )
        } else {
            return null
        }
    }

    const newSignUp = useLocation().state.newSignUp || false

    if (newSignUp == true) {
        setWelcomeOn(true)
        setTimeout(() => {setWelcomeOn(false)}, 2000)
    }

    // Allow form to submit if name input is valid
    const [namePasses, setNamePasses] = useState(true)

    const [name, setName] = useState(user.name)

    const updateName = (e) => setName(e.target.value)

    const [formButton, setFormButton] = useState("submit")

    useEffect(() => {
        if (namePasses == true) {
            setFormButton('submit')
        } else {
            setFormButton('button')
        }
    }, namePasses)

    return (
        <div id='settings' className='page'>
            {welcomeMessage}
            <div id='settings-parent'>
                <form id='settings-form' onSubmit={updateSettings}>
                    {errorMessage}
                    <div id='settings-header'>
                        <div id='settings-title'>Settings</div>
                        <img id='settings-image'/>
                    </div>
                    <ImageInput user={user} setFile={setFile} />
                    <div id='settings-image-footer'>File size limit: 5 mb</div>
                    <label id='settings-name-label' for='name'>Your Name:</label>
                    <input id='settings-name-input' name='name' type='text' value={user.name}></input>
                    <NameFooter setNamePasses={setNamePasses} name={name} updateName={updateName} />
                    <label id='settings-bio-label' for='bio'>Your Bio:</label>
                    <textarea id='settings-bio-input' name='bio' type='text' value={user.bio} maxLength='150' />
                    <div id='settings-buttons'>
                        <Link to={`/profile/${user.id}`}>
                            <button id='settings-form-back' type='button'>Back to Profile</button>
                        </Link>
                        <button id='settings-form-submit' type={formButton} className={formButton}>Update Settings</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export { Settings }