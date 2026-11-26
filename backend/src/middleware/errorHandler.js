function errorHandler(err, req, res, next) {
  console.error(err);

  const statusCode = err.status || 500;

  res.status(statusCode).json({
    success: false,
    message:
      statusCode < 500
        ? err.message
        : 'Terjadi kesalahan pada server.',
  });
}

module.exports = errorHandler;