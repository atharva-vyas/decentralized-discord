import React, { useEffect, useState } from 'react';
import UserSidebar from './UserSidebar';
import Sidebar from './Sidebar';
import Chat from './Chat';
import Login from './Login';
import './App.css';

const axios = require('axios').default;

function App() {
  // stores all the messages and channel data
  let [channels, setChannels] = useState([])
  // stores the channel that is currently selected by the user
  let [selectedChannel, setSelectedChannel] = useState("")
  // stores the user info like -> username, publicKey, etc.
  let [user, setUser] = useState([])
  // stores the server info like server name, server state, etc.
  let [serverInfo, setServerInfo] = useState([])
  // stores the list of all the info about all the users on a server
  let [userlist, setUserList] = useState([])

  // gets server info like server name
  useEffect(() => {
    axios.get('/state').then((result)  => {
      setServerInfo([result.data]);
    })
  }, [])
  
  // gets the server data
  function updateData() {
    new Promise(() => {
      axios.get("/getData").then((result) => {
        // updates user list
        setUserList(result.data.users)
        
        // pushes data to a temporary array
        const tempArr = []
        result.data.message.map((content) => (
          tempArr.push(content)
        ))
        
        // updates the setChannels state, which is responsible for storing all the server data like messages, channels, etc.
        setChannels(tempArr)
      })
    })
  }

  return (
    // checks if user info is present, if not it renders the Login.js page
    // if a user presents, then it renders the main Sidebar.js, Chat.js & UserSidebar.js
    (user.length===0)?(
      <Login setUser={setUser}/>
    ):(
      <div className="app">
        <Sidebar 
          updateData = {updateData}
          channels={channels} setChannels={setChannels} 
          selectedChannel={selectedChannel} setSelectedChannel={setSelectedChannel}
          setUser={setUser} user={user}
          serverInfo={serverInfo}
        />
        
        <Chat 
          selectedChannel={selectedChannel} channels={channels} setChannels={setChannels} 
          user={user}
        />

        <UserSidebar userlist={userlist}/>
      </div>
    )
  );
}

export default App;
