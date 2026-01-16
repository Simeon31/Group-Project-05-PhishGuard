import { useDb } from '../utils/db';

export default defineEventHandler(async (event) => {
    const pool = useDb();
    const query = getQuery(event);
    const limit = query.limit ? parseInt(query.limit as string) : 50;
    const client = await pool.connect();

    try {
        const schema = '"phish-guard"';
        const table = '"suspiciousindicator"';
        const psTable = '"phishingscenario"';

        // Ensure table exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS ${schema}.${table} (
                "id" SERIAL PRIMARY KEY,
                "phishingscenarioid" INTEGER,
                "warningsign" TEXT,
                "timestamp" TIMESTAMP DEFAULT NOW()
            );
        `);

        // Fetch
        const sql = `
            SELECT 
                si."id",
                si."warningsign",
                si."timestamp",
                si."phishingscenarioid",
                ps."subject" as "scenario_subject"
            FROM ${schema}.${table} as si
            LEFT JOIN ${schema}.${psTable} as ps ON si."phishingscenarioid" = ps."id"
            ORDER BY si."timestamp" DESC
            LIMIT $1
        `;

        const result = await client.query(sql, [limit]);

        return {
            success: true,
            data: result.rows
        };

    } catch (error: any) {
        console.error('Error fetching hints:', error);
        throw createError({ statusCode: 500, statusMessage: error.message });
    } finally {
        client.release();
    }
});
