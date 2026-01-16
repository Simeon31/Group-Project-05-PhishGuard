import { useDb } from '../utils/db';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const pool = useDb();
    const client = await pool.connect();

    try {
        const schema = '"phish-guard"';
        const table = '"gamerule"';
        const id = query.id;

        if (!id) {
            throw createError({ statusCode: 400, statusMessage: 'ID is required' });
        }

        const sql = `DELETE FROM ${schema}.${table} WHERE "id" = $1`;

        await client.query(sql, [id]);

        return { success: true };
    } catch (error) {
        console.error('Error deleting game rule:', error);
        throw createError({ statusCode: 500, statusMessage: 'Failed to delete game rule' });
    } finally {
        client.release();
    }
});
