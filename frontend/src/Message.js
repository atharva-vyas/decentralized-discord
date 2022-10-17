import React from 'react'
import './Message.css'

import AccountCircleIcon from '@mui/icons-material/AccountCircle';

function Message({ user, date, msg }) {
  return (
    <div className="message">
        <AccountCircleIcon fontSize="large" />
        <div className="message__info">
            <h4>{user}
                <span className="message__timestamp">{date}</span>
            </h4>

            <p>{msg}</p>
        </div>
    </div>
  )
}

export default Message