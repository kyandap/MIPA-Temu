const {
  submitClaim,
  verifyClaim,
  approveClaim,
  rejectClaim,
} = require('../services/claimService');

async function submit(req, res, next) {
  try {
    const result = await submitClaim(
      req.body.itemId,
      req.user.userId
    );

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

async function verify(req, res, next) {
  try {
    const result = await verifyClaim(
      req.body.claimId,
      req.user.userId,
      req.body.secretAnswer
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

async function approve(req, res, next) {
  try {
    const result = await approveClaim(req.body.claimId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

async function reject(req, res, next) {
  try {
    const result = await rejectClaim(req.body.claimId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  submit,
  verify,
  approve,
  reject,
};