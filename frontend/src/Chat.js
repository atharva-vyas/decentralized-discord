import React from 'react'
import ChatHeader from './ChatHeader'
import Message from "./Message";
import './Chat.css'

import AddCircleIcon from '@mui/icons-material/AddCircle';
import AddReactionIcon from '@mui/icons-material/AddReaction';
import GifIcon from '@mui/icons-material/Gif';
import { useState, useEffect } from "react";

const axios = require('axios').default;


function Chat({
        selectedChannel, 
        channels, setChannels,
        user
    }) {
    // responsible for storing the chat input data
    const [input, setInput] = useState("")
    // stores all the messages of the selected channel
    let [messages, setMessages] = useState([])

    // updates the messages depeding on the channel selected
    useEffect(() => {
        // loops through all the channel names
        for (let index = 0; index < channels.length; index++) {
            // checks if channel name is equal to the selected channel
            if (channels[index].channelName === selectedChannel) (
                // if the channel name and selected channel is same, then it updates the setMessages() state
                setMessages(channels[index].data)
            )
        }
    })

    // gets executed when a new message is sent
    function handleAddMessage() {
        if (input) {
            for (let index = 0; index < channels.length; index++) {
                if (channels[index].channelName === selectedChannel) {
                    let username = localStorage.getItem("user")
                    let password = localStorage.getItem("pass")

                    axios.post('/newMessage', { 
                        channel: selectedChannel, 
                        msg: input, 
                        username: username, 
                        password: password
                    }).then((result) => {
                        setInput("")
                    })
                }
            }
        }        
    }

    return (
        <div className="chat">
            <ChatHeader channelName={selectedChannel} />

            <div className="chat__messages">
                {selectedChannel ? (
                    messages.map((msg) => (
                        <Message user={msg.user} date={msg.date} msg={msg.msg} />
                    ))
                ) : (
                    <h2 align="center">
                        Nothing to see here !
                    </h2>
                )}
            </div>

            <div className="chat__input">
                <AddCircleIcon fontSize="large"/>
                <form onSubmit={(e) => {e.preventDefault()}}>
                    <input className="chat__mainTextFeild" disabled={!selectedChannel} value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Message #${selectedChannel}`} />
                    <button className="chat__inputButton" type="submit" onClick={handleAddMessage}>
                        Send Message
                    </button>
                </form>

                <div className="chat__inputIcons">
                    <GifIcon fontSize="large"/>
                    <AddReactionIcon fontSize="large"/>
                </div>
            </div>
        </div>
    )
}

export default Chat