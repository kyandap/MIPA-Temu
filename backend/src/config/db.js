const oracledb = require('oracledb');
require('dotenv').config();

// Agar hasil query SELECT otomatis berbentuk JSON object (bukan array)
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
// Agar setiap INSERT/UPDATE otomatis tersimpan (commit)
oracledb.autoCommit = true;

async function getConnection() {
  return await oracledb.getConnection({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECT_STRING,
  });
}

module.exports = { getConnection };