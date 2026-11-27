function errorHandler(err, req, res, next) {
  console.error(err);

  let statusCode = err.status || 500;
  let message = "Terjadi kesalahan pada server.";

  // Error validasi / akses dari backend
  if (statusCode < 500) {
    message = err.message;
  }

  // Oracle application errors (ORA-20000 sampai ORA-20999)
  const oracleAppError = err.message?.match(/ORA-20\d{3}:\s*([^\r\n]+)/);

  if (oracleAppError) {
    statusCode = 400;
    message = oracleAppError[1].trim();
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
}

module.exports = errorHandler;