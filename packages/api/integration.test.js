const got = require('got')
const express = require('express')
const localtunnel = require('localtunnel')

class Server {
    // This allows us to serve random html to
    // publically accessible endpoint
    // it's used to act as another website that is interacting with
    // with the system eg. hosting the opendesign snippet
    constructor(content = '<p>hi</p>') {
        this.content = content
    }

    serve(port = 3000, subdomain = 'opendesign') {
        const app = express()
        return new Promise((resolve, reject) => {
            app.get('/', (req, res) => {
                res.set('Content-Type', 'text/html')
                res.send(this.content)
            })

            this.listener = app.listen(port, err => {
                if (err) {
                    reject(err)
                }

                console.log('listening')

                localtunnel(
                    port,
                    {
                        host: 'http://serverless.social',
                        subdomain,
                    },
                    (err, tunnel) => {
                        console.log('tunnel up')
                        if (err) {
                            reject(err)
                        }
                        this.tunnel = tunnel
                        resolve()
                    }
                )
            })
        })
    }

    close() {
        this.tunnel.close()
        this.listener.close()
    }
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
    const server = new Server()
    await server.serve(9999, 'nodeverifyhappy')

    try {
        const siteURL = server.tunnel.url
        const res = await got.post(`${API}/node`, {
            json: { url: siteURL },
        })

        expect(res.statusCode).toBe(201)
        const newNode = JSON.parse(res.body)

        const node = await got(`${API}/node/${newNode.id}/pixel`).text()
        expect(node).toMatchSnapshot()

        const unverifiedNode = await got(`${API}/node/${newNode.id}`).json()

        expect(unverifiedNode).toHaveProperty('lastVerified')
        expect(unverifiedNode).toHaveProperty('isVerified')

        // serve the snippet locally so we can verify.
        const snippet = await got(`${API}/node/${newNode.id}/snippet`).text()
        expect(snippet).toMatchSnapshot()

        server.content = snippet

        // force a verify
        await got(`${API}/node/${newNode.id}/pixel?verify=1`).text()

        const verifiedNode = await got(`${API}/node/${newNode.id}`).json()
        expect(verifiedNode).toHaveProperty('isVerified', true)
    } finally {
        server.close()
    }
}, 20000)

test('Node fork - happy', async () => {
    const server = new Server()
    await server.serve(9998, 'nodeforkhappy')

    try {
        const siteURL = server.tunnel.url
        const res = await got.post(`${API}/node`, {
            json: { url: siteURL, prev: '123' },
        })

        expect(res.statusCode).toBe(201)
        const newNode = JSON.parse(res.body)

        const node = await got(`${API}/node/${newNode.id}/pixel`).text()
        expect(node).toMatchSnapshot()

        const unverifiedNode = await got(`${API}/node/${newNode.id}`).json()
        expect(unverifiedNode).toHaveProperty('lastVerified')
        expect(unverifiedNode).toHaveProperty('isVerified')
        expect(unverifiedNode).toHaveProperty('prev', '123')

        // serve the snippet locally so we can verify.
        const snippet = await got(`${API}/node/${newNode.id}/snippet`).text()
        expect(snippet).toMatchSnapshot()
        server.content = snippet

        // force a verify
        await got(`${API}/node/${newNode.id}/pixel?verify=1&prev=123`).text()

        const verifiedNode = await got(`${API}/node/${newNode.id}`).json()
        expect(verifiedNode).toHaveProperty('isVerified', true)
        expect(verifiedNode).toHaveProperty('prev', '123')
    } finally {
        server.close()
    }
}, 20000)
