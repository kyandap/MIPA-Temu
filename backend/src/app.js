const express = require('express');
const cors = require('cors');
const { getConnection } = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const claimRoutes = require('./routes/claimRoutes');
const handoverRoutes = require('./routes/handoverRoutes');
const custodyRoutes = require('./routes/custodyRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Endpoint untuk mengetes apakah backend & Oracle sudah terhubung
app.get('/api/health', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(`SELECT 'Koneksi Oracle Berhasil!' AS STATUS FROM DUAL`);
    res.json({ success: true, oracle: result.rows[0].STATUS });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal terhubung ke Oracle', error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// Daftarkan semua rute API
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/handovers', handoverRoutes);
app.use('/api/custody', custodyRoutes);

module.exports = app;