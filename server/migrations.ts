import { db, pool } from "./db";
import { sql } from "drizzle-orm";

export async function runMigrations() {
  console.log("Running database migrations...");
  
  try {
    // Check if is_recurring column exists in meetings table
    const result = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'meetings' AND column_name = 'is_recurring'
    `);
    
    if (result.rows.length === 0) {
      console.log("Adding is_recurring column to meetings table...");
      await pool.query(`
        ALTER TABLE meetings 
        ADD COLUMN is_recurring BOOLEAN NOT NULL DEFAULT false
      `);
      console.log("is_recurring column added successfully");
    } else {
      console.log("is_recurring column already exists");
    }
    
    // Check if other columns exist and add them if needed
    const recurringPatternResult = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'meetings' AND column_name = 'recurring_pattern'
    `);
    
    if (recurringPatternResult.rows.length === 0) {
      console.log("Adding recurring_pattern column to meetings table...");
      await pool.query(`
        ALTER TABLE meetings 
        ADD COLUMN recurring_pattern TEXT DEFAULT NULL
      `);
      console.log("recurring_pattern column added successfully");
    }
    
    const recurringDayResult = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'meetings' AND column_name = 'recurring_day'
    `);
    
    if (recurringDayResult.rows.length === 0) {
      console.log("Adding recurring_day column to meetings table...");
      await pool.query(`
        ALTER TABLE meetings 
        ADD COLUMN recurring_day INTEGER DEFAULT NULL
      `);
      console.log("recurring_day column added successfully");
    }
    
    const recurringUntilResult = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'meetings' AND column_name = 'recurring_until'
    `);
    
    if (recurringUntilResult.rows.length === 0) {
      console.log("Adding recurring_until column to meetings table...");
      await pool.query(`
        ALTER TABLE meetings 
        ADD COLUMN recurring_until TIMESTAMP DEFAULT NULL
      `);
      console.log("recurring_until column added successfully");
    }
    
    const parentMeetingIdResult = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'meetings' AND column_name = 'parent_meeting_id'
    `);
    
    if (parentMeetingIdResult.rows.length === 0) {
      console.log("Adding parent_meeting_id column to meetings table...");
      await pool.query(`
        ALTER TABLE meetings 
        ADD COLUMN parent_meeting_id INTEGER DEFAULT NULL
      `);
      console.log("parent_meeting_id column added successfully");
    }
    
    console.log("All migrations completed successfully");
  } catch (error) {
    console.error("Error running migrations:", error);
    throw error;
  }
}