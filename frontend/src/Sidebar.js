import React, { useEffect, useState } from 'react';
import './Sidebar.css'
import SidebarChannel from './SidebarChannel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddIcon from '@mui/icons-material/Add';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';

const axios = require('axios').default;

function Sidebar({ 
    updateData,
    channels, setChannels, 
    selectedChannel, setSelectedChannel,
    setUser, user,
    serverInfo
  }) {
    
    // handles the expansion and collapse of channels in the sidebar
    let [expandIcons, setExpandIcons] = useState([true, true])
    function sidebarTopExpandIcon() {
      expandIcons[0]?(
        setExpandIcons(expandIcons = [false, expandIcons[1]])
      ):(
        setExpandIcons(expandIcons = [true, expandIcons[1]])
      )
    }
    
    function sidebarHeaderExpandIcon() {
      expandIcons[1]?(
        setExpandIcons(expandIcons = [expandIcons[0], false])
      ):(
        setExpandIcons(expandIcons = [expandIcons[0], true])
      )
    }

    // calls the updateData() function, every 2 seconds
    useEffect(() => {
      setTimeout(async () => {
        await updateData()
      }, 2000);
    })
    
    // gets the username and password from local storage
    let username = localStorage.getItem("user")
    let password = localStorage.getItem("pass")
    
    // handles add channel
    function handleAddChannel() {
      let input0 = prompt('ENTER VALUE TO BE ADDED:')    
      let input = {username: username, password: password, channelName: input0}

      if (input0) {
        if (channels.includes(input)) {
          alert('ELEMENT ALREADY EXISTS, PLEASE ENTER A NEW ELEMENT')
          handleAddChannel()
        } else {
          axios.post("/newChannel", input).then((result) => {
            if (!expandIcons[1]) {
              sidebarHeaderExpandIcon()              
            }
          })
        } 
      }       
    }

    return (
      <div className="sidebar">      
        <div className="sidebar__top" onClick={sidebarTopExpandIcon}>
          {serverInfo[0]?(<h1>{serverInfo[0].serverName}</h1>):(<h1>Loading...</h1>)}
            {expandIcons[0]?(
              <ExpandMoreIcon/>
            ):(
              <ExpandLessIcon/>
            )}
        </div>
        
        {expandIcons[0]?(
          <div className="sidebar__channels">
            <div className="sidebar__channelsHeader">
                <div className="sidebar__header" onClick={sidebarHeaderExpandIcon}>
                  {expandIcons[1]?(
                    <ExpandMoreIcon/>
                  ):(
                    <ExpandLessIcon/>
                  )}
                  <h4>Text Channels</h4>
                </div>
                
                <AddIcon onClick={handleAddChannel} className="sidebar__addChannel"/>
            </div>
            
            {expandIcons[1]?(
              <div className="sidebar__channelsList">
              {(channels.length > 0) ? (
                channels.map((channel) => (
                  <SidebarChannel id='{channel.id}' channelName={channel.channelName} selectedChannel={selectedChannel} setSelectedChannel={setSelectedChannel}/>
                ))
              ):(
                <p align="center">Click the plus(+) symbol to add more channels !</p>
              )}
            </div>
            ):(<></>)}
          </div>
        ):(<></>)}
        

        <div className="sidebar__bottom">
            <div className="sidebar__profile">
              <AccountCircleIcon fontSize="large" cursor="pointer"/>
              <div className="sidebar__profileInfo">
                <h3>@{user[0]}</h3>
                <p>#{user[1].substr(0, 14)}...</p>
              </div>
              <LogoutIcon 
                onClick={() => {
                  setUser([])
                  localStorage.clear()
                }} 
              className="chat__logout"/>
            </div>
          </div>
      </div>
    )
}

export default Sidebar