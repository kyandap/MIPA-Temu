const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');

const { createRecord } = require('../controllers/custodyController');
const { custodySchema } = require('../schemas/custodySchema');

router.post(
  '/',
  authenticate,
  authorize('PETUGAS'),
  validate(custodySchema),
  createRecord
);

module.exports = router;