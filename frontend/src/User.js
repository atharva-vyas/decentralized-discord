import React from 'react'
import './User.css'
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

function User({ user }) {
  return (
    <>
        
        <div className="userSidebar__profile">
            <AccountCircleIcon fontSize="large" />
            <div className="userSidebar__profileInfo">
                {user.isAdmin?(
                    <>
                        <h4>{user.user}</h4>
                        <p>{'('}Admin{') '}#{user.publicKey.substr(0, 12)}...</p>
                    </>
                ):(
                    <>
                        <h4>{user.user}</h4>
                        <p>#{user.publicKey.substr(0, 12)}...</p>
                    </>
                )}
                
            </div>
        </div>
    </>
  )
}

export default User