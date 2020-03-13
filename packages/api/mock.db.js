class MockDB {
    constructor() {
        this.data = {}
    }

    get(key) {
        return Promise.resolve(this.data[key])
    }

    put(key, value) {
        this.data[key] = value
        return Promise.resolve(value)
    }

    list() {
        return Promise.resolve({ keys: [] })
    }
}

export default MockDB
