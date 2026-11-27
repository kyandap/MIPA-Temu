const rateLimit = require('express-rate-limit');

const handoverRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan. Silakan coba lagi nanti.',
  },
});

module.exports = handoverRateLimit;