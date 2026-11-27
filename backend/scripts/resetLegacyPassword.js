const bcrypt = require('bcryptjs');
const readline = require('readline');
const { getConnection } = require('../src/config/db');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Masukkan password baru: ', async (password) => {
  rl.close();

  if (!password || password.length < 8) {
    console.log('Password minimal 8 karakter.');
    return;
  }

  let conn;

  try {
    conn = await getConnection();

    const check = await conn.execute(
      `SELECT USER_ID, EMAIL FROM USERS WHERE USER_ID = 21`
    );

    if (
      check.rows.length === 0 ||
      check.rows[0].EMAIL.toLowerCase() !== 'kyan2559@gmail.com'
    ) {
      throw new Error('Identitas akun tidak sesuai.');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await conn.execute(
      `UPDATE USERS SET PASSWORD = :password WHERE USER_ID = 21`,
      { password: hashedPassword }
    );

    await conn.commit();

    console.log('Password akun berhasil diperbarui.');
  } catch (err) {
    if (conn) await conn.rollback();
    console.error('Reset gagal:', err.message);
  } finally {
    if (conn) await conn.close();
  }
});