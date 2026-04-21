import pool from '../db/index.js'
import { computeStatus } from '../helpers/status.js'

const enrichField = async (field) => {
  const { rows } = await pool.query(
    'SELECT created_at FROM observations WHERE field_id = $1 ORDER BY created_at DESC LIMIT 1',
    [field.id]
  )

  return {
    ...field,
    status: computeStatus(
      field.current_stage,
      rows[0]?.created_at,
      field.planting_date
    )
  }
}

/* List Fields*/
export const listFields = async (req, res) => {
  const isAdmin = req.user.role === 'admin'

  const { rows } = isAdmin
    ? await pool.query(`
        SELECT f.*, u.name AS agent_name
        FROM fields f
        LEFT JOIN users u ON f.assigned_agent_id = u.id
        ORDER BY f.id
      `)
    : await pool.query(`
        SELECT f.*, u.name AS agent_name
        FROM fields f
        LEFT JOIN users u ON f.assigned_agent_id = u.id
        WHERE f.assigned_agent_id = $1
        ORDER BY f.id
      `, [req.user.id])

  res.json(await Promise.all(rows.map(enrichField)))
}

/* Get field */
export const getField = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT f.*, u.name AS agent_name
     FROM fields f
     LEFT JOIN users u ON f.assigned_agent_id = u.id
     WHERE f.id = $1`,
    [req.params.id]
  )

  const field = rows[0]
  if (!field) return res.status(404).json({ error: 'Not found' })

  if (req.user.role === 'agent' && field.assigned_agent_id !== req.user.id)
    return res.status(403).json({ error: 'Forbidden' })

  const { rows: observations } = await pool.query(
    `SELECT o.*, u.name AS agent_name
     FROM observations o
     JOIN users u ON o.agent_id = u.id
     WHERE o.field_id = $1
     ORDER BY o.created_at DESC`,
    [field.id]
  )

  res.json({
    ...(await enrichField(field)),
    observations
  })
}

/* Create Field */
export const createField = async (req, res) => {
  const { name, crop_type, planting_date, assigned_agent_id } = req.body

  if (!name || !crop_type || !planting_date)
    return res.status(400).json({ error: 'Missing required fields' })

  const { rows } = await pool.query(
    `INSERT INTO fields
     (name, crop_type, planting_date, assigned_agent_id, created_by)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id`,
    [name, crop_type, planting_date, assigned_agent_id || null, req.user.id]
  )

  res.status(201).json({ id: rows[0].id })
}

/* Delete Field */
export const deleteField = async (req, res) => {
  await pool.query('DELETE FROM fields WHERE id = $1', [req.params.id])
  res.json({ success: true })
}

/* Update stage */
export const updateStage = async (req, res) => {
  const { stage } = req.body
  const valid = ['Planted', 'Growing', 'Ready', 'Harvested']

  if (!valid.includes(stage))
    return res.status(400).json({ error: 'Invalid stage' })

  const { rows } = await pool.query(
    'SELECT * FROM fields WHERE id = $1',
    [req.params.id]
  )

  const field = rows[0]
  if (!field) return res.status(404).json({ error: 'Not found' })

  if (req.user.role === 'agent' && field.assigned_agent_id !== req.user.id)
    return res.status(403).json({ error: 'Forbidden' })

  await pool.query(
    'UPDATE fields SET current_stage = $1, updated_at = NOW() WHERE id = $2',
    [stage, field.id]
  )

  res.json({ success: true })
}

/* Add Observation */
export const addObservation = async (req, res) => {
  const { note } = req.body

  if (!note)
    return res.status(400).json({ error: 'note required' })

  const { rows } = await pool.query(
    'SELECT * FROM fields WHERE id = $1',
    [req.params.id]
  )

  const field = rows[0]
  if (!field) return res.status(404).json({ error: 'Not found' })

  if (req.user.role === 'agent' && field.assigned_agent_id !== req.user.id)
    return res.status(403).json({ error: 'Forbidden' })

  const { rows: obs } = await pool.query(
    `INSERT INTO observations
     (field_id, agent_id, note, stage_at_time)
     VALUES ($1,$2,$3,$4)
     RETURNING id`,
    [field.id, req.user.id, note, field.current_stage]
  )

  res.status(201).json({ id: obs[0].id })
}

/* List agents */
export const listAgents = async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, name, email FROM users WHERE role = $1',
    ['agent']
  )

  res.json(rows)
}