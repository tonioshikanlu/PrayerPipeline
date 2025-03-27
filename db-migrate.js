// This script performs a migration using Drizzle in a simpler way
// without the interactive prompt

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from './shared/schema.js';

// For migrations
const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });

// For query purposes
const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client, { schema });

async function main() {
  // Perform the migration
  console.log('Running migration...');
  await migrate(drizzle(migrationClient), { migrationsFolder: './drizzle' });
  console.log('Migration complete!');
  
  process.exit(0);
}

main().catch(e => {
  console.error('Migration failed:');
  console.error(e);
  process.exit(1);
});