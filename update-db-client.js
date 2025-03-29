#!/usr/bin/env node

/**
 * This script updates your database client from @neondatabase/serverless to pg
 * Run it after installing the pg package:
 * npm install pg
 * node update-db-client.js
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to your server/db.ts file
const dbFilePath = path.join(__dirname, 'server', 'db.ts');

async function main() {
  try {
    // Read the current content
    let dbFileContent = await fs.readFile(dbFilePath, 'utf8');

    // Update imports
    dbFileContent = dbFileContent.replace(
      "import { Pool, neonConfig } from '@neondatabase/serverless';",
      "import { Pool } from 'pg';"
    );

    // Remove Neon-specific configuration
    dbFileContent = dbFileContent.replace(
      "import ws from \"ws\";\n",
      ""
    );

    dbFileContent = dbFileContent.replace(
      "neonConfig.webSocketConstructor = ws;\n",
      ""
    );

    // Update pool initialization to include SSL options
    dbFileContent = dbFileContent.replace(
      "export const pool = new Pool({ connectionString: process.env.DATABASE_URL });",
      "export const pool = new Pool({ \n  connectionString: process.env.DATABASE_URL,\n  ssl: { rejectUnauthorized: false }\n});"
    );

    // Update drizzle
    dbFileContent = dbFileContent.replace(
      "import { drizzle } from 'drizzle-orm/neon-serverless';",
      "import { drizzle } from 'drizzle-orm/node-postgres';"
    );

    // Write the updated content back to the file
    await fs.writeFile(dbFilePath, dbFileContent);

    console.log('✅ Updated server/db.ts to use pg package instead of @neondatabase/serverless');

    // Update storage.ts to include SSL options
    const storageFilePath = path.join(__dirname, 'server', 'storage.ts');

    // Check if the file exists
    try {
      let storageFileContent = await fs.readFile(storageFilePath, 'utf8');
      
      // Update PostgresSessionStore configuration
      storageFileContent = storageFileContent.replace(
        "conObject: {\n      connectionString: process.env.DATABASE_URL as string\n    },",
        "conObject: {\n      connectionString: process.env.DATABASE_URL as string,\n      ssl: { rejectUnauthorized: false }\n    },"
      );
      
      // Write the updated content back to the file
      await fs.writeFile(storageFilePath, storageFileContent);
      
      console.log('✅ Updated server/storage.ts to include SSL options for PostgresSessionStore');
    } catch (err) {
      console.log('⚠️ Could not update storage.ts, file might not exist:', err.message);
    }

    // Update package.json
    const packageJsonPath = path.join(__dirname, 'package.json');

    try {
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageJsonContent);
      
      // Check if @neondatabase/serverless is in dependencies
      if (packageJson.dependencies && packageJson.dependencies['@neondatabase/serverless']) {
        console.log('ℹ️ Don\'t forget to update your dependencies:');
        console.log('npm uninstall @neondatabase/serverless');
        console.log('npm install pg');
      }
    } catch (err) {
      console.log('⚠️ Could not check package.json:', err.message);
    }

    console.log('🎉 Done! Update to Supabase is ready.');
  } catch (err) {
    console.error('❌ Error updating files:', err);
  }
}

main(); 