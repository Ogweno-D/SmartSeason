require('dotenv').config();
import { query, end } from './index';
import { hashSync } from 'bcryptjs';

const hash = (p) => hashSync(p, 10);

async function seed() {
  const users = [
    { name: 'Admin User', email: 'admin@smartseason.com', password: hash('admin123'), role: 'admin' },
    { name: 'Alice Kamau', email: 'alice@smartseason.com', password: hash('agent123'), role: 'agent' },
    { name: 'Brian Otieno', email: 'brian@smartseason.com', password: hash('agent123'), role: 'agent' },
  ];

  for (const u of users) {
    await query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (email) DO NOTHING`,
      [u.name, u.email, u.password, u.role]
    );
  }

  const { rows: [alice] } = await query(`SELECT id FROM users WHERE email = $1`, ['alice@smartseason.com']);
  const { rows: [brian] } = await query(`SELECT id FROM users WHERE email = $1`, ['brian@smartseason.com']);
  const { rows: [admin] } = await query(`SELECT id FROM users WHERE email = $1`, ['admin@smartseason.com']);

  const fields = [
    { name: 'North Block A', crop_type: 'Maize', planting_date: '2025-01-10', stage: 'Growing', agent: alice.id },
    { name: 'South Valley', crop_type: 'Wheat', planting_date: '2025-01-05', stage: 'Ready', agent: alice.id },
    { name: 'East Ridge', crop_type: 'Sorghum', planting_date: '2025-02-01', stage: 'Planted', agent: brian.id },
    { name: 'Hillside Plot', crop_type: 'Beans', planting_date: '2024-12-15', stage: 'Harvested', agent: brian.id },
    { name: 'Riverside Field', crop_type: 'Sunflower', planting_date: '2025-01-20', stage: 'Growing', agent: alice.id },
  ];

  const fieldIds = [];

  for (const f of fields) {
    const { rows: [row] } = await query(
      `INSERT INTO fields (name, crop_type, planting_date, current_stage, assigned_agent_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (name)
       DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [f.name, f.crop_type, f.planting_date, f.stage, f.agent, admin.id]
    );

    fieldIds.push(row.id);
  }

  // Observation 1 (safe)
  await query(
    `INSERT INTO observations (field_id, agent_id, note, stage_at_time)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (field_id, note) DO NOTHING`,
    [fieldIds[0], alice.id, 'Healthy growth, irrigation running well.', 'Growing']
  );

  // Observation 2 (safe + deterministic timestamp)
  const tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString();

  await query(
    `INSERT INTO observations (field_id, agent_id, note, stage_at_time, created_at)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (field_id, note) DO NOTHING`,
    [fieldIds[1], alice.id, 'Crop looks ready but awaiting harvest team.', 'Ready', tenDaysAgo]
  );

  console.log('Seed complete.');
  console.log('Admin: admin@smartseason.com / admin123');
  console.log('Alice: alice@smartseason.com / agent123');
  console.log('Brian: brian@smartseason.com / agent123');

  await end();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});