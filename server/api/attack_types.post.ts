import { useDb } from '../utils/db';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const pool = useDb();
    const client = await pool.connect();

    try {
        const schema = '"phish-guard"';
        const atTable = '"attacktype"';

        const sql = `
            INSERT INTO ${schema}.${atTable} ("attacktype", "description", "timestamp")
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        const timestamp = body.date || new Date().toISOString();

        const result = await client.query(sql, [body.name, body.description, timestamp]);

        return { success: true, data: result.rows[0] };
    } catch (error) {
        console.error('Error creating attack type:', error);
        throw createError({ statusCode: 500, statusMessage: 'Failed to create attack type' });
    } finally {
        client.release();
    }
});
