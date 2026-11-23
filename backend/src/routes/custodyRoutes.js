const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/db');

// LIHAT RIWAYAT PENITIPAN (Menggunakan View VW_CUSTODY_HISTORY)
router.get('/', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(`SELECT * FROM VW_CUSTODY_HISTORY ORDER BY custody_date DESC`);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// CATAT PENITIPAN / PERPINDAHAN BARANG (Memanggil SP_ADD_CUSTODY_RECORD)
router.post('/', async (req, res) => {
  const { item_id, officer_id, from_location, to_location, notes } = req.body;
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `BEGIN SP_ADD_CUSTODY_RECORD(:p_item_id, :p_officer_id, :p_from_location, :p_to_location, :p_notes); END;`,
      {
        p_item_id: Number(item_id),
        p_officer_id: Number(officer_id),
        p_from_location: from_location || null,
        p_to_location,
        p_notes: notes || null
      }
    );
    res.status(201).json({ success: true, message: 'Riwayat penitipan berhasil dicatat!' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;