const { z } = require('zod');

const createHandoverSchema = z.object({
  itemId: z.number().int().positive(),
});

const confirmHandoverSchema = z.object({
  handoverId: z.number().int().positive(),
  code: z.string().trim().length(6),
});

module.exports = {
  createHandoverSchema,
  confirmHandoverSchema,
};