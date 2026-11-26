const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const validate = require('../middleware/validate');

const {
  register,
  login,
} = require('../controllers/authController');

const {
  registerSchema,
  loginSchema,
} = require('../schemas/authSchema');

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan registrasi.',
  },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login. Coba lagi nanti.',
  },
});

// Registrasi
router.post(
  '/register',
  registerLimiter,
  validate(registerSchema),
  register
);

// Login
router.post(
  '/login',
  loginLimiter,
  validate(loginSchema),
  login
);

module.exports = router;