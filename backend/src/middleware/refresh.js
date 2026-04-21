export async function refresh(req, res) {
    const { token } = req.body
  
    const stored = await pool.query(
      `SELECT * FROM refresh_tokens
       WHERE token = $1 AND revoked = false`,
      [token]
    )
  
    const record = stored.rows[0]
    if (!record) return res.status(403).json({ error: 'Invalid refresh token' })
  
    try {
      const decoded = jwt.verify(token, process.env.REFRESH_SECRET)
  
      const { rows } = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [decoded.id]
      )
  
      const user = rows[0]
  
      // ROTATE TOKEN
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
  
      res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken })
  
    } catch {
      res.status(403).json({ error: 'Expired refresh token' })
    }
  }