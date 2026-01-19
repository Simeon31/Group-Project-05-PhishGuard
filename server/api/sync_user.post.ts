import { useDb } from '../utils/db';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const pool = useDb();
    const client = await pool.connect();

    try {
        const schema = '"phish-guard"';

        if (!body.email) {
            return { success: false, message: 'No email provided' };
        }

        // Upsert user
        const sql = `
            INSERT INTO ${schema}."users" ("email", "name", "picture", "auth_id", "last_login")
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT ("email") 
            DO UPDATE SET 
                "name" = EXCLUDED."name",
                "picture" = EXCLUDED."picture",
                "auth_id" = EXCLUDED."auth_id",
                "last_login" = NOW()
            RETURNING "id";
        `;

        const result = await client.query(sql, [
            body.email,
            body.name,
            body.picture,
            body.sub
        ]);

        return { success: true, userId: result.rows[0].id };
    } catch (error) {
        console.error('Error syncing user:', error);
        return { success: false, error: error };
    } finally {
        client.release();
    }
});
