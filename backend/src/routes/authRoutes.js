const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/db');

// REGISTER USER BARU
router.post('/register', async (req, res) => {
  const { full_name, npm, email, password, role } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const userRole = role || 'MAHASISWA';
    await conn.execute(
      `INSERT INTO USERS (full_name, npm, email, password, role) 
       VALUES (:full_name, :npm, :email, :password, :role)`,
      { full_name, npm, email, password, role: userRole }
    );
    res.status(201).json({ success: true, message: 'Registrasi berhasil!' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// LOGIN USER
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT user_id, full_name, npm, email, role 
       FROM USERS WHERE email = :email AND password = :password`,
      { email, password }
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Email atau password salah!' });
    }
    res.json({ success: true, message: 'Login berhasil!', user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;