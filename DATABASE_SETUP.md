# Bakery Application - Database Setup

## Environment Configuration

Create a `.env` file in the root directory with the following configuration:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:Admin1234@127.0.0.1:5432/bakery

# Database Connection Parameters
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=Admin1234
DB_NAME=bakery

# Environment
NODE_ENV=development
```

## Database Setup Instructions

1. **Install PostgreSQL** (if not already installed)
2. **Create the database**:
   ```sql
   CREATE DATABASE bakery;
   ```
3. **Copy the environment variables** from `.env.example` to `.env`
4. **Generate Prisma client**:
   ```bash
   npx prisma generate
   ```
5. **Run database migrations** (when you add models):
   ```bash
   npx prisma migrate dev
   ```

## Database Connection

The application uses two approaches for database connectivity:

1. **Prisma ORM** - For complex queries and migrations
2. **Direct PostgreSQL connection** - For simple queries and connection testing

### Files Created:
- `src/lib/db-config.ts` - Database configuration
- `src/lib/database.ts` - PostgreSQL connection pool
- `prisma/schema.prisma` - Prisma schema file
- `.env.example` - Environment variables template

## Next Steps

1. Create your `.env` file with the database credentials
2. Define your database models in `prisma/schema.prisma`
3. Run `npx prisma migrate dev` to create tables
4. Start building your bakery application features
