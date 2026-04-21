export async function logout(req, res) {
    const { token } = req.body
  
    await pool.query(
      'UPDATE refresh_tokens SET revoked = true WHERE token = $1',
      [token]
    )
  
    res.json({ success: true })
  }