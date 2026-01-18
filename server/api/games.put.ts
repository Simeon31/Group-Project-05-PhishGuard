import { useDb } from '../utils/db';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const pool = useDb();
    const client = await pool.connect();

    if (!body.id) {
        throw createError({ statusCode: 400, statusMessage: 'ID is required' });
    }

    try {
        const schema = '"phish-guard"';
        const psTable = '"phishingscenario"';

        const sql = `
            UPDATE ${schema}.${psTable} SET
                "attacktypeid" = $1,
                "attackbody" = $2,
                "difficultylevel" = $3,
                "sender" = $4,
                "senderemail" = $5,
                "initials" = $6,
                "subject" = $7,
                "preview" = $8,
                "educationalmessage" = $9,
                "hint" = $10,
                "isphishing" = $11,
                "externalid" = $12,
                "timestamp" = $13,
                "attackcontext" = $14,
                "attackquestion" = $15,
                "answer" = $16,
                "custom_links" = $17
            WHERE "id" = $18
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
            body.custom_links,
            body.id
        ]);

        if (result.rowCount === 0) {
            throw createError({ statusCode: 404, statusMessage: 'Scenario not found' });
        }

        return { success: true, data: result.rows[0] };
    } catch (error) {
        console.error('Error updating scenario:', error);
        throw createError({ statusCode: 500, statusMessage: 'Failed to update scenario' });
    } finally {
        client.release();
    }
});
