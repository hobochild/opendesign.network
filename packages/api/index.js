const Router = require('./router')
const cheerio = require('cheerio')

/**
 * Example of how router can be used in an application
 *  */
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

function handler(request) {
    const init = {
        headers: { 'content-type': 'application/json' },
    }
    const body = JSON.stringify({ some: 'json' })
    return new Response(body, init)
}

function svg(id) {
    return `<svg height="50" width="200" xmlns="http://www.w3.org/2000/svg">
  <rect fill="green" x="0" y="0" width="200" height="50"></rect>
  <text x="100" y="25" fill="red" text-anchor="middle" alignment-baseline="central">  project: ${id}</text>
</svg>`
}

async function verify(url, triggerUrl) {
    const request = new Request(url)
    const res = await fetch(request)
    const txt = await res.text()
    const $ = await cheerio.load(txt)

    // checks if the url comes from the site in question
    console.log(triggerUrl.href)
    const isVerified = $(`img[src="${triggerUrl.href}"]`).length > 0

    return {
        url: url,
        title: $('title').text(),
        lastVerified: new Date().getTime(),
        isVerified,
        prev: triggerUrl.searchParams.get('prev'),
    }
}

const genNodeId = url => {
    return btoa(url.hostname + url.pathname)
}

const parseNodeId = nodeId => {
    return atob(nodeId)
}

async function getNode(nodeId) {
    const node = await NODES.get(nodeId).then(JSON.parse)

    if (!node) {
        return new Response('not found', {
            status: 404,
            statusText: 'not found',
            headers: {
                'content-type': 'text/plain',
            },
        })
    }

    const edges = await EDGES.list({ prefix: nodeId })
    // TODO handle pagination
    // https://developers.cloudflare.com/workers/reference/storage/listing-keys/
    const body = JSON.stringify({
        ...node,
        connections: edges.keys.map(({ name }) => name.split(':').pop()),
    })

    return new Response(body, {
        status: 200,
        statusText: 'ok',
        headers: { 'content-type': 'application/json' },
    })
}

async function nodeHandle(request) {
    const url = new URL(request.url)
    const nodeId = url.pathname.split('/')[2]
    return getNode(nodeId)
}

async function nodeAdd(request) {
    const body = await request.json()
    // NB TODO check if already exists
    const nodeId = genNodeId(new URL(body.url))
    const payload = JSON.stringify({
        ...body,
        id: nodeId,
    })
    await NODES.put(nodeId, payload)

    return new Response(payload, {
        status: 201,
        statusText: 'Created',
        headers: {
            'content-type': 'application/json',
        },
    })
}

async function nodeList(request) {
    const nodes = await NODES.list({ limit: 10 })

    return new Response(JSON.stringify(nodes), {
        status: 200,
        statusText: 'not found',
        headers: {
            'content-type': 'application/json',
        },
    })
}

async function pixelSnippetHandle(request) {
    const url = new URL(request.url)
    const nodeId = url.pathname.split('/')[2]
    const node = await NODES.get(nodeId).then(JSON.parse)

    if (!node) {
        return new Response('not found', {
            status: 404,
            statusText: 'not found',
            headers: {
                'content-type': 'text/plain',
            },
        })
    }

    const snippet = `<a href="https://ui.hobochild.workers.dev/node/${nodeId}"><img src="https://api.hobochild.workers.dev/node/${nodeId}/pixel${
        node.prev ? '?prev=' + node.prev : ''
    }" /><a>`

    return new Response(snippet, {
        status: 200,
        statusText: 'ok',
        headers: { 'content-type': 'text/plain' },
    })
}

async function pixelHandle(request) {
    const url = new URL(request.url)
    const nodeId = url.pathname.split('/')[2]
    const node = await NODES.get(nodeId).then(JSON.parse)

    if (!node) {
        return new Response('resource not found', {
            status: 404,
            statusText: 'not found',
            headers: {
                'content-type': 'text/plain',
            },
        })
    }

    // reverify every 5 mins
    // TODO expo backoff
    if (
        true ||
        !node.lastVerified ||
        node.lastVerified - new Date().getTime() > 5 * 60 * 1000
    ) {
        const verification = await verify(node.url, url)

        if (verification) {
            await NODES.put(nodeId, JSON.stringify(verification))
            if (verification.prev) {
                await EDGES.put(
                    `${verification.prev}:${nodeId}`,
                    JSON.stringify(verification)
                )
            }
        }
    }

    return new Response(svg(nodeId), {
        headers: {
            'content-type': 'image/svg+xml; charset=UTF-8',
        },
    })
}

async function handleRequest(request) {
    const r = new Router()
    // Replace with the approriate paths and handlers
    r.get('.*/node', nodeList)
    r.post('.*/node', nodeAdd)
    r.get('.*/node/.*/snippet', pixelSnippetHandle)
    r.get('.*/node/.*/pixel', pixelHandle)
    r.get('.*/node/.*', nodeHandle)
    r.get('/', () => new Response('This is the idea network!')) // return a default message for the root route

    const resp = await r.route(request)
    return resp
}
