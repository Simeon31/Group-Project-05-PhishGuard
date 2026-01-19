import { useDb } from '../utils/db';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const pool = useDb();
    const client = await pool.connect();

    try {
        const schema = '"phish-guard"';
        const table = '"suspiciousindicator"';

        if (!body.id) {
            throw createError({ statusCode: 400, statusMessage: 'ID is required' });
        }

        const sql = `
            UPDATE ${schema}.${table}
            SET 
                "phishingscenarioid" = $1,
                "warningsign" = $2,
                "timestamp" = NOW()
            WHERE "id" = $3
            RETURNING *;
        `;

        const result = await client.query(sql, [
            body.phishingscenarioid,
            body.warningsign,
            body.id
        ]);

        if (result.rowCount === 0) {
            throw createError({ statusCode: 404, statusMessage: 'Hint not found' });
        }

        return {
            success: true,
            data: result.rows[0]
        };

    } catch (error: any) {
        console.error('Error updating hint:', error);
        throw createError({ statusCode: 500, statusMessage: error.message });
    } finally {
        client.release();
    }
});
