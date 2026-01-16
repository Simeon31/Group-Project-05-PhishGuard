import pg from 'pg';

export const useDb = () => {
    const config = useRuntimeConfig();
    const connectionString = config.databaseUrl || process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('CRITICAL ERROR: DATABASE_URL is not defined!');
        throw new Error('DATABASE_URL missing');
    }

    // Use a connection pool for better performance in serverless/Nuxt environments
    return new pg.Pool({
        connectionString,
    });
};
