const got = require('got')

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
}, 10000)

test('Node List', async () => {
    const res = await got(`${API}/node`)
    expect(res.statusCode).toBe(200)
})

test('Node Add', async () => {
    // properly creates a node
    const nodeId = new Buffer('hobochild.com/project1').toString('base64')
    const res = await got.post(`${API}/node`, {
        json: { url: 'https://hobochild.com/project1' },
    })

    expect(res.statusCode).toBe(201)
    // why isnt .json() working?
    const newNode = JSON.parse(res.body)
    expect(newNode.id).toBe(nodeId)

    // is accessible via single endpoint
    const node = await got(`${API}/node/${nodeId}`).json()
    expect(node).toEqual({ url: 'hobochild.com/project1', id: nodeId })
})
