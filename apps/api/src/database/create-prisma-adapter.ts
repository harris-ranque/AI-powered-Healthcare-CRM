import { PrismaPg } from '@prisma/adapter-pg';
import type { SqlDriverAdapterFactory } from '@prisma/client/runtime/client';
import { Pool } from 'pg';

type PgAdapterConstructor = new (pool: Pool) => SqlDriverAdapterFactory;

const PgAdapter = PrismaPg as unknown as PgAdapterConstructor;

export function createPrismaPgAdapter(
  connectionString: string,
): SqlDriverAdapterFactory {
  const pool = new Pool({ connectionString });
  return new PgAdapter(pool);
}
