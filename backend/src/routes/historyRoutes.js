const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const {
  claims,
  custody,
  handovers,
} = require('../controllers/historyController');

router.use(authenticate);

router.get(
  '/claims',
  authorize('MAHASISWA', 'PETUGAS', 'ADMIN'),
  claims
);

router.get(
  '/custody',
  authorize('MAHASISWA', 'PETUGAS', 'ADMIN'),
  custody
);

router.get(
  '/handovers',
  authorize('MAHASISWA', 'PETUGAS', 'ADMIN'),
  handovers
);

module.exports = router;