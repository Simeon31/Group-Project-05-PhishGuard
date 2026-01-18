import { useDb } from '../utils/db';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const pool = useDb();
    const client = await pool.connect();

    try {
        const schema = '"phish-guard"';

        if (!body.scenario_id || !body.user_email) {
            throw createError({ statusCode: 400, message: 'Missing required fields' });
        }

        const scenarioResult = await client.query(
            `SELECT "attacktypeid" FROM ${schema}."phishingscenario" WHERE "id" = $1`,
            [body.scenario_id]
        );

        let attackTypeId = null;
        if (scenarioResult.rows.length > 0) {
            attackTypeId = scenarioResult.rows[0].attacktypeid;
        }

        const sql = `
            INSERT INTO ${schema}."user_attempts" 
            ("user_email", "scenario_id", "attack_type_id", "is_correct", "timestamp")
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING "id"
        `;

        await client.query(sql, [
            body.user_email,
            body.scenario_id,
            attackTypeId,
            body.is_correct
        ]);

        return { success: true };

    } catch (error) {
        console.error('Error recording attempt:', error);
        throw createError({ statusCode: 500, statusMessage: 'Failed to record attempt' });
    } finally {
        client.release();
    }
});
