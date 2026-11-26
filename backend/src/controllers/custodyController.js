const { addCustodyRecord } = require('../services/custodyService');

async function createRecord(req, res, next) {
  try {
    const result = await addCustodyRecord({
      itemId: req.body.itemId,
      officerId: req.user.userId,
      fromLocation: req.body.fromLocation,
      toLocation: req.body.toLocation,
      notes: req.body.notes,
    });

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createRecord,
};