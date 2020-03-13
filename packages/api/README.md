user creates a button with svg link (this button represents an edge in the graph)

<img src="/pixel?forked=prevId"/>

This requests the pixel from referrer x.

```
NODE.get(referrerURL)
```

if not verified in the last x hours then we call verify() which scrapes website
and may also save edges.

```
{
  id: base64<referrerURL>
  lastVerified: now(),
  isVerified: timestamp,
  title: x,
  description: y
  prevId: prevId
}
```

```
EDGE.get('<prevId>:<nodeId>')
```

Questions:

Do we need edges up the graph?
Do we need different edge types?
Do we need a way to set the referrerURL from the image snippet?
On page request we assume the button was clicked from the referrerURL.
Is using referrerURLs going to be very unreliable?
