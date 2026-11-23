const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/db');

// AMBIL SEMUA KATEGORI
router.get('/categories', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(`SELECT * FROM CATEGORIES ORDER BY category_id ASC`);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// AMBIL KATALOG BARANG AKTIF (Menggunakan View VW_ITEM_CATALOG)
router.get('/', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(`SELECT * FROM VW_ITEM_CATALOG ORDER BY date_found DESC`);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// LAPOR BARANG TEMUAN BARU
router.post('/', async (req, res) => {
  const {
    user_id,
    category_id,
    item_name,
    description,
    secret_question,
    secret_answer_hash,
    photo,
    location_found,
    date_found,
    status
  } = req.body;

  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `INSERT INTO ITEMS (
        user_id, category_id, item_name, description, 
        secret_question, secret_answer_hash, photo, 
        location_found, date_found, status
      ) VALUES (
        :user_id, :category_id, :item_name, :description, 
        :secret_question, :secret_answer_hash, :photo, 
        :location_found, TO_DATE(:date_found, 'YYYY-MM-DD'), :status
      )`,
      {
        user_id,
        category_id,
        item_name,
        description: description || null,
        secret_question,
        secret_answer_hash,
        photo: photo || null,
        location_found,
        date_found,
        status: status || 'ACTIVE'
      }
    );
    res.status(201).json({ success: true, message: 'Laporan barang berhasil ditambahkan!' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;