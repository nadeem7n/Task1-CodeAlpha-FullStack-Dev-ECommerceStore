// db.js — a tiny zero-dependency JSON-file "database".
// Good enough for an internship project; swap for MongoDB/Postgres in production.
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

function file(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

function load(name, fallback) {
  const f = file(name);
  if (!fs.existsSync(f)) {
    fs.writeFileSync(f, JSON.stringify(fallback, null, 2));
    return fallback;
  }
  return JSON.parse(fs.readFileSync(f, 'utf-8'));
}

function save(name, data) {
  fs.writeFileSync(file(name), JSON.stringify(data, null, 2));
}

module.exports = { load, save };
