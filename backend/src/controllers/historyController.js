const {
  getClaimHistory,
  getCustodyHistory,
  getHandoverHistory,
} = require('../services/historyService');

async function claims(req, res, next) {
  try {
    const data = await getClaimHistory(req.user);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

async function custody(req, res, next) {
  try {
    const data = await getCustodyHistory(req.user);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

async function handovers(req, res, next) {
  try {
    const data = await getHandoverHistory(req.user);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  claims,
  custody,
  handovers,
};