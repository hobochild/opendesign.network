import React from 'react'
import Graph from './graph'
import Details from './details'
import { useDimensions } from 'react-dimensions-hook'

export default ({ nodeId }) => {
  const { ref, dimensions } = useDimensions()

  const isMobile = dimensions.width < 760
  const containerWidth = isMobile ? '100%' : '50%'

  return (
    <div>
      <div
        style={{
          display: 'flex',
          height: '90vh',
          width: '100%',
          flexDirection: isMobile ? 'column' : 'row',
          overflow: 'hi',
        }}>
        <div style={{ width: containerWidth }}>
          <Details nodeId={nodeId} />
        </div>
        <div
          style={{ width: containerWidth, height: isMobile ? '50%' : '100%' }}
          ref={ref}>
          <Graph
            width={dimensions.width}
            height={dimensions.height}
            nodeIds={[nodeId]}
          />
        </div>
      </div>
    </div>
  )
}
