import { useDb } from '../../utils/db';
import bcrypt from 'bcryptjs';
import sanitizeHtml from 'sanitize-html';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const pool = useDb();
    const client = await pool.connect();

    try {
        const schema = '"phish-guard"';

        // 1. Sanitize Input
        const email = sanitizeHtml(body.email || '');
        const password = body.password || '';

        // 2. Validate Form (Basic)
        if (!email || !password) {
            throw createError({ statusCode: 400, message: 'Email and password are required' });
        }

        // 3. User Lookup
        const result = await client.query(
            `SELECT * FROM ${schema}."users" WHERE "email" = $1`,
            [email]
        );

        const user = result.rows[0];

        if (!user) {
            throw createError({ statusCode: 401, message: 'Invalid credentials' });
        }

        // 4. Validate Password 
        if (!user.password_hash) {
            throw createError({ statusCode: 401, message: 'Please use the Auth0 login for this account.' });
        }

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            throw createError({ statusCode: 401, message: 'Invalid credentials' });
        }

        // 5. Create Session - Set session cookie manually
        // Since we're not using nuxt-auth-utils, we'll set a simple session cookie
        setCookie(event, 'custom-auth-token', user.email, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            sameSite: 'lax'
        });

        return { success: true, user: { email: user.email, name: user.name } };

    } catch (error: any) {
        console.error('Login error:', error);
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || 'Login failed'
        });
    } finally {
        client.release();
    }
});
