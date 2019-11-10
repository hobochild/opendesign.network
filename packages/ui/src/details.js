import React from 'react'
import useSWR from 'swr'
import { fetcher } from './utils'
import { Link } from 'wouter'

export default ({ nodeId }) => {
  const { data, error } = useSWR(`/node/${nodeId}`, fetcher)

  if (error) return <div>failed to load, {error.message}</div>
  if (!data) return <div>loading...</div>

  return (
    <div style={{ paddingLeft: '50px', paddingTop: '50px' }}>
      <h2>{data.title}</h2>
      <Link to={`/node/${nodeId}/fork`}>Fork</Link>
      <p>url: {atob(nodeId)}</p>
      {data.prev && (
        <p>
          Fork of <Link to={`/node/${data.prev}`}>{atob(data.prev)}</Link>
        </p>
      )}
      <p>is verified: {data.isVerified ? 'yes' : 'no'} </p>
      <p>last verified: {String(new Date(data.lastVerified))}</p>
      <p>details: {data.description}</p>
      <Link to={`/node/${nodeId}/snippet`}>
        <p>Snippet</p>
      </Link>
    </div>
  )
}
