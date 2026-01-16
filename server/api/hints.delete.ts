import { useDb } from '../utils/db';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const id = query.id;
    const pool = useDb();
    const client = await pool.connect();

    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'ID is required' });
    }

    try {
        const schema = '"phish-guard"';
        const table = '"suspiciousindicator"';

        const sql = `DELETE FROM ${schema}.${table} WHERE "id" = $1`;
        await client.query(sql, [id]);

        return { success: true };

    } catch (error: any) {
        console.error('Error deleting hint:', error);
        throw createError({ statusCode: 500, statusMessage: error.message });
    } finally {
        client.release();
    }
});
