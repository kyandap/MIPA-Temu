const bcrypt = require('bcryptjs');
const { getConnection } = require('../config/db');

async function getCategories() {
  let conn;

  try {
    conn = await getConnection();

    const result = await conn.execute(
      `SELECT CATEGORY_ID, CATEGORY_NAME
       FROM CATEGORIES
       ORDER BY CATEGORY_ID`
    );

    return result.rows;
  } finally {
    if (conn) {
      await conn.close();
    }
  }
}

async function getItems() {
  let conn;

  try {
    conn = await getConnection();

    const result = await conn.execute(
      `SELECT *
       FROM VW_ITEM_CATALOG
       ORDER BY ITEM_ID DESC`
    );

    return result.rows;
  } finally {
    if (conn) {
      await conn.close();
    }
  }
}

// Barang yang siap untuk proses serah terima oleh petugas
async function getItemsReadyForHandover() {
  let conn;

  try {
    conn = await getConnection();

    const result = await conn.execute(
      `SELECT
          i.ITEM_ID,
          i.ITEM_NAME,
          i.STATUS,
          c.USER_ID AS OWNER_ID,
          u.FULL_NAME AS OWNER_NAME,
          c.CLAIM_ID,
          c.CLAIM_STATUS,
          h.HANDOVER_ID,
          h.STATUS AS HANDOVER_STATUS
      FROM ITEMS i
      JOIN CLAIMS c
          ON i.ITEM_ID = c.ITEM_ID
      JOIN USERS u
          ON c.USER_ID = u.USER_ID
      LEFT JOIN HANDOVER_RECORDS h
          ON h.ITEM_ID = i.ITEM_ID
      WHERE c.CLAIM_STATUS = 'APPROVED'
        AND (
            (i.STATUS = 'CLAIM_APPROVED' AND h.HANDOVER_ID IS NULL)
            OR
            (i.STATUS = 'CLAIM_APPROVED' AND h.STATUS = 'PENDING')
            OR
            (i.STATUS = 'RETURNED' AND h.STATUS = 'COMPLETED')
        )
      ORDER BY i.ITEM_ID DESC`
    );

    return result.rows;
  } finally {
    if (conn) {
      await conn.close();
    }
  }
}

async function reportItem(data, userId) {
  let conn;

  try {
    conn = await getConnection();

    const hashedAnswer = await bcrypt.hash(data.secretAnswer, 12);

    await conn.execute(
      `INSERT INTO ITEMS (
        USER_ID,
        CATEGORY_ID,
        ITEM_NAME,
        DESCRIPTION,
        SECRET_QUESTION,
        SECRET_ANSWER_HASH,
        PHOTO,
        LOCATION_FOUND,
        DATE_FOUND,
        STATUS
      ) VALUES (
        :userId,
        :categoryId,
        :itemName,
        :description,
        :secretQuestion,
        :hashedAnswer,
        :photo,
        :locationFound,
        TO_DATE(:dateFound, 'YYYY-MM-DD'),
        'ACTIVE'
      )`,
      {
        userId,
        categoryId: data.categoryId,
        itemName: data.itemName,
        description: data.description || null,
        secretQuestion: data.secretQuestion,
        hashedAnswer,
        photo: data.photo || null,
        locationFound: data.locationFound,
        dateFound: data.dateFound,
      }
    );

    await conn.commit();

    return { message: 'Laporan barang berhasil ditambahkan.' };
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
  getCategories,
  getItems,
  getItemsReadyForHandover,
  reportItem,
};