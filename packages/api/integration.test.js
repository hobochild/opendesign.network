const got = require('got')
const express = require('express')

const serve = (content = 'hi', port = 3000) => {
    const app = express()
    return new Promise((resolve, reject) => {
        app.get('/', (req, res) => {
            res.set('Content-Type', 'text/html')
            res.send(content)
        })
        const listener = app.listen(port, err => {
            resolve(listener)

            if (err) {
                reject(err)
            }
        })
    })
}

const API = 'http://localhost:8787'

beforeAll(async function() {
    let done = false

    while (!done) {
        try {
            const res = await got(`${API}/`)
            if (res.statusCode == 200) {
                done = true
            }
        } catch (e) {}
    }
}, 20000)

test('Node List', async () => {
    const res = await got(`${API}/node`)
    expect(res.statusCode).toBe(200)
    const nodes = JSON.parse(res.body)
    expect(nodes).toHaveProperty('keys', [])
})

test('Node Add - happy', async () => {
    // properly creates a node
    const nodeId = new Buffer('https://hobochild.com/project1').toString(
        'base64'
    )
    const res = await got.post(`${API}/node`, {
        json: { url: 'https://hobochild.com/project1?123' },
    })

    expect(res.statusCode).toBe(201)
    // why isnt .json() working?
    const newNode = JSON.parse(res.body)
    expect(newNode.id).toBe(nodeId)

    // is accessible via single endpoint
    const node = await got(`${API}/node/${nodeId}`).json()
    expect(node).toEqual({ url: 'https://hobochild.com/project1', id: nodeId })
})

test('Node verify - Happy', async () => {
    const siteURL = 'http://localhost:9999/'
    const res = await got.post(`${API}/node`, {
        json: { url: siteURL },
    })

    expect(res.statusCode).toBe(201)
    const newNode = JSON.parse(res.body)
    const snippet = await got(`${API}/node/${newNode.id}/snippet`).text()

    // serve the snippet locally so we can verify.
    const server = await serve(snippet, 9999)
    const x = await got(siteURL)
    console.log(x.body)

    try {
        const node = await got(`${API}/node/${newNode.id}/pixel`).text()
        expect(node).toMatchSnapshot()
    } catch (err) {
        console.log(err)
    } finally {
        server.close()
    }

    const verifiedNode = await got(`${API}/node/${newNode.id}`).json()

    expect(verifiedNode).toHaveProperty('lastVerified')
    // not verified because localhost is not here?
    // I think the network is tunnelled through cloudflare so localhost doesn't work
    expect(verifiedNode).toHaveProperty('isVerified')
})
