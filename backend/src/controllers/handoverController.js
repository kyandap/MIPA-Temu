const {
  createHandover,
  confirmHandover,
} = require('../services/handoverService');

async function create(req, res, next) {
  try {
    const result = await createHandover({
      itemId: req.body.itemId,
      officerId: req.user.userId,
    });

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

async function confirm(req, res, next) {
  try {
    const result = await confirmHandover({
      handoverId: req.body.handoverId,
      ownerId: req.user.userId,
      code: req.body.code,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  confirm,
};