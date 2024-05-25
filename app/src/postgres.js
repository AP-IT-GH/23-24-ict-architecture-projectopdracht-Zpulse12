const pg = require('pg');
const connectionString = process.env.DATABASE_URL;

const pool = new pg.Pool({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false,
    }
});

async function createUpload(mimetype, size, filename) {
    const result = await pool.query('INSERT INTO uploads (mimetype, size, filename) VALUES ($1, $2, $3) RETURNING id', [mimetype, size, filename]);
    return result.rows[0];
}

async function getUploads() {
    const result = await pool.query('SELECT * FROM uploads');
    return result.rows;
}

async function getUpload(id) {
    const result = await pool.query('SELECT * FROM uploads WHERE id = $1', [id]);
    return result.rows[0];
}

async function deleteUpload(id) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM upload_metadata WHERE upload_id = $1', [id]);
        await client.query('DELETE FROM uploads WHERE id = $1', [id]);
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

async function saveMetadata(uploadId, metadata) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const insertPromises = metadata.map(({ key, value }) => {
            return client.query('INSERT INTO upload_metadata (upload_id, key, value) VALUES ($1, $2, $3)', [uploadId, key, value]);
        });
        await Promise.all(insertPromises);
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

async function getMetadata(uploadId) {
    const result = await pool.query('SELECT key, value FROM upload_metadata WHERE upload_id = $1', [uploadId]);
    return result.rows;
}

async function getAllMetadata() {
    const result = await pool.query('SELECT * FROM upload_metadata');
    return result.rows;
}

async function createTable() {
    await pool.query(`CREATE TABLE IF NOT EXISTS uploads (
        id SERIAL PRIMARY KEY,
        mimetype VARCHAR(255),
        size INTEGER,
        filename VARCHAR(255)
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS upload_metadata (
        id SERIAL PRIMARY KEY,
        upload_id INTEGER REFERENCES uploads(id),
        key VARCHAR(255),
        value VARCHAR(255)
    )`);
}

module.exports = {
    createUpload,
    getUploads,
    getUpload,
    deleteUpload,
    saveMetadata,
    getMetadata,
    getAllMetadata,
};

setTimeout(() => {
    console.log('creating table if not exists...');
    createTable()
        .then(() => console.log('table created if not exists'))
        .catch(err => {
            console.log(err);
            console.log('database not available, exiting');
            process.exit(1);
        });
}, 5000);
