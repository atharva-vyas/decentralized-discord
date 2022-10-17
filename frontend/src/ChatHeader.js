import React from 'react'
import './ChatHeader.css'

function ChatHeader({ channelName }) {
  return (
    <div className="chatHeader">
        <div className="chatHeader__left">
            <h3>
                {channelName ? (
                  <span className="chatHeader__hash">#</span>
                ):(<></>)}
                
                {channelName}
            </h3>
        </div>
    </div>
  )
}

export default ChatHeader