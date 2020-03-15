User creates a node (URL) on the network and gets given a snippet - this node is then visible on the network for x timeperiod or until verified.

User adds snippet to their website - when the website is loaded it pulls the pixel.

<img src="/node/<nodeId>/pixel?forked=prevId"/>

This requests the pixel from node x.

If not verified in the last x hours then we call verify() which scrapes website, on verification is saves the node itself and its edges.

```
{
  id: base64<prettyURL>
  lastVerified: now(),
  isVerified: timestamp,
  title: x,
  description: y
  prevId: prevId
}
```

```
// this is so we can quickly traverse
EDGE.get('<prevId>:<nodeId>')
```

# For dev flow run

```
yarn dev
```

# Tests

cloudflare workers dev workflow is still in beta so tests are a little strange. (see integration.test.js for details)

```
yarn test
```

Questions:

Do we need different edge types?
