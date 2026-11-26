const bcrypt = require('bcryptjs');
const { getConnection } = require('../config/db');

async function submitClaim(itemId, userId) {
  let conn;

  try {
    conn = await getConnection();

    await conn.execute(
      `BEGIN
         SP_SUBMIT_CLAIM(:itemId, :userId);
       END;`,
      { itemId, userId }
    );

    await conn.commit();

    return { message: 'Klaim berhasil diajukan.' };
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

async function verifyClaim(claimId, userId, secretAnswer) {
  let conn;

  try {
    conn = await getConnection();

    const result = await conn.execute(
      `SELECT C.CLAIM_ID, C.USER_ID, C.CLAIM_STATUS,
              I.SECRET_ANSWER_HASH
       FROM CLAIMS C
       JOIN ITEMS I ON C.ITEM_ID = I.ITEM_ID
       WHERE C.CLAIM_ID = :claimId`,
      { claimId }
    );

    if (result.rows.length === 0) {
      const error = new Error('Klaim tidak ditemukan.');
      error.status = 404;
      throw error;
    }

    const claim = result.rows[0];

    if (claim.USER_ID !== userId) {
      const error = new Error('Anda tidak memiliki akses ke klaim ini.');
      error.status = 403;
      throw error;
    }

    if (claim.CLAIM_STATUS !== 'PENDING') {
      const error = new Error('Klaim tidak dapat diverifikasi.');
      error.status = 400;
      throw error;
    }

    const isCorrect = await bcrypt.compare(
      secretAnswer,
      claim.SECRET_ANSWER_HASH
    );

    await conn.execute(
      `BEGIN
         SP_VERIFY_CLAIM(:claimId, :isCorrect);
       END;`,
      {
        claimId,
        isCorrect: isCorrect ? 1 : 0,
      }
    );

    await conn.commit();

    return {
      message: isCorrect
        ? 'Verifikasi jawaban berhasil.'
        : 'Jawaban tidak sesuai.',
      verified: isCorrect,
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

async function approveClaim(claimId) {
  let conn;

  try {
    conn = await getConnection();

    await conn.execute(
      `BEGIN
         SP_APPROVE_CLAIM(:claimId);
       END;`,
      { claimId }
    );

    await conn.commit();

    return { message: 'Klaim berhasil disetujui.' };
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

async function rejectClaim(claimId) {
  let conn;

  try {
    conn = await getConnection();

    await conn.execute(
      `BEGIN
         SP_REJECT_CLAIM(:claimId);
       END;`,
      { claimId }
    );

    await conn.commit();

    return { message: 'Klaim berhasil ditolak.' };
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

module.exports = {
  submitClaim,
  verifyClaim,
  approveClaim,
  rejectClaim,
};