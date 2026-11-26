require('dotenv').config();
const bcrypt = require('bcryptjs');
const oracledb = require('oracledb');
const { getConnection } = require('../src/config/db');

async function migrate() {
  let conn;

  try {
    conn = await getConnection();

    const result = await conn.execute(
      `SELECT ITEM_ID, SECRET_ANSWER_HASH
       FROM ITEMS
       FOR UPDATE`
    );

    let migrated = 0;
    let skipped = 0;

    for (const row of result.rows) {
      const itemId = row.ITEM_ID;
      const answer = row.SECRET_ANSWER_HASH;

      if (/^\$2[aby]\$/.test(answer)) {
        skipped++;
        continue;
      }

      const hashedAnswer = await bcrypt.hash(answer, 12);

      await conn.execute(
        `UPDATE ITEMS
         SET SECRET_ANSWER_HASH = :hashedAnswer
         WHERE ITEM_ID = :itemId`,
        { hashedAnswer, itemId }
      );

      migrated++;
    }

    if (process.env.RUN_HASH_MIGRATION !== 'true') {
      await conn.rollback();

      console.log('DRY-RUN: Tidak ada perubahan permanen.');
      console.log(`Data yang akan dimigrasikan: ${migrated}`);
      console.log(`Data yang dilewati: ${skipped}`);
      return;
    }

    await conn.commit();

    console.log('Migrasi berhasil.');
    console.log(`Data yang dimigrasikan: ${migrated}`);
    console.log(`Data yang dilewati: ${skipped}`);
  } catch (err) {
    if (conn) {
      await conn.rollback();
    }

    console.error('Migrasi gagal.');
    process.exitCode = 1;
  } finally {
    if (conn) {
      await conn.close();
    }
  }
}

migrate();