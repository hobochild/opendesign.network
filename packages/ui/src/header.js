import React from 'react'
import { Link } from 'wouter'
export default () => {
  return (
    <div
      style={{
        height: '10vh',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
      }}>
      <Link to="/">
        <h2>The Open Design Network</h2>
      </Link>
      <Link to="/start">Create</Link>
    </div>
  )
}
