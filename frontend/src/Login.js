import React, { useEffect, useState } from 'react';
import './Login.css'

const axios = require('axios').default;

function Login({ setUser }) {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")

    useEffect(() => {
        // checks if uasername and password exists on the browser
        if (localStorage.getItem("user") && localStorage.getItem("pass")) {
            let username = localStorage.getItem("user")
            let password = localStorage.getItem("pass")

            // if username & password exists, then we check if they are still valid
            axios.post('/login', { user: username, pass: password }).then((result) => {
                // if the username and password are valid, then we updates the setUser() state
                setUser([result.data.message[0].user, result.data.message[0].publicKey, result.data.message[0].img])
            }).catch((err) => {
                // if the username and password are not valid, then we clear the local storage and ask the user to login again
                localStorage.clear()
                alert('An error Occureed please login again')
            })
        }
    }, [])
    
    let submittedCreds = false
    // handles the user login
    function login() {
        // checks if username & password are not empty
        if (username.length != 0 && password.length != 0 && !submittedCreds) {
            // logs in with the username and password provided, and if the login is successful then it stores the credentials locally on the browser
            axios.post('/login', { user: username, pass: password }).then((result) => {
                if (result.data.message[0].user && result.data.message[0].publicKey && result.data.message[0].img) {
                    localStorage.clear()
                    localStorage.setItem('user', username);
                    localStorage.setItem('pass', password);
                    // updates the user state
                    setUser([result.data.message[0].user, result.data.message[0].publicKey, result.data.message[0].img])
                    submittedCreds = true
                
                    setUser([result.data.message[0].user, result.data.message[0].publicKey, result.data.message[0].img])
                }
        }).catch((err) =>{
                // if the login fails, then we clear the local storage and ask the user to login again
                localStorage.clear()
                console.log('Error');
            })
        } else {}
    }

    // background video, that plays in the background
    const video = "videoplayback.webm"

    return (
        <div>
            <div class="vid-container">
                <video class="bgvid" autoplay="autoPlay" muted="muted" preload="auto" loop>
                    <source src={video} type="video/webm" />
                </video>
                
                <div class="inner-container">
                    <video class="bgvid inner" autoPlay="autoPlay" muted="muted" preload="auto" loop>
                        <source src={video} type="video/webm" />
                    </video>
                    <form onSubmit={(e) => {e.preventDefault()}}>
                        <div class="box">
                            <h1>Login | Sign Up</h1>
                            <input value="http://192.168.2.10:3003" type="text" placeholder="Server Link"/>
                            <input value={username} onChange={(e) => setUsername(e.target.value)} type="username" placeholder="Username"/>
                            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password"/>
                            <button onClick={login} type="submit"> Login/Sign Up </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )

}

export default Login