import cheerio from 'cheerio'
import { Router } from 'tiny-request-router'
import MockDB from './mock.db'

const UI_URL = 'https://opendesign.network'
const API_URL = 'https://api.opendesign.network'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

function svg(id, verified) {
    return `<svg height="50" width="200" xmlns="http://www.w3.org/2000/svg">
  <rect fill="green" x="0" y="0" width="200" height="50"></rect>
  <text x="100" y="25" fill="${
      verified ? 'yellow' : 'pink'
  }" text-anchor="middle" alignment-baseline="central">  project: ${id}</text>
</svg>`
}

if (process.env.NODE_ENV == 'production') {
    NODES = new MockDB()
    EDGES = new MockDB()
}

async function verify(url, resourceURL) {
    const res = await fetch(url)
    const txt = await res.text()
    const $ = cheerio.load(txt)

    // checks if the url comes from the site in question
    // clean the URL
    const prev = resourceURL.searchParams.get('prev')
    const search = prev ? '?prev=' + prev : ''
    const cleanURL =
        resourceURL.protocol +
        '//' +
        resourceURL.host +
        resourceURL.pathname +
        search

    const isVerified = $(`img[src="${cleanURL}"]`).length > 0

    return {
        title: $('title').text(),
        description: $('meta[name=description]').attr('content'),
        lastVerified: new Date().getTime(),
        isVerified,
    }
}

const genNodeId = url => {
    return btoa(url.host + url.pathname)
}

const prettyURL = input => {
    const url = new URL(input)
    return url.protocol + '//' + url.host + url.pathname
}

async function getNode(nodeId) {
    const node = await NODES.get(nodeId).then(JSON.parse)

    if (!node) {
        return new Response('not found', {
            status: 404,
            statusText: 'not found',
            headers: {
                ...corsHeaders,
                'content-type': 'text/plain',
            },
        })
    }

    const body = JSON.stringify(node)

    return new Response(body, {
        status: 200,
        statusText: 'ok',
        headers: {
            ...corsHeaders,
            'content-type': 'application/json',
        },
    })
}

async function nodeHandle(request) {
    const url = new URL(request.url)
    const nodeId = request.params.nodeId
    return getNode(nodeId)
}

async function nodeAdd(request) {
    const body = await request.json()
    const url = prettyURL(body.url)
    const nodeId = btoa(url)

    const oldNode = await NODES.get(nodeId)

    if (oldNode && oldNode.isVerified) {
        return new Response(payload, {
            status: 422,
            statusText:
                'This site is already verified - Please remove the pixel before creating another.',
            headers: corsHeaders,
        })
    }

    const payload = JSON.stringify({
        ...body,
        url,
        id: nodeId,
    })

    const ts = Math.round(new Date().getTime() / 1000)
    const tsTomorrow = ts + 24 * 3600
    await NODES.put(nodeId, payload, { expiration: tsTomorrow })

    return new Response(payload, {
        status: 201,
        statusText: `Created - Expiration: ${tsTomorrow}`,
        headers: {
            ...corsHeaders,
            'content-type': 'application/json',
        },
    })
}

async function nodeList() {
    const nodes = await NODES.list({ limit: 10 })

    return new Response(JSON.stringify(nodes), {
        status: 200,
        statusText: 'Ok',
        headers: {
            ...corsHeaders,
            'content-type': 'application/json',
        },
    })
}

async function NodeEdgeList(request) {
    const nodeId = request.params.nodeId
    const edges = await EDGES.list({ prefix: nodeId })

    return new Response(JSON.stringify(edges), {
        status: 200,
        statusText: 'not found',
        headers: {
            ...corsHeaders,
            'content-type': 'application/json',
        },
    })
}

async function pixelSnippetHandle(request) {
    const nodeId = request.params.nodeId
    const node = await NODES.get(nodeId).then(JSON.parse)

    if (!node) {
        return new Response('not found', {
            status: 404,
            statusText: 'not found',
            headers: {
                ...corsHeaders,
                'content-type': 'text/plain',
            },
        })
    }

    const params = node.prev ? '?prev=' + node.prev : ''
    const nodeUrl = `${UI_URL}/node/${nodeId}`
    const pixelUrl = `${API_URL}/node/${nodeId}/pixel${params}`

    const snippet = `<a href="${encodeURI(nodeUrl)}" /><img src="${encodeURI(
        pixelUrl
    )}" /></a>`

    return new Response(snippet, {
        status: 200,
        statusText: 'ok',
        headers: {
            ...corsHeaders,
            'content-type': 'text/html',
        },
    })
}

async function pixelHandle(request) {
    const url = new URL(request.url)
    const nodeId = request.params.nodeId
    let node = await NODES.get(nodeId).then(JSON.parse)

    if (!node) {
        return new Response('resource not found', {
            status: 404,
            statusText: 'not found',
            headers: {
                ...corsHeaders,
                'content-type': 'text/plain',
            },
        })
    }

    if (
        !node.lastVerified ||
        url.searchParams.get('verify') ||
        node.lastVerified - new Date().getTime() > 5 * 60 * 1000
    ) {
        const verification = await verify(node.url, url)
        node = {
            ...node,
            ...verification,
        }

        await NODES.put(
            nodeId,
            JSON.stringify(node)
        )

        if (node.isVerified && node.prev) {
            await EDGES.put(
                `${node.prev}:${nodeId}`,
              JSON.stringify(node)
            )
        }
    }

    return new Response(svg(nodeId, node.isVerified), {
        headers: {
            ...corsHeaders,
            'content-type': 'image/svg+xml; charset=UTF-8',
        },
    })
}

function handleOptions(request) {
    if (
        request.headers.get('Origin') !== null &&
        request.headers.get('Access-Control-Request-Method') !== null &&
        request.headers.get('Access-Control-Request-Headers') !== null
    ) {
        // Handle CORS pre-flight request.
        return new Response(null, {
            headers: corsHeaders,
        })
    } else {
        // Handle standard OPTIONS request.
        return new Response(null, {
            headers: {
                Allow: 'GET, HEAD, POST, OPTIONS',
            },
        })
    }
}

const r = new Router()
    .options('*', handleOptions)
    .post('/node', nodeAdd)
    .get('/node/:nodeId/snippet', pixelSnippetHandle)
    .get('/node/:nodeId/pixel', pixelHandle)
    .get('/node/:nodeId/edge', NodeEdgeList)
    .get('/node/:nodeId', nodeHandle)
    .get('/node', nodeList)
    .all('/', () => new Response('This is the open design network!'), {
        headers: corsHeaders,
    }) // return a default message for the root route

addEventListener('fetch', event => {
    const request = event.request
    const { pathname } = new URL(request.url)

    const match = r.match(request.method, pathname)
    if (match) {
        request.params = match.params

        try {
            const res = match.handler(event.request)
            event.respondWith(res)
        } catch (err) {
            event.respondWith(new Response(err, { status: 500 }))
        }
    }
})
