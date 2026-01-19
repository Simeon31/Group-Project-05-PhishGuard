import { useDb } from '../utils/db';

export default defineEventHandler(async (event) => {
    const pool = useDb();
    const query = getQuery(event);

    const limit = query.limit ? parseInt(query.limit as string) : 50;
    const client = await pool.connect();

    try {
        let schema = '"phish-guard"';
        let psTable = '"phishingscenario"';
        let atTable = '"attacktype"';

        let sql = `
      SELECT 
        ps."id",
        ps."externalid",
        ps."sender",
        ps."senderemail",
        ps."initials",
        ps."subject",
        ps."preview",
        ps."attackbody",
        ps."difficultylevel",
        ps."isphishing",
        ps."educationalmessage",
        ps."hint",
        ps."timestamp",
        ps."attacktypeid",
        ps."attackcontext",
        ps."attackquestion",
        ps."answer",
        ps."custom_links",
        at."attacktype" as attack_type_name
      FROM ${schema}.${psTable} ps
      LEFT JOIN ${schema}.${atTable} at ON ps."attacktypeid" = at."id"
      ORDER BY ps."timestamp" DESC
      LIMIT ${limit}`;

        const result = await client.query(sql);

        return {
            data: result.rows
        };

    } catch (err) {
        console.error('Error executing query', err);
        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error'
        });
    } finally {
        client.release();
    }
});
