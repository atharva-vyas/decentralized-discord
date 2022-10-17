import React from 'react'
import './UserSidebar.css'
import User from './User';

function UserSidebar({ userlist }) {
  return (
    <>
      {userlist.length>0?(
        <div className="user__sidebar">
          <div className="userSidebar__usersHeader">
            <h3>Users</h3>
          </div>
          {userlist.map((users) => (
            <User user={users}/>
          ))}
        </div>
      ):(
        <div className="user__sidebar">
          <div className="userSidebar__usersHeader">
            <h3>Users</h3>
          </div>
          <h3 align="center">loading...</h3>        
        </div>
      )}
    </>
  )
}

export default UserSidebar