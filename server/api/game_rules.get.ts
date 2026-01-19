import { useDb } from '../utils/db';

export default defineEventHandler(async (event) => {
    const pool = useDb();
    const query = getQuery(event);
    const limit = query.limit ? parseInt(query.limit as string) : 50;
    const client = await pool.connect();

    try {
        const schema = '"phish-guard"';
        const table = '"gamerule"';
        const atTable = '"attacktype"';

        await client.query(`
            CREATE TABLE IF NOT EXISTS ${schema}.${table} (
                "id" SERIAL PRIMARY KEY,
                "attacktypeid" INTEGER,
                "gamerule" TEXT NOT NULL,
                "timestamp" TIMESTAMP DEFAULT NOW()
            );
        `);

        // Fix for existing table without the column
        await client.query(`
            ALTER TABLE ${schema}.${table} 
            ADD COLUMN IF NOT EXISTS "attacktypeid" INTEGER;
        `);

        // Fetch
        const sql = `
            SELECT 
                gr."id",
                gr."gamerule",
                gr."timestamp",
                gr."attacktypeid",
                at."attacktype" as "attack_type_name"
            FROM ${schema}.${table} as gr
            LEFT JOIN ${schema}.${atTable} as at ON gr."attacktypeid" = at."id"
            ORDER BY gr."timestamp" DESC
            LIMIT $1
        `;

        const result = await client.query(sql, [limit]);

        return {
            success: true,
            data: result.rows
        };

    } catch (error: any) {
        console.error('Error fetching game rules:', error);
        throw createError({
            statusCode: 500,
            statusMessage: `Failed to fetch game rules: ${error.message}`
        });
    } finally {
        client.release();
    }
});
