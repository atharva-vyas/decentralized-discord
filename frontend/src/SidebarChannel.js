import React from 'react'
import "./SidebarChannel.css"

function SidebarChannel({ id, channelName, selectedChannel, setSelectedChannel }) {
  
  return (
    
    <div className="sidebarChannel" onClick={() => {
      setSelectedChannel(selectedChannel = channelName)
    }}>

      <h4>
        <span className="sidebarChannel__hash">#</span>
        {channelName}
      </h4>
    </div>
  )
}

export default SidebarChannel