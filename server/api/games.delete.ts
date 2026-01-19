import { useDb } from '../utils/db';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const id = query.id;

    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'ID is required' });
    }

    const pool = useDb();
    const client = await pool.connect();

    try {
        const schema = '"phish-guard"';
        const psTable = '"phishingscenario"';

        const sql = `DELETE FROM ${schema}.${psTable} WHERE "id" = $1 RETURNING "id"`;
        const result = await client.query(sql, [id]);

        if (result.rowCount === 0) {
            throw createError({ statusCode: 404, statusMessage: 'Scenario not found' });
        }

        return { success: true, id };
    } catch (error) {
        console.error('Error deleting scenario:', error);
        throw createError({ statusCode: 500, statusMessage: 'Failed to delete scenario' });
    } finally {
        client.release();
    }
});
