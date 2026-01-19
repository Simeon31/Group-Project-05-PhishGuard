import { useDb } from '../utils/db';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const pool = useDb();
    const client = await pool.connect();

    try {
        const schema = '"phish-guard"';
        const table = '"gamerule"';

        if (!body.gamerule || !body.attacktypeID) {
            throw createError({ statusCode: 400, statusMessage: 'Missing required fields' });
        }

        const sql = `
            INSERT INTO ${schema}.${table} ("attacktypeid", "gamerule", "timestamp")
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        const timestamp = body.timestamp || new Date().toISOString();

        const result = await client.query(sql, [body.attacktypeID, body.gamerule, timestamp]);

        return { success: true, data: result.rows[0] };
    } catch (error: any) {
        console.error('Error creating game rule:', error);
        throw createError({
            statusCode: 500,
            statusMessage: `Failed to create game rule: ${error.message}`
        });
    } finally {
        client.release();
    }
});
