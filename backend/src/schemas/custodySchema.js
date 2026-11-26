const { z } = require('zod');

const custodySchema = z.object({
  itemId: z.number().int().positive(),
  fromLocation: z.string().trim().min(2).max(100),
  toLocation: z.string().trim().min(2).max(100),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});

module.exports = {
  custodySchema,
};