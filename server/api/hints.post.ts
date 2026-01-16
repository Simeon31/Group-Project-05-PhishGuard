import { useDb } from '../utils/db';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const pool = useDb();
    const client = await pool.connect();

    // Context: table name: suspiciousindicator, columns: id, phishingscenarioid INT, warningsign CHARS, timestamp

    try {
        const schema = '"phish-guard"';
        const table = '"suspiciousindicator"';

        const sql = `
            INSERT INTO ${schema}.${table} ("phishingscenarioid", "warningsign")
            VALUES ($1, $2)
            RETURNING *;
        `;

        const result = await client.query(sql, [
            body.phishingscenarioid,
            body.warningsign
        ]);

        return {
            success: true,
            data: result.rows[0]
        };

    } catch (error: any) {
        console.error('Error creating hint:', error);
        throw createError({ statusCode: 500, statusMessage: error.message });
    } finally {
        client.release();
    }
});
