import React, { useState, useEffect } from 'react'
import { Graph } from 'react-d3-graph'
import _ from 'lodash'
import { fetcher } from './utils'
import { useLocation, Link } from 'wouter'

export default ({ nodeIds, width = 400, height = 800 }) => {
  const [graph, setGraph] = useState({
    nodes: nodeIds.map(id => ({
      id,
    })),
    links: [],
  })

  const config = {
    zoom: 8,
    node: {
      fontSize: 14,
      labelProperty: node => {
        return <Link to={`/node/${node.id}`}>{atob(node.id)}</Link>
      },
      viewGenerator: node => {
        return (
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle
              cx="50"
              cy="50"
              r="50"
              style={{
                fill:
                  nodeIds.length === 1 && nodeIds.includes(node.id)
                    ? 'yellow'
                    : 'gray',
              }}
            />
          </svg>
        )
      },
    },
    width,
    height,
    directed: true,
    d3: {
      gravity: -(graph.nodes.length * 50),
      alphaTarget: 0.5,
    },
  }

  const [_location, setLocation] = useLocation([])

  const traverse = async function(nodeId, cb) {
    const edges = await fetcher(`/node/${nodeId}/edge`)

    const newLinks = edges.keys.map(({ name }) => {
      const [source, target] = name.split(':')
      return {
        source,
        target,
      }
    })

    const newNodes = _.flatten(
      edges.keys.map(({ name }) => {
        const [source, target] = name.split(':')
        return [
          {
            id: target,
          },
          {
            id: source,
          },
        ]
      }),
    )

    setGraph(graph => {
      const uniqNodes = _.uniqBy([...newNodes, ...graph.nodes], function(n) {
        return n.id
      })

      const uniqLinks = _.uniqBy([...newLinks, ...graph.links], function(l) {
        return l.source + l.target
      })

      return { nodes: uniqNodes, links: uniqLinks }
    })
  }

  const fetchNode = async nodeId => {
    const node = await fetcher(`/node/${nodeId}`)

    if (node.prev) {
      setGraph(graph => {
        const uniqNodes = _.uniqBy(
          graph.nodes.concat({ id: node.prev }),
          function(n) {
            return n.id
          },
        )

        return { ...graph, nodes: uniqNodes }
      })

      traverse(node.prev)
    }
  }

  const onClickNode = function(nodeId) {
    setLocation(`/node/${nodeId}`)
  }

  useEffect(() => {
    nodeIds.map(nodeId => {
      traverse(nodeId)
      fetchNode(nodeId)
      return nodeId
    })
  }, [])

  useEffect(
    () => {
      setGraph(graph => {
        return {
          ...graph,
          nodes: graph.nodes.map(n => ({
            ...n,
            x: Math.floor(Math.random() * width - width / 10),
            y: Math.floor(Math.random() * height - height / 10),
            className: String(Math.floor(Math.random() * width)),
            fontSize: 20,
          })),
        }
      })
    },
    [width, height],
  )

  // This is a hack to only load the orphan nodes once we know the
  // container size.
  // We instead should get react-d3-graph to rerender when we change node.x|y
  if (graph.nodes.length === 0 || graph.nodes[0].y === 0) {
    return <div />
  }

  return (
    <Graph
      id="graph-id"
      config={config}
      data={graph}
      onClickNode={onClickNode}
      onMouseOverNode={nodeId => {
        traverse(nodeId)
        fetchNode(nodeId)
      }}
    />
  )
}
