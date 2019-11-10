import React from 'react'
import Graph from './graph'
import Fork from './fork'
import Node from './node'
import Home from './home'
import Snippet from './snippet'
import { Route } from 'wouter'
import './App.css'
import Header from './header'

function App() {
  return (
    <div>
      <Header />
      <Route path="/node/:nodeId/graph">
        {params => <Graph nodeIds={[params.nodeId]} />}
      </Route>
      <Route path="/node/:nodeId/fork">
        {params => <Fork nodeId={params.nodeId} />}
      </Route>
      <Route path="/node/:nodeId/snippet">
        {params => <Snippet nodeId={params.nodeId} />}
      </Route>
      <Route path="/node/:nodeId">
        {params => <Node nodeId={params.nodeId} />}
      </Route>
      <Route path="/start">{params => <Fork nodeId={null} />}</Route>
      <Route path="/">{params => <Home />}</Route>
    </div>
  )
}

export default App
