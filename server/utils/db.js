const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function readData(filename) {
    const filePath = path.join(DATA_DIR, filename);
    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
    } catch (err) {
        return [];
    }
}

function writeData(filename, data) {
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function findById(filename, id) {
    const data = readData(filename);
    return data.find(item => item.id === id) || null;
}

function findByField(filename, field, value) {
    const data = readData(filename);
    return data.find(item => item[field] === value) || null;
}

function addItem(filename, item) {
    const data = readData(filename);
    data.push(item);
    writeData(filename, data);
    return item;
}

function updateItem(filename, id, updates) {
    const data = readData(filename);
    const index = data.findIndex(item => item.id === id);
    if (index === -1) return null;
    data[index] = { ...data[index], ...updates };
    writeData(filename, data);
    return data[index];
}

function deleteItem(filename, id) {
    let data = readData(filename);
    const item = data.find(item => item.id === id);
    if (!item) return null;
    data = data.filter(item => item.id !== id);
    writeData(filename, data);
    return item;
}

module.exports = {
    readData,
    writeData,
    findById,
    findByField,
    addItem,
    updateItem,
    deleteItem
};
