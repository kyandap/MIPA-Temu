const { z } = require('zod');

const reportItemSchema = z.object({
  categoryId: z.number().int().positive(),
  itemName: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  secretQuestion: z.string().trim().min(5).max(255),
  secretAnswer: z.string().trim().min(1).max(255),
  photo: z.string().trim().max(255).optional().or(z.literal('')),
  locationFound: z.string().trim().min(2).max(100),
  dateFound: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
    .refine((date) => {
      const parsed = new Date(`${date}T00:00:00Z`);
      return !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === date;
    }, 'Tanggal tidak valid'),
});

module.exports = {
  reportItemSchema,
};