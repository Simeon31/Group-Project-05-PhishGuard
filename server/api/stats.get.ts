import { useDb } from '../utils/db';

export default defineEventHandler(async (event) => {
    const pool = useDb();
    const client = await pool.connect();

    try {
        const schema = '"phish-guard"';

        await client.query(`
            CREATE TABLE IF NOT EXISTS ${schema}."users" (
                "id" SERIAL PRIMARY KEY,
                "email" varchar(255) UNIQUE NOT NULL,
                "name" varchar(255),
                "picture" varchar(500),
                "auth_id" varchar(255) UNIQUE,
                "last_login" TIMESTAMP DEFAULT NOW(),
                "created_at" TIMESTAMP DEFAULT NOW()
            );
        `);

        // Count Scenarios
        let scenariosCount = 0;
        try {
            const scenariosResult = await client.query(`SELECT COUNT(*) FROM ${schema}."phishingscenario"`);
            scenariosCount = parseInt(scenariosResult.rows[0].count);
        } catch (e) {
            console.warn('Could not count scenarios:', e);
        }

        // Count Users
        let usersCount = 0;
        try {
            const usersResult = await client.query(`SELECT COUNT(*) FROM ${schema}."users"`);
            usersCount = parseInt(usersResult.rows[0].count);
        } catch (e) {
            console.warn('Could not count users:', e);
        }

        return {
            success: true,
            counts: {
                users: usersCount,
                scenarios: scenariosCount
            }
        };

    } catch (error) {
        console.error('Error fetching stats:', error);
        throw createError({ statusCode: 500, statusMessage: 'Failed to fetch stats' });
    } finally {
        client.release();
    }
});
