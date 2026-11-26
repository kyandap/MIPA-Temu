const { z } = require('zod');

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  npm: z.string().trim().max(20).optional().or(z.literal('')),
  email: z.string().trim().email().max(100),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(100),
  password: z.string().min(1).max(128),
});

module.exports = {
  registerSchema,
  loginSchema,
};