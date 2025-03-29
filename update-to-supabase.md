# Migration Guide: Repl.it PostgreSQL to Supabase

This guide outlines the steps required to migrate your PrayerPipeline application from Repl.it's PostgreSQL to Supabase.

## Step 1: Create a Supabase Project

1. Go to the [Supabase dashboard](https://app.supabase.com/) and sign up if you haven't already.
2. Create a new project, selecting your desired region and database password.
3. Wait for your project to be provisioned.

## Step 2: Set Up the Database Schema

1. In your Supabase project, navigate to the SQL Editor.
2. Copy the entire contents of the `supabase-schema.sql` file we've generated.
3. Paste it into a new SQL query.
4. Click "Run" to execute the SQL script and create all the tables and relationships.

## Step 3: Export Data from Repl.it

Run these commands in your Repl.it console to export your data:

```bash
# Export each table as CSV (run on Repl.it)
pg_dump --dbname $DATABASE_URL --table=users --data-only --format=csv > users.csv
pg_dump --dbname $DATABASE_URL --table=organizations --data-only --format=csv > organizations.csv
pg_dump --dbname $DATABASE_URL --table=organization_members --data-only --format=csv > organization_members.csv
pg_dump --dbname $DATABASE_URL --table=groups --data-only --format=csv > groups.csv
pg_dump --dbname $DATABASE_URL --table=group_members --data-only --format=csv > group_members.csv
pg_dump --dbname $DATABASE_URL --table=organization_tags --data-only --format=csv > organization_tags.csv
pg_dump --dbname $DATABASE_URL --table=group_tags --data-only --format=csv > group_tags.csv
pg_dump --dbname $DATABASE_URL --table=prayer_requests --data-only --format=csv > prayer_requests.csv
pg_dump --dbname $DATABASE_URL --table=comments --data-only --format=csv > comments.csv
pg_dump --dbname $DATABASE_URL --table=notifications --data-only --format=csv > notifications.csv
pg_dump --dbname $DATABASE_URL --table=praying_for --data-only --format=csv > praying_for.csv
pg_dump --dbname $DATABASE_URL --table=push_subscriptions --data-only --format=csv > push_subscriptions.csv
pg_dump --dbname $DATABASE_URL --table=push_tokens --data-only --format=csv > push_tokens.csv
pg_dump --dbname $DATABASE_URL --table=notification_preferences --data-only --format=csv > notification_preferences.csv
pg_dump --dbname $DATABASE_URL --table=group_notification_preferences --data-only --format=csv > group_notification_preferences.csv
pg_dump --dbname $DATABASE_URL --table=password_reset_tokens --data-only --format=csv > password_reset_tokens.csv
pg_dump --dbname $DATABASE_URL --table=favorite_groups --data-only --format=csv > favorite_groups.csv
pg_dump --dbname $DATABASE_URL --table=meetings --data-only --format=csv > meetings.csv
pg_dump --dbname $DATABASE_URL --table=meeting_notes --data-only --format=csv > meeting_notes.csv
pg_dump --dbname $DATABASE_URL --table=prayer_reminders --data-only --format=csv > prayer_reminders.csv
```

Download these CSV files from your Repl.it environment.

## Step 4: Import Data to Supabase

1. In your Supabase project, navigate to the Table Editor.
2. For each table:
   - Click on the table
   - Go to "Table Options" (3 dots) > "Import Data"
   - Upload the corresponding CSV file
   - Map the columns correctly
   - Complete the import

**Important**: Make sure to import tables in the correct order to satisfy foreign key constraints:
1. users 
2. organizations
3. organization_members
4. organization_tags
5. groups
... and so on.

## Step 5: Update Application Connection Details

1. Update your .env file to use the Supabase connection details:

```
DATABASE_URL=postgresql://<db_user>:<db_password>@<db_host>:<db_port>/<db_name>
```

You can find this connection string in your Supabase dashboard under:
Project Settings > Database > Connection string > URI

2. Update your server/db.ts file:

```typescript
import { Pool } from 'pg';  // Update this line if you were using Neon
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }  // Add this for Supabase
});
export const db = drizzle(pool, { schema });
```

3. Update your server/storage.ts file's session configuration:

```typescript
this.sessionStore = new PostgresSessionStore({
  conObject: {
    connectionString: process.env.DATABASE_URL as string,
    ssl: { rejectUnauthorized: false }  // Add this for Supabase
  },
  createTableIfMissing: true
});
```

## Step 6: Test the Migration

1. Start your application locally:
   ```bash
   npm start
   ```

2. Make sure all functionality is working properly:
   - User authentication
   - Creating and viewing prayer requests
   - Group functionality
   - Notifications
   - Any other core features

## Step 7: Deploy Your Updated Application

Once you've verified that everything works locally, deploy your updated application:

1. Update any environment variables in your production environment
2. Deploy your updated code

## Troubleshooting

- **Connection Issues**: If you encounter connection errors, make sure your Supabase database is allowing connections from your application's IP address. You may need to adjust the firewall settings.
- **SSL Issues**: Supabase requires SSL connections. Ensure the `ssl: { rejectUnauthorized: false }` setting is included.
- **Missing Packages**: If you get errors about missing packages, you may need to install `pg` or update `@neondatabase/serverless` to `pg`.

```bash
npm install pg
npm uninstall @neondatabase/serverless
```

## Additional Considerations

- **RLS Policies**: Supabase uses Row Level Security (RLS) for enhanced security. Consider implementing RLS policies for your tables.
- **Supabase Auth**: You may want to consider using Supabase Auth in the future instead of your custom auth system.
- **Supabase Storage**: For any file storage needs, consider using Supabase Storage.
- **Backups**: Set up a backup schedule for your Supabase database. 