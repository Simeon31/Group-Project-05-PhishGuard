import { useDb } from '../utils/db';

export default defineEventHandler(async (event) => {
    const pool = useDb();
    const query = getQuery(event);

    const limit = query.limit ? parseInt(query.limit as string) : 10;
    const client = await pool.connect();

    try {
        // DETECT SCHEMA AND TABLES

        let schema = '"phish-guard"';
        // Force lower case table names to avoid issues

        let atTable = '"attacktype"';

        let sql = `
      SELECT 
        at."id",
        at."attacktype",
        at."description",
        at."timestamp"
      FROM ${schema}.${atTable} as at 
      ORDER BY at."timestamp" DESC
      LIMIT ${limit}`;



        const result = await client.query(sql);

        return {
            success: true,
            data: result.rows.map(row => ({
                id: row.id,
                attacktype: row.attacktype,
                description: row.description,
                timestamp: row.timestamp,
                read: true
            }))
        };

    } catch (error) {
        console.error('Error fetching attack types:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to fetch attack types'
        });
    } finally {
        client.release();
    }
});
