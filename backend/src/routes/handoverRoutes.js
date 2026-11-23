const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/db');

// LIHAT RIWAYAT SERAH TERIMA (Menggunakan View VW_HANDOVER_HISTORY)
router.get('/', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(`SELECT * FROM VW_HANDOVER_HISTORY ORDER BY handover_id DESC`);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// BUAT JADWAL/DATA SERAH TERIMA (Memanggil SP_CREATE_HANDOVER)
router.post('/create', async (req, res) => {
  const { item_id, officer_id, owner_id, handover_code_hash } = req.body;
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `BEGIN SP_CREATE_HANDOVER(:p_item_id, :p_officer_id, :p_owner_id, :p_handover_code_hash); END;`,
      {
        p_item_id: Number(item_id),
        p_officer_id: Number(officer_id),
        p_owner_id: Number(owner_id),
        p_handover_code_hash
      }
    );
    res.status(201).json({ success: true, message: 'Data serah terima berhasil dibuat!' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// KONFIRMASI SERAH TERIMA SELESAI (Memanggil SP_CONFIRM_HANDOVER)
router.post('/confirm', async (req, res) => {
  const { handover_id } = req.body;
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `BEGIN SP_CONFIRM_HANDOVER(:p_handover_id); END;`,
      { p_handover_id: Number(handover_id) }
    );
    res.json({ success: true, message: 'Serah terima barang dikonfirmasi selesai!' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;