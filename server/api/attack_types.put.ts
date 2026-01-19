import { useDb } from '../utils/db';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const pool = useDb();
    const client = await pool.connect();

    try {
        const schema = '"phish-guard"';
        const atTable = '"attacktype"';

        const sql = `
            UPDATE ${schema}.${atTable}
            SET "attacktype" = $1, "description" = $2, "timestamp" = $3
            WHERE "id" = $4
            RETURNING *
        `;

        const timestamp = body.date || new Date().toISOString();
        const result = await client.query(sql, [body.name, body.description, timestamp, body.id]);

        return { success: true, data: result.rows[0] };
    } catch (error) {
        console.error('Error updating attack type:', error);
        throw createError({ statusCode: 500, statusMessage: 'Failed to update attack type' });
    } finally {
        client.release();
    }
});
