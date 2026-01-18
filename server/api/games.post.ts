import { useDb } from '../utils/db';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const pool = useDb();
    const client = await pool.connect();

    try {
        const schema = '"phish-guard"';
        const psTable = '"phishingscenario"';

        const sql = `
            INSERT INTO ${schema}.${psTable} (
                "attacktypeid",
                "attackbody",
                "difficultylevel",
                "sender",
                "senderemail",
                "initials",
                "subject",
                "preview",
                "educationalmessage",
                "hint",
                "isphishing",
                "externalid",
                "timestamp",
                "attackcontext",
                "attackquestion",
                "answer",
                "custom_links"
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            RETURNING *
        `;

        const timestamp = body.timestamp || new Date().toISOString();
        const difficulty = body.difficultylevel ? String(body.difficultylevel) : '1';

        const result = await client.query(sql, [
            body.attacktypeid,
            body.attackbody,
            difficulty,
            body.sender,
            body.senderemail,
            body.initials,
            body.subject,
            body.preview,
            body.educationalmessage,
            body.hint,
            body.isphishing,
            body.externalid,
            timestamp,
            body.attackcontext,
            body.attackquestion,
            body.answer,
            body.custom_links
        ]);

        return { success: true, data: result.rows[0] };
    } catch (error) {
        console.error('Error creating scenario:', error);
        throw createError({ statusCode: 500, statusMessage: 'Failed to create scenario' });
    } finally {
        client.release();
    }
});
