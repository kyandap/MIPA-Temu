const { z } = require('zod');

const submitClaimSchema = z.object({
  itemId: z.number().int().positive(),
});

const verifyClaimSchema = z.object({
  claimId: z.number().int().positive(),
  secretAnswer: z.string().trim().min(1).max(255),
});

const decisionClaimSchema = z.object({
  claimId: z.number().int().positive(),
});

module.exports = {
  submitClaimSchema,
  verifyClaimSchema,
  decisionClaimSchema,
};