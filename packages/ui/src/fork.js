import React, { useRef } from 'react'
import { useLocation } from 'wouter'
import { fetcher } from './utils'

const createNode = (url, prev) => {
  return fetcher(`/node`, {
    method: 'POST',
    body: JSON.stringify({ url, prev }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

export default ({ nodeId }) => {
  // eslint-disable-next-line
  const [location, setLocation] = useLocation()
  const inputRef = useRef()

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center'
      }}
    >
      <div>
        {nodeId && <div>forking {atob(nodeId)}</div>}
        <p> Add your url here: </p>
        <form
          onSubmit={async event => {
            event.preventDefault()
            const newNode = await createNode(inputRef.current.value, nodeId)
            setLocation(`/node/${newNode.id}/snippet`)
          }}
        >
          <input ref={inputRef} type="url" name="name" placeholder="http://" />
          <input type="submit" value={nodeId ? 'fork' : 'create'} />
        </form>
      </div>
    </div>
  )
}
