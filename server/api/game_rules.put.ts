import { useDb } from '../utils/db';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const pool = useDb();
    const client = await pool.connect();

    try {
        const schema = '"phish-guard"';
        const table = '"gamerule"';

        if (!body.id || !body.gamerule || !body.attacktypeID) {
            throw createError({ statusCode: 400, statusMessage: 'Missing required fields' });
        }

        const sql = `
            UPDATE ${schema}.${table}
            SET "attacktypeid" = $1, "gamerule" = $2, "timestamp" = $3
            WHERE "id" = $4
            RETURNING *
        `;

        const timestamp = body.timestamp || new Date().toISOString();

        const result = await client.query(sql, [body.attacktypeID, body.gamerule, timestamp, body.id]);

        return { success: true, data: result.rows[0] };
    } catch (error) {
        console.error('Error updating game rule:', error);
        throw createError({ statusCode: 500, statusMessage: 'Failed to update game rule' });
    } finally {
        client.release();
    }
});
