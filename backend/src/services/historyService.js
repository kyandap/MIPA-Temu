const { getConnection } = require('../config/db');

async function getClaimHistory(user) {
  let conn;

  try {
    conn = await getConnection();

    let query = `
      SELECT *
      FROM VW_CLAIM_HISTORY
    `;
    let binds = {};

    if (user.role === 'MAHASISWA') {
      query += `
        WHERE CLAIM_ID IN (
          SELECT CLAIM_ID
          FROM CLAIMS
          WHERE USER_ID = :userId
        )
      `;
      binds.userId = user.userId;
    }

    query += ` ORDER BY CLAIM_DATE DESC`;

    const result = await conn.execute(query, binds);
    return result.rows;
  } finally {
    if (conn) await conn.close();
  }
}

async function getCustodyHistory(user) {
  let conn;

  try {
    conn = await getConnection();

    let query = `
      SELECT *
      FROM VW_CUSTODY_HISTORY
    `;
    let binds = {};

    if (user.role === 'MAHASISWA') {
      query += `
        WHERE ITEM_ID IN (
          SELECT ITEM_ID
          FROM ITEMS
          WHERE USER_ID = :userId
        )
      `;
      binds.userId = user.userId;
    } else if (user.role === 'PETUGAS') {
      query += `
        WHERE CUSTODY_ID IN (
          SELECT CUSTODY_ID
          FROM CUSTODY_RECORDS
          WHERE OFFICER_ID = :userId
        )
      `;
      binds.userId = user.userId;
    }

    query += ` ORDER BY CUSTODY_DATE DESC`;

    const result = await conn.execute(query, binds);
    return result.rows;
  } finally {
    if (conn) await conn.close();
  }
}

async function getHandoverHistory(user) {
  let conn;

  try {
    conn = await getConnection();

    let query = `
      SELECT *
      FROM VW_HANDOVER_HISTORY
    `;
    let binds = {};

    if (user.role === 'MAHASISWA') {
      query += `
        WHERE HANDOVER_ID IN (
          SELECT HANDOVER_ID
          FROM HANDOVER_RECORDS
          WHERE OWNER_ID = :userId
        )
      `;
      binds.userId = user.userId;
    } else if (user.role === 'PETUGAS') {
      query += `
        WHERE HANDOVER_ID IN (
          SELECT HANDOVER_ID
          FROM HANDOVER_RECORDS
          WHERE OFFICER_ID = :userId
        )
      `;
      binds.userId = user.userId;
    }

    query += ` ORDER BY HANDOVER_DATE DESC`;

    const result = await conn.execute(query, binds);
    return result.rows;
  } finally {
    if (conn) await conn.close();
  }
}

module.exports = {
  getClaimHistory,
  getCustodyHistory,
  getHandoverHistory,
};