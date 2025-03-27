// Script to update the database schema from enum types to text types

const { Pool } = require('pg');

async function main() {
  console.log('Starting schema update...');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  
  try {
    // Begin transaction
    await client.query('BEGIN');
    
    // Update meetings table
    console.log('Updating meetings.recurring_pattern...');
    await client.query(`
      ALTER TABLE meetings 
      ALTER COLUMN recurring_pattern TYPE text
    `);
    
    // Update groups table
    console.log('Updating groups.category and groups.privacy...');
    await client.query(`
      ALTER TABLE groups 
      ALTER COLUMN category TYPE text,
      ALTER COLUMN privacy TYPE text
    `);
    
    // Update prayer_requests table
    console.log('Updating prayer_requests.urgency and prayer_requests.status...');
    await client.query(`
      ALTER TABLE prayer_requests 
      ALTER COLUMN urgency TYPE text,
      ALTER COLUMN status TYPE text
    `);
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Schema update completed successfully!');
    
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error updating schema:', error);
    throw error;
  } finally {
    // Release client back to pool
    client.release();
  }
  
  // Close pool
  await pool.end();
}

main().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});