import React from 'react'
import useSWR from 'swr'
import { fetcher } from './utils'
import Graph from './graph'
import { useDimensions } from 'react-dimensions-hook'

export default ({ nodeId }) => {
  const { data, error } = useSWR(`/node`, fetcher)
  const { ref, dimensions } = useDimensions()

  if (error) return <div>failed to load, ${error.message}</div>
  if (!data) return <div>loading...</div>

  return (
    <div>
      <div
        ref={ref}
        style={{
          width: '100%',
          height: '90vh',
          margin: '20 auto',
        }}>
        <Graph
          width={dimensions.width}
          height={dimensions.height}
          nodeIds={data.keys.map(({ name }) => name)}
        />
      </div>
    </div>
  )
}
