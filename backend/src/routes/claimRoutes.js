const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');

const {
  submit,
  verify,
  approve,
  reject,
} = require('../controllers/claimController');

const {
  submitClaimSchema,
  verifyClaimSchema,
  decisionClaimSchema,
} = require('../schemas/claimSchema');

// Semua route klaim wajib memiliki token
router.use(authenticate);

// Ajukan klaim
router.post(
  '/submit',
  authorize('MAHASISWA'),
  validate(submitClaimSchema),
  submit
);

// Verifikasi jawaban rahasia milik klaim sendiri
router.post(
  '/verify',
  authorize('MAHASISWA'),
  validate(verifyClaimSchema),
  verify
);

// Persetujuan klaim oleh admin
router.post(
  '/approve',
  authorize('ADMIN'),
  validate(decisionClaimSchema),
  approve
);

// Penolakan klaim oleh admin
router.post(
  '/reject',
  authorize('ADMIN'),
  validate(decisionClaimSchema),
  reject
);

module.exports = router;