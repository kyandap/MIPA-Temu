const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');

const {
  categories,
  catalog,
  readyForHandover,
  report,
} = require('../controllers/itemController');

const { reportItemSchema } = require('../schemas/itemSchema');

// Kategori publik
router.get('/categories', categories);

// Katalog publik
router.get('/', catalog);

// Daftar barang siap serah terima (petugas)
router.get(
  '/ready-for-handover',
  authenticate,
  authorize('OFFICER'),
  readyForHandover
);

// Laporkan barang
router.post(
  '/',
  authenticate,
  authorize('MAHASISWA', 'PETUGAS', 'ADMIN'),
  validate(reportItemSchema),
  report
);

module.exports = router;