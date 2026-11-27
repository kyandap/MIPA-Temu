const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { getConnection } = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const claimRoutes = require('./routes/claimRoutes');
const handoverRoutes = require('./routes/handoverRoutes');
const custodyRoutes = require('./routes/custodyRoutes');
const historyRoutes = require('./routes/historyRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  })
);

// JSON limit
app.use(express.json({ limit: '10kb' }));

// Health check
app.get('/api/health', async (req, res, next) => {
  let conn;

  try {
    conn = await getConnection();

    const result = await conn.execute(
      `SELECT 'Koneksi Oracle Berhasil!' AS STATUS FROM DUAL`
    );

    res.status(200).json({
      success: true,
      oracle: result.rows[0].STATUS,
    });
  } catch (err) {
    next(err);
  } finally {
    if (conn) {
      await conn.close();
    }
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/handovers', handoverRoutes);
app.use('/api/custody', custodyRoutes);
app.use('/api/history', historyRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan.',
  });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;