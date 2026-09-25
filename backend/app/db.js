const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const databaseDirectory = path.resolve(__dirname, '../../database');
const databasePath = path.join(
  databaseDirectory,
  'bookfinder.db'
);

const schemaPath = path.join(
  databaseDirectory,
  'schema.sql'
);

fs.mkdirSync(databaseDirectory, {
  recursive: true
});

const db = new sqlite3.Database(databasePath);

db.run('PRAGMA foreign_keys = ON');
db.run('PRAGMA journal_mode = WAL');

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (error) {
      if (error) {
        return reject(error);
      }

      resolve({
        id: this.lastID,
        changes: this.changes
      });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        return reject(error);
      }

      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        return reject(error);
      }

      resolve(rows);
    });
  });
}

function initDatabase() {
  const schema = fs.readFileSync(schemaPath, 'utf8');

  return new Promise((resolve, reject) => {
    db.exec(schema, error => {
      if (error) {
        return reject(error);
      }

      resolve();
    });
  });
}

module.exports = {
  db,
  run,
  get,
  all,
  initDatabase,
  databasePath
};