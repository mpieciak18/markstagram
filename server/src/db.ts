import { PrismaClient } from './generated/prisma/client.js';
import { PrismaNeon } from '@prisma/adapter-neon';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

const databaseAdapter = (process.env.DATABASE_ADAPTER ?? 'neon').toLowerCase();

const createPrismaClient = async (): Promise<PrismaClient> => {
  if (databaseAdapter === 'direct') {
    try {
      const adapterPackage = '@prisma/adapter-pg';
      const pgPackage = 'pg';
      const [{ PrismaPg }, { Pool }] = await Promise.all([
        import(adapterPackage) as Promise<{
          PrismaPg: new (pool: unknown) => unknown;
        }>,
        import(pgPackage) as Promise<{
          Pool: new (options: { connectionString: string }) => unknown;
        }>,
      ]);

      const adapter = new PrismaPg(new Pool({ connectionString: dbUrl }));
      return new PrismaClient({ adapter: adapter as never });
    } catch (error) {
      throw new Error(
        'DATABASE_ADAPTER=direct requires @prisma/adapter-pg and pg. Install with: pnpm --filter @markstagram/server add @prisma/adapter-pg pg',
      );
    }
  }

  return new PrismaClient({
    adapter: new PrismaNeon({
      connectionString: dbUrl,
    }),
  });
};

const prisma = await createPrismaClient();

export default prisma;
