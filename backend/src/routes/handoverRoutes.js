const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');

const {
  create,
  confirm,
} = require('../controllers/handoverController');

const {
  createHandoverSchema,
  confirmHandoverSchema,
} = require('../schemas/handoverSchema');

router.use(authenticate);

// Petugas membuat serah terima
router.post(
  '/create',
  authorize('PETUGAS'),
  validate(createHandoverSchema),
  create
);

// Pemilik barang mengonfirmasi serah terima
router.post(
  '/confirm',
  authorize('MAHASISWA'),
  validate(confirmHandoverSchema),
  confirm
);

module.exports = router;