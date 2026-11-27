const { z } = require('zod');

const createHandoverSchema = z.object({
  itemId: z.number().int().positive(),
});

const confirmHandoverSchema = z.object({
  handoverId: z.number().int().positive(),
});

module.exports = {
  createHandoverSchema,
  confirmHandoverSchema,
};