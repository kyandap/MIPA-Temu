const {
  getCategories,
  getItems,
  reportItem,
} = require('../services/itemService');

async function categories(req, res, next) {
  try {
    const data = await getCategories();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

async function catalog(req, res, next) {
  try {
    const data = await getItems();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

async function report(req, res, next) {
  try {
    const result = await reportItem(
      req.body,
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

module.exports = {
  categories,
  catalog,
  report,
};