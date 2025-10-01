// Database configuration file
export const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Admin1234',
  database: process.env.DB_NAME || 'bakery',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

export const databaseUrl = process.env.DATABASE_URL || 
  `postgresql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;

// Ensure DATABASE_URL is set for Prisma
if (typeof process !== 'undefined' && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = databaseUrl;
}
