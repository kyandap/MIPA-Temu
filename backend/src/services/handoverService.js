
const { getConnection } = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function createHandover({ itemId, officerId }) {
  let conn;

  try {
    conn = await getConnection();

    // Ambil pemilik dari klaim yang sudah disetujui
    const claimResult = await conn.execute(
      `SELECT USER_ID
       FROM CLAIMS
       WHERE ITEM_ID = :itemId
         AND CLAIM_STATUS = 'APPROVED'`,
      { itemId }
    );

    if (claimResult.rows.length === 0) {
      const err = new Error('Klaim disetujui tidak ditemukan.');
      err.status = 404;
      throw err;
    }

    const ownerId = claimResult.rows[0].USER_ID;

    // Generate kode dan hash di backend
    const code = crypto.randomInt(100000, 1000000).toString();
    const handoverCodeHash = await bcrypt.hash(code, 12);

    await conn.execute(
      `BEGIN
         SP_CREATE_HANDOVER(
           :itemId,
           :officerId,
           :ownerId,
           :handoverCodeHash
         );
       END;`,
      {
        itemId,
        officerId,
        ownerId,
        handoverCodeHash,
      }
    );

    await conn.commit();

    return {
      message: 'Serah terima berhasil dibuat.',
      ownerId,
      code,
    };
  } catch (err) {
    if (conn) await conn.rollback();
    throw err;
  } finally {
    if (conn) await conn.close();
  }
}

async function confirmHandover({ handoverId, ownerId }) {
  let conn;

  try {
    conn = await getConnection();

    const result = await conn.execute(
      `SELECT HANDOVER_ID, OWNER_ID, STATUS
       FROM HANDOVER_RECORDS
       WHERE HANDOVER_ID = :handoverId
       FOR UPDATE`,
      { handoverId }
    );

    if (result.rows.length === 0) {
      const err = new Error('Serah terima tidak ditemukan.');
      err.status = 404;
      throw err;
    }

    const handover = result.rows[0];

    if (handover.OWNER_ID !== ownerId) {
      const err = new Error('Anda bukan penerima serah terima ini.');
      err.status = 403;
      throw err;
    }

    if (handover.STATUS !== 'PENDING') {
      const err = new Error('Serah terima tidak lagi berstatus pending.');
      err.status = 400;
      throw err;
    }

    await conn.execute(
      `BEGIN
         SP_CONFIRM_HANDOVER(:handoverId);
       END;`,
      { handoverId }
    );

    await conn.commit();

    return { message: 'Serah terima berhasil dikonfirmasi.' };
  } catch (err) {
    if (conn) await conn.rollback();
    throw err;
  } finally {
    if (conn) await conn.close();
  }
}

module.exports = {
  createHandover,
  confirmHandover,
};
