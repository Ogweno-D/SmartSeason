import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import pool from '../db/index.js'

export async function login(req, res) {
  const { email, password } = req.body

  const { rows } = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  )

  const user = rows[0]
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  )

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.REFRESH_SECRET,
    { expiresIn: '7d' }
  )

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at)
     VALUES ($1,$2,NOW() + interval '7 days')`,
    [user.id, refreshToken]
  )

  res.json({
    accessToken,
    refreshToken,
    user: { id: user.id, role: user.role, email: user.email }
  })
}