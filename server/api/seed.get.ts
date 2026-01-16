import { useDb } from '../utils/db';
import fs from 'fs';
import path from 'path';

export default defineEventHandler(async (event) => {
    const pool = useDb();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const schema = '"phish-guard"';
        const atTable = '"attacktype"';
        const psTable = '"phishingscenario"';
        const siTable = '"suspiciousindicator"';
        const uTable = '"users"';

        console.log(`Using schema: ${schema}`);


        await client.query(`
            CREATE TABLE IF NOT EXISTS ${schema}.${uTable} (
                "id" SERIAL PRIMARY KEY,
                "email" varchar(255) UNIQUE NOT NULL,
                "name" varchar(255),
                "picture" varchar(500),
                "auth_id" varchar(255) UNIQUE,
                "last_login" TIMESTAMP DEFAULT NOW(),
                "created_at" TIMESTAMP DEFAULT NOW()
            );
        `);

        await client.query(`
            ALTER TABLE ${schema}.${psTable}
            ADD COLUMN IF NOT EXISTS "sender" varchar(255),
            ADD COLUMN IF NOT EXISTS "senderemail" varchar(255),
            ADD COLUMN IF NOT EXISTS "initials" varchar(10),
            ADD COLUMN IF NOT EXISTS "subject" varchar(500),
            ADD COLUMN IF NOT EXISTS "preview" varchar(500),
            ADD COLUMN IF NOT EXISTS "educationalmessage" TEXT,
            ADD COLUMN IF NOT EXISTS "hint" TEXT,
            ADD COLUMN IF NOT EXISTS "isphishing" BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS "externalid" varchar(50) UNIQUE;
        `);


        try {
            console.log('Attempting to drop constraint phishingscenario_attacktypeid...');
            await client.query(`
                ALTER TABLE ${schema}.${psTable} 
                DROP CONSTRAINT IF EXISTS "phishingscenario_attacktypeid";
            `);
            await client.query(`
                DROP INDEX IF EXISTS ${schema}."phishingscenario_attacktypeid";
            `);
        } catch (e: any) {
            console.warn('Could not drop constraint/index phishingscenario_attacktypeid:', e.message);
        }

        // 1. SEED ATTACK TYPES
        const attackTypes = [
            { type: 'Credential Harvesting', description: 'Attempts to steal login credentials through fake login pages' },
            { type: 'Link Manipulation', description: 'Uses deceptive links to redirect users to malicious sites' },
            { type: 'Cloud Storage Alert', description: 'Fake alerts about cloud storage issues' },
            { type: 'Reward Scam', description: 'Promises free rewards or prizes to lure victims' },
            { type: 'Internal Impersonation', description: 'Impersonates internal company staff or departments' },
            { type: 'Financial Fraud', description: 'Attempts to steal financial information or money' },
            { type: 'Business Email Compromise', description: 'Targets businesses to commit fraud via email' },
            { type: 'Payment Scam', description: 'Fake payment or subscription alerts' },
            { type: 'Security Follow-Up', description: 'Pretends to be a follow-up to a previous security issue' },
            { type: 'Account Activity', description: 'Fake notifications about account activity' },
            { type: 'Spear Phishing', description: 'Targeted phishing attacks using personal information' },
            { type: 'Legitimate Security Alert', description: 'Real security notification (safe)' },
            { type: 'MFA Verification', description: 'Legitimate multi-factor authentication request (safe)' },
            { type: 'Internal Announcement', description: 'Safe internal company announcement' },
            { type: 'Legitimate Vendor Reward', description: 'Authentic gift card or reward from known vendor (safe)' }
        ];

        const attackTypeMap = new Map();
        for (const at of attackTypes) {
            // Check if it exists already
            const existing = await client.query(
                `SELECT "id" FROM ${schema}.${atTable} WHERE "attacktype" = $1`,
                [at.type]
            );

            if (existing.rows.length > 0) {
                attackTypeMap.set(at.type, existing.rows[0].id);
            } else {
                const result = await client.query(
                    `INSERT INTO ${schema}.${atTable} ("attacktype", "description", "timestamp") 
                     VALUES ($1, $2, NOW()) 
                     RETURNING "id"`,
                    [at.type, at.description]
                );
                attackTypeMap.set(at.type, result.rows[0].id);
            }
        }

        // 2. LOAD SCENARIOS FROM JSON
        const scenariosPath = path.resolve(process.cwd(), 'server/data/scenarios.json');
        console.log(`Loading scenarios from: ${scenariosPath}`);

        const scenariosContent = fs.readFileSync(scenariosPath, 'utf-8');
        const scenarios = JSON.parse(scenariosContent);

        for (const scenario of scenarios) {
            const attackTypeId = attackTypeMap.get(scenario.type);
            if (!attackTypeId) {
                console.warn(`Attack type not found: ${scenario.type} for scenario ${scenario.id}`);
                continue;
            }

            // UPSERT PhishingScenario
            const queryText = `
                INSERT INTO ${schema}.${psTable} 
                ("attacktypeid", "attackbody", "difficultylevel", 
                 "sender", "senderemail", "initials", "subject", "preview", 
                 "educationalmessage", "hint", "isphishing", "externalid", "timestamp",
                 "attackcontext", "attackquestion", "answer") 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), $13, $14, $15)
                ON CONFLICT ("externalid") DO UPDATE SET
                    "attacktypeid" = EXCLUDED."attacktypeid",
                    "attackbody" = EXCLUDED."attackbody",
                    "difficultylevel" = EXCLUDED."difficultylevel",
                    "sender" = EXCLUDED."sender",
                    "senderemail" = EXCLUDED."senderemail",
                    "initials" = EXCLUDED."initials",
                    "subject" = EXCLUDED."subject",
                    "preview" = EXCLUDED."preview",
                    "educationalmessage" = EXCLUDED."educationalmessage",
                    "hint" = EXCLUDED."hint",
                    "isphishing" = EXCLUDED."isphishing",
                    "attackcontext" = EXCLUDED."attackcontext",
                    "attackquestion" = EXCLUDED."attackquestion",
                    "answer" = EXCLUDED."answer"
                RETURNING "id"`;

            const scenarioResult = await client.query(queryText, [
                attackTypeId,
                scenario.body,
                scenario.difficulty.toString(),
                scenario.sender,
                scenario.sender_email,
                scenario.initials,
                scenario.subject,
                scenario.preview,
                scenario.educationalMessage,
                scenario.hint || null,
                scenario.isPhishing,
                scenario.id,
                `Email from ${scenario.sender}`,
                scenario.subject,
                scenario.isPhishing ? 'Phishing' : 'Safe'
            ]
            );

            // Update Red Flags (Delete existing and re-insert)
            if (scenarioResult.rows.length > 0) {
                const scenarioId = scenarioResult.rows[0].id;

                // Clear existing flags for this scenario
                await client.query(`DELETE FROM ${schema}.${siTable} WHERE "phishingscenarioid" = $1`, [scenarioId]);

                if (scenario.redFlags && scenario.redFlags.length > 0) {
                    for (const flag of scenario.redFlags) {
                        await client.query(
                            `INSERT INTO ${schema}.${siTable} ("phishingscenarioid", "warningsign", "timestamp")
                             VALUES ($1, $2, NOW())`,
                            [scenarioId, flag]
                        );
                    }
                }
            }
        }

        await client.query('COMMIT');
        return { success: true, message: `Database seeded successfully! ${scenarios.length} scenarios processed.` };

    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Seed error:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to seed database',
            data: {
                message: error.message,
                stack: error.stack,
                detail: error.detail,
                table: error.table,
                column: error.column
            }
        });
    } finally {
        client.release();
    }
});
