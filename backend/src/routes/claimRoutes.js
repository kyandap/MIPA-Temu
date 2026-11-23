const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/db');

// LIHAT RIWAYAT KLAIM (Menggunakan View VW_CLAIM_HISTORY)
router.get('/', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(`SELECT * FROM VW_CLAIM_HISTORY ORDER BY claim_date DESC`);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// 1. AJUKAN KLAIM BARANG (Memanggil SP_SUBMIT_CLAIM)
router.post('/submit', async (req, res) => {
  const { item_id, user_id } = req.body;
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `BEGIN SP_SUBMIT_CLAIM(:p_item_id, :p_user_id); END;`,
      { p_item_id: Number(item_id), p_user_id: Number(user_id) }
    );
    res.status(201).json({ success: true, message: 'Pengajuan klaim berhasil dikirim!' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// 2. VERIFIKASI JAWABAN RAHASIA KLAIM (Memanggil SP_VERIFY_CLAIM)
router.post('/verify', async (req, res) => {
  const { claim_id, is_correct } = req.body; // is_correct: 1 (benar) atau 0 (salah)
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `BEGIN SP_VERIFY_CLAIM(:p_claim_id, :p_is_correct); END;`,
      { p_claim_id: Number(claim_id), p_is_correct: Number(is_correct) }
    );
    res.json({ success: true, message: 'Verifikasi klaim diproses!' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// 3. SETUJUI KLAIM (Memanggil SP_APPROVE_CLAIM)
router.post('/approve', async (req, res) => {
  const { claim_id } = req.body;
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `BEGIN SP_APPROVE_CLAIM(:p_claim_id); END;`,
      { p_claim_id: Number(claim_id) }
    );
    res.json({ success: true, message: 'Klaim berhasil disetujui!' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// 4. TOLAK KLAIM (Memanggil SP_REJECT_CLAIM)
router.post('/reject', async (req, res) => {
  const { claim_id } = req.body;
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `BEGIN SP_REJECT_CLAIM(:p_claim_id); END;`,
      { p_claim_id: Number(claim_id) }
    );
    res.json({ success: true, message: 'Klaim ditolak!' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;