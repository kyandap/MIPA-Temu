const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getConnection } = require('../config/db');

async function loginUser({ email, password }) {
  let conn;

  try {
    conn = await getConnection();

    const result = await conn.execute(
      `SELECT USER_ID, FULL_NAME, EMAIL, PASSWORD, ROLE
       FROM USERS
       WHERE LOWER(EMAIL) = LOWER(:email)`,
      { email }
    );

    if (result.rows.length === 0) {
      const error = new Error('Email atau password salah.');
      error.status = 401;
      throw error;
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(
      password,
      user.PASSWORD
    );

    if (!passwordMatch) {
      const error = new Error('Email atau password salah.');
      error.status = 401;
      throw error;
    }

    const token = jwt.sign(
      {
        userId: user.USER_ID,
        role: user.ROLE,
        fullName: user.FULL_NAME,
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    return {
      token,
      user: {
        userId: user.USER_ID,
        fullName: user.FULL_NAME,
        email: user.EMAIL,
        role: user.ROLE,
      },
    };
  } finally {
    if (conn) {
      await conn.close();
    }
  }
}

module.exports = { loginUser };