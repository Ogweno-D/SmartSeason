import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../db/index.js'

// Login
export async function login(req, res) {
  const { email, password } = req.body

  try {
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
      user: {
        id: user.id,
        role: user.role,
        email: user.email
      }
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
}

// Register
export async function register(req, res) {
  const { email, password, role } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' })
  }

  try {
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const { rows } = await pool.query(
      `INSERT INTO users (email, password, role)
       VALUES ($1, $2, $3)
       RETURNING id, email, role`,
      [email, hashedPassword, role || 'user']
    )

    const user = rows[0]

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

    res.status(201).json({
      user,
      accessToken,
      refreshToken
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
}

// Logout
export async function logout(req, res) {
  const { token } = req.body

  if (!token) {
    return res.status(400).json({ error: 'No token provided' })
  }

  try {
    await pool.query(
      'UPDATE refresh_tokens SET revoked = true WHERE token = $1',
      [token]
    )

    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
}


// Refresh token
export async function refresh(req, res) {
  const { token } = req.body

  if (!token) {
    return res.status(400).json({ error: 'No token provided' })
  }

  try {
    const stored = await pool.query(
      `SELECT * FROM refresh_tokens
       WHERE token = $1 AND revoked = false`,
      [token]
    )

    const record = stored.rows[0]
    if (!record) {
      return res.status(403).json({ error: 'Invalid refresh token' })
    }

    const decoded = jwt.verify(token, process.env.REFRESH_SECRET)

    const { rows } = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [decoded.id]
    )

    const user = rows[0]
    if (!user) {
      return res.status(403).json({ error: 'User not found' })
    }

    await pool.query(
      'UPDATE refresh_tokens SET revoked = true WHERE token = $1',
      [token]
    )

    const newAccessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    )

    const newRefreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_SECRET,
      { expiresIn: '7d' }
    )

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1,$2,NOW() + interval '7 days')`,
      [user.id, newRefreshToken]
    )

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    })

  } catch (err) {
    console.error(err)
    return res.status(403).json({ error: 'Expired or invalid refresh token' })
  }
}