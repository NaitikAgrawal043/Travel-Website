const { v4: uuidv4 } = require('uuid');

function generateId() {
    return uuidv4();
}

function now() {
    return new Date().toISOString();
}

function paginate(array, page = 1, limit = 10) {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const results = {};

    results.total = array.length;
    results.page = page;
    results.limit = limit;
    results.totalPages = Math.ceil(array.length / limit);

    if (endIndex < array.length) {
        results.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
        results.previous = { page: page - 1, limit };
    }

    results.data = array.slice(startIndex, endIndex);
    return results;
}

module.exports = { generateId, now, paginate };
