const { parentPort } = require('worker_threads');
const Database = require('better-sqlite3');

parentPort.on('message', ({ filePath, operator, parameters }) => {
    const db = new Database(filePath);
    db.prepare(`
    CREATE TABLE IF NOT EXISTS Test (
        exampleID INTEGER PRIMARY KEY,
        exampleName TEXT
    )`).run();
    // db.prepare(`INSERT INTO Test (exampleName) VALUES (?)`).run("marcos");
    // console.log(db.prepare(`SELECT exampleName FROM Test`).pluck().all());

    const result = db.prepare(`SELECT * FROM Test`).pluck().all();
    parentPort.postMessage(result);
});