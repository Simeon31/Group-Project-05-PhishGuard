import { useDb } from '../utils/db';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const pool = useDb();
    const client = await pool.connect();

    try {
        const schema = '"phish-guard"';
        const atTable = '"attacktype"';
        const id = query.id;

        if (!id) {
            throw createError({ statusCode: 400, statusMessage: 'ID is required' });
        }

        const sql = `DELETE FROM ${schema}.${atTable} WHERE "id" = $1`;

        await client.query(sql, [id]);

        return { success: true };
    } catch (error) {
        console.error('Error deleting attack type:', error);
        throw createError({ statusCode: 500, statusMessage: 'Failed to delete attack type' });
    } finally {
        client.release();
    }
});
