import 'dotenv/config';
import pool from './index.js';

async function migrate() {
  await pool.query(`
    -- USERS (AUTH CORE)
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','agent')),
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- REFRESH TOKENS (AUTH SESSION LAYER)
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL,
      revoked BOOLEAN DEFAULT FALSE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- FIELDS
    CREATE TABLE IF NOT EXISTS fields (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      crop_type TEXT NOT NULL,
      planting_date DATE NOT NULL,
      current_stage TEXT NOT NULL DEFAULT 'Planted'
        CHECK(current_stage IN ('Planted','Growing','Ready','Harvested')),
      assigned_agent_id INT REFERENCES users(id) ON DELETE SET NULL,
      created_by INT NOT NULL REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- OBSERVATIONS
    CREATE TABLE IF NOT EXISTS observations (
      id SERIAL PRIMARY KEY,
      field_id INT NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
      agent_id INT NOT NULL REFERENCES users(id),
      note TEXT NOT NULL,
      stage_at_time TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    ALTER TABLE fields ADD CONSTRAINT IF NOT EXISTS fields_name_unique UNIQUE (name);
    ALTER TABLE observations ADD CONSTRAINT IF NOT EXISTS observations_unique UNIQUE (field_id, note);
  `);


  console.log('Migration complete.');
  await pool.end();
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});