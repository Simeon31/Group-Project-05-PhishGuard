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

        // Pareto Analysis: User Struggle by Attack Type
        let paretoData = [];
        try {
            const paretoSql = `
                SELECT 
                    at.attacktype, 
                    COUNT(*) as frequency
                FROM ${schema}."user_attempts" ua
                JOIN ${schema}."attacktype" at ON ua.attack_type_id = at.id
                WHERE ua.is_correct = false
                GROUP BY at.attacktype
                ORDER BY frequency DESC
            `;

            const paretoResult = await client.query(paretoSql);
            const rawData = paretoResult.rows;

            const totalFailures = rawData.reduce((sum, row) => sum + parseInt(row.frequency), 0);
            let runningTotal = 0;

            paretoData = rawData.map(row => {
                const freq = parseInt(row.frequency);
                runningTotal += freq;
                return {
                    type: row.attacktype,
                    frequency: freq,
                    cumulativePercentage: totalFailures > 0 ? parseFloat(((runningTotal / totalFailures) * 100).toFixed(1)) : 0
                };
            });
        } catch (e) {
            console.warn('Could not fetch pareto stats:', e);
        }

        return {
            success: true,
            counts: {
                users: usersCount,
                scenarios: scenariosCount
            },
            pareto: paretoData
        };

    } catch (error) {
        console.error('Error fetching stats:', error);
        throw createError({ statusCode: 500, statusMessage: 'Failed to fetch stats' });
    } finally {
        client.release();
    }
});
