import { useDb } from '../utils/db';

export default defineEventHandler(async (event) => {
    const pool = useDb();
    const query = getQuery(event);

    const difficulty = query.difficulty ? parseInt(query.difficulty as string) : null;
    const limit = query.limit ? parseInt(query.limit as string) : 10;
    const client = await pool.connect();

    try {
        // DETECT SCHEMA AND TABLES

        let schema = '"phish-guard"';
        // Force lower case table names as requested
        let psTable = '"phishingscenario"';
        let atTable = '"attacktype"';
        let siTable = '"suspiciousindicator"';

        let sql = `
      SELECT 
        ps."id",
        ps."externalid" as external_id,
        ps."sender",
        ps."senderemail" as sender_email,
        ps."initials",
        ps."subject",
        ps."preview",
        ps."attackbody" as body,
        ps."difficultylevel" as difficulty,
        ps."isphishing" as is_phishing,
        ps."educationalmessage" as educational_message,
        ps."hint",
        at."attacktype" as type,
        COALESCE(
          json_agg(
            DISTINCT si."warningsign"
          ) FILTER (WHERE si."warningsign" IS NOT NULL), 
          '[]'
        ) as red_flags
      FROM ${schema}.${psTable} ps
      LEFT JOIN ${schema}.${atTable} at ON ps."attacktypeid" = at."id"
      LEFT JOIN ${schema}.${siTable} si ON ps."id" = si."phishingscenarioid"
    `;

        const params: any[] = [];
        if (difficulty !== null) {
            sql += ` WHERE ps."difficultylevel" = $1`;
            params.push(difficulty.toString());
        }

        sql += ` GROUP BY ps."id", at."attacktype"
             ORDER BY RANDOM()
             LIMIT $${params.length + 1}`;
        params.push(limit);

        const result = await client.query(sql, params);

        return {
            success: true,
            data: result.rows.map(row => ({
                id: row.id,
                external_id: row.external_id,
                sender: row.sender,
                sender_email: row.sender_email,
                initials: row.initials,
                subject: row.subject,
                preview: row.preview,
                body: row.body,
                difficulty: parseInt(row.difficulty),
                isPhishing: row.is_phishing,
                type: row.type,
                redFlags: row.red_flags,
                educationalMessage: row.educational_message,
                hint: row.hint,
                date: 'Today',
                read: false
            }))
        };

    } catch (error) {
        console.error('Error fetching scenarios:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to fetch scenarios'
        });
    } finally {
        client.release();
    }
});
