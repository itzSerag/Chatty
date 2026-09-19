import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { ConfigService } from '@nestjs/config';
import * as schema from './schema';
import { Logger } from '@nestjs/common';
import * as path from 'path';

export const DRIZZLE = 'DRIZZLE';

export type DrizzleDB = PostgresJsDatabase<typeof schema>;

export const drizzleProvider = {
  provide: DRIZZLE,
  inject: [ConfigService],
  useFactory: async (configService: ConfigService): Promise<DrizzleDB> => {
    const logger = new Logger('DrizzleProvider');
    const databaseUrl = configService.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }

    // Connection pool optimized for cloud container memory limits
    const client = postgres(databaseUrl, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });

    const db = drizzle(client, { schema });

    try {
      const migrationsFolder = path.resolve(process.cwd(), 'drizzle');
      await migrate(db, { migrationsFolder });
      logger.log('Database migrations applied successfully');
    } catch (err: any) {
      logger.warn(`Database migration status: ${err?.message || err}`);
    }

    return db;
  },
};
