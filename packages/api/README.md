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

## Router

Selects the logic to respond to requests based on the `request` method and URL. Can be used with REST APIs or apps that require basic routing logic.

[`index.js`](https://github.com/cloudflare/worker-template-router/blob/master/router.js) is the content of the Workers script.

Live Demos are hosted on `workers-tooling.cf/demos/router`:
[Demo /bar](http://workers-tooling.cf/demos/router/bar) | [Demo /foo](http://workers-tooling.cf/demos/router/foo)

#### Wrangler

You can use [wrangler](https://github.com/cloudflare/wrangler) to generate a new Cloudflare Workers project based on this template by running the following command from your terminal:

```
wrangler generate myApp https://github.com/cloudflare/worker-template-router
```

Before publishing your code you need to edit `wrangler.toml` file and add your Cloudflare `account_id` - more information about publishing your code can be found [in the documentation](https://workers.cloudflare.com/docs/quickstart/configuring-and-publishing/).

Once you are ready, you can publish your code by running the following command:

```
wrangler publish
```

#### Serverless

To deploy using serverless add a [`serverless.yml`](https://serverless.com/framework/docs/providers/cloudflare/) file.
