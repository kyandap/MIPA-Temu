const bcrypt = require('bcryptjs');
const { getConnection } = require('../config/db');

async function registerUser({ fullName, npm, email, password }) {
  let conn;

  try {
    conn = await getConnection();

    const existingUser = await conn.execute(
      `SELECT USER_ID FROM USERS WHERE LOWER(EMAIL) = LOWER(:email)`,
      { email }
    );

    if (existingUser.rows.length > 0) {
      const error = new Error('Email sudah terdaftar.');
      error.status = 409;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await conn.execute(
      `INSERT INTO USERS (FULL_NAME, NPM, EMAIL, PASSWORD, ROLE)
       VALUES (:fullName, :npm, :email, :password, 'MAHASISWA')
       RETURNING USER_ID INTO :userId`,
      {
        fullName,
        npm: npm || null,
        email,
        password: hashedPassword,
        userId: {
          type: require('oracledb').NUMBER,
          dir: require('oracledb').BIND_OUT,
        },
      }
    );

    await conn.commit();

    return {
      userId: result.outBinds.userId[0],
      fullName,
      npm: npm || null,
      email,
      role: 'MAHASISWA',
    };
  } catch (err) {
    if (conn) {
      await conn.rollback();
    }

    throw err;
  } finally {
    if (conn) {
      await conn.close();
    }
  }
}

module.exports = { registerUser };