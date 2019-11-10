import React from 'react'
import useSWR from 'swr'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { Link } from 'wouter'

const fetcher = (url, config) => {
  return fetch(process.env.REACT_APP_API_URL + url, config).then(r => r.text())
}

export default ({ nodeId }) => {
  const { data, error } = useSWR(`/node/${nodeId}/snippet`, fetcher)

  if (error) return <div>failed to load, ${error.message}</div>
  if (!data) return <div>loading...</div>

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
      }}>
      <div style={{ width: '50%' }}>
        <Link to={`/node/${nodeId}`}>
          <h2>{atob(nodeId)}</h2>
        </Link>
        <p>
          Paste this snippet in your website somewhere to verify your project
          and connect to the network
        </p>
        <div>
          <div dangerouslySetInnerHTML={{ __html: data }} />
          <CopyToClipboard text={data} onCopy={() => console.log('copied!')}>
            <button>Copy to clipboard</button>
          </CopyToClipboard>
          <br />
          <br />
          <code>{data}</code>
        </div>
      </div>
    </div>
  )
}
